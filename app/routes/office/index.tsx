import { useMemo, useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import {
    useLoaderData,
    useLocation,
    useNavigate,
    useOutletContext,
    useTransition,
} from '@remix-run/react';

import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import { uniqBy } from 'lodash';

import { Card, ColorSwatch, Indicator, Loader, Space } from '@mantine/core';
import { Calendar } from '@mantine/dates';

import { ConvertEventModal } from '~/components/ConvertEventModal';
import { DeleteAppointmentModal } from '~/components/DeleteAppointmentModal';

import type {
    EnhancedEvent,
    EnhancedPatient,
    EnhancedService,
} from '~/utils/common/types';
import {
    GenericErrors,
    getURL,
    googleAuthClient,
    googleCalendarAPI,
    GoogleErrors,
    getSelectionDate,
    logError,
    setGoogleCredentials,
} from '~/utils/common';
import { db, getSession, SessionData } from '~/utils/server';
import type { LoaderEvents } from '~/utils/server/office.index.loader.server';
import {
    eventsByDay,
    getEventsTimeSlice,
    mapEvents,
} from '~/utils/server/office.index.loader.server';

import styles from '~/styles/office/index.css';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const email = session.get(SessionData.EMAIL);
        if (!email?.length) {
            return redirect('/login');
        }

        const googleRefreshToken = session.get(
            SessionData.GOOGLE_REFRESH_TOKEN
        );
        if (!googleRefreshToken?.length) {
            /**
             * If the user is authenticated but we don't have their Google refresh token, we have to generate the Google authentication URL
             */
            const response = await fetch(
                `${getURL()}/api/google/generateAuthUrl`,
                {
                    method: 'GET',
                }
            );

            const { googleAuthorizationUrl } = await response.json();

            return json({ googleAuthorizationUrl });
        }

        setGoogleCredentials(googleRefreshToken);

        const user = await db.user
            .findUnique({
                where: { email },
                select: {
                    doctor: {
                        select: {
                            googleData: { select: { calendars: true } },
                            appointments: {
                                select: {
                                    id: true,
                                    googleEventId: true,
                                    date: true,
                                    location: true,
                                    service: true,
                                },
                            },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/index.tsx',
                    message: `prisma error - SELECT calendars FROM (SELECT googleData FROM (SELECT doctor FROM User WHERE email=${email}))`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const userCalendars = (user?.doctor?.googleData?.calendars || []).sort(
            (a) => (a.isMediciCalendar ? -1 : 1)
        );

        const allCalendarsPromise = googleCalendarAPI.calendarList
            .list()
            .catch(async (error) => {
                logError({
                    filePath: '/office/index.tsx',
                    message: 'googleCalendarAPI.calendarList error',
                    error,
                });

                throw GoogleErrors.ERROR_FETCHING_EVENTS;
            });

        const allColorsPromise = googleCalendarAPI.colors
            .get()
            .catch(async (error) => {
                logError({
                    filePath: '/office/index.tsx',
                    message: 'googleCalendarAPI.calendarList error',
                    error,
                });

                throw GoogleErrors.ERROR_FETCHING_EVENTS;
            });

        const [timeMin, timeMax] = getEventsTimeSlice(request.url);

        const allCalendarsEventsPromises = userCalendars.map(
            ({ googleCalendarId }) =>
                googleCalendarAPI.events
                    .list({
                        auth: googleAuthClient,
                        calendarId: googleCalendarId as string,
                        timeMin,
                        timeMax,
                    })
                    .catch(async (error) => {
                        logError({
                            filePath: '/office/index.tsx',
                            message: `googleCalendarAPI.events error ~ calendarId: ${googleCalendarId}, timeMin: ${timeMin}, timeMax: ${timeMax}`,
                            error,
                        });

                        throw GoogleErrors.ERROR_FETCHING_EVENTS;
                    })
        );

        const [allColors, allCalendars, ...allCalendarsEvents] =
            await Promise.all([
                allColorsPromise,
                allCalendarsPromise,
                ...allCalendarsEventsPromises,
            ]);

        const mappedEvents = mapEvents(
            userCalendars,
            allCalendars,
            allCalendarsEvents,
            allColors
        ).filter((event) => event.organizer);

        const uniqueEvents = uniqBy(
            mappedEvents,
            (event) => event.start?.dateTime || event.start?.date
        );

        const events = eventsByDay(uniqueEvents);

        return json({ events });
    } catch (error) {
        switch (error) {
            case GoogleErrors.ERROR_FETCHING_EVENTS: {
                return json({ error: GoogleErrors.ERROR_FETCHING_EVENTS });
            }
            default: {
                logError({
                    filePath: '/office/index.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

/**
 *? DST again
 */
function makeActualDate(date: Date) {
    const hoursToAdd = Math.floor(dayjs(date).utcOffset() / 60);
    return dayjs(date).add(hoursToAdd, 'hour').format('YYYY-MM-DD');
}

export default function OfficeIndex() {
    const { googleAuthorizationUrl, events, error } = useLoaderData<{
        googleAuthorizationUrl?: string;
        events?: LoaderEvents;
        error?: string;
    }>();

    const [value, setValue] = useState<Date | null>(new Date());

    const location = useLocation();
    const navigate = useNavigate();
    const transition = useTransition();
    const { services, patients } = useOutletContext<{
        services: EnhancedService[];
        patients: EnhancedPatient[];
    }>();

    const loadingEvents = useMemo((): boolean => {
        const queryParams = transition.location?.search
            ?.split('?')?.[1]
            ?.split('&');

        const selectionDate = queryParams
            ?.find((query) => query.split('=')?.[0] === 'selection')
            ?.split('=')?.[1];

        if (selectionDate?.length && dayjs(selectionDate).isValid()) {
            return true;
        } else {
            return false;
        }
    }, [transition.location?.search]);

    return (
        <div className="container">
            <div className="headerLoaderContainer">
                <h1>Calendário</h1>
                <Space w="sm" />
                {loadingEvents ? <Loader variant="oval" size="sm" /> : null}
            </div>
            <br />
            {googleAuthorizationUrl?.length ? (
                <div className="googleAccountAssociationContainer">
                    Esta conta ainda não está sincronizada com nenhuma conta
                    Google.
                    <div
                        className="googleAuthorizationLink"
                        onClick={() =>
                            window.location.assign(googleAuthorizationUrl)
                        }
                    >
                        Clique aqui para associar a sua conta Google
                    </div>
                </div>
            ) : error?.length ? (
                <div>
                    Houve algum problema ao buscar os eventos do seu calendário
                    Google
                </div>
            ) : (
                <Calendar
                    locale="pt"
                    value={value}
                    onChange={setValue}
                    onMonthChange={(value) => {
                        setValue(null);
                        const selection = dayjs(value).toISOString();
                        navigate(`/office?selection=${selection}`);
                    }}
                    firstDayOfWeek="sunday"
                    renderDay={(date) => {
                        const actualDate = makeActualDate(date);
                        const numberOfEvents = events?.[actualDate]?.length;

                        const selectionDate = getSelectionDate(location);

                        const indicatorColor =
                            dayjs(actualDate).month() ===
                            (selectionDate.length
                                ? dayjs(selectionDate).month()
                                : dayjs().month())
                                ? '#868e96'
                                : '#BDBDBD';

                        return (
                            <Indicator
                                size={16}
                                color={indicatorColor}
                                disabled={numberOfEvents === undefined}
                                label={`${numberOfEvents}`}
                                position="top-end"
                                offset={7}
                                zIndex={0}
                            >
                                <div>{date.getDate()}</div>
                            </Indicator>
                        );
                    }}
                />
            )}
            <br />
            {value && events?.[makeActualDate(value)]?.length ? (
                <div className="events">
                    <br />
                    {events?.[makeActualDate(value)].map(
                        (event, index, array) => {
                            const {
                                id,
                                summary,
                                start,
                                end,
                                color,
                                location,
                                mediciEventId,
                            } = event;
                            const startTime = dayjs(start?.dateTime).format(
                                'HH:mm'
                            );
                            const endTime = dayjs(end?.dateTime).format(
                                'HH:mm'
                            );

                            return (
                                <div className="eventCardContainer" key={id}>
                                    <Card
                                        shadow="0px 0px 10px 5px rgba(0,0,0,0.1)"
                                        radius="md"
                                    >
                                        <div className="eventCardHeaderContainer">
                                            <div className="colorSwatchTimeContainer">
                                                {color.length ? (
                                                    <ColorSwatch
                                                        size={20}
                                                        color={color}
                                                    />
                                                ) : null}
                                                <div className="eventTime">{`${startTime} - ${endTime}`}</div>
                                            </div>
                                            <div className="actions">
                                                {mediciEventId ? null : (
                                                    <ConvertEventModal
                                                        event={event}
                                                        services={services}
                                                        patients={patients}
                                                    />
                                                )}
                                                <DeleteAppointmentModal
                                                    event={
                                                        event as unknown as EnhancedEvent
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div>{summary}</div>
                                        <div className="locationText">
                                            {location}
                                        </div>
                                    </Card>
                                    <br />
                                </div>
                            );
                        }
                    )}
                </div>
            ) : null}
        </div>
    );
}
