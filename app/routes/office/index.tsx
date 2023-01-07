import { useMemo, useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, useTransition } from '@remix-run/react';

import type { calendar_v3 } from 'googleapis';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
import { uniqBy } from 'lodash';

import { Indicator, Loader, Space } from '@mantine/core';
import { Calendar } from '@mantine/dates';

import { db } from '~/utils/server';

import {
    GenericErrors,
    getSession,
    getURL,
    googleAuthClient,
    googleCalendarAPI,
    GoogleErrors,
    logError,
    setCredentials,
} from '~/utils/common';

import styles from '~/styles/office/index.css';

type LoaderEvents = {
    [key: string]: calendar_v3.Schema$Event[];
};

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'));

    try {
        const email = session.get('userEmail');
        const googleRefreshToken = session.get('userGoogleRefreshToken');

        if (!email?.length) {
            return redirect('/login');
        }

        if (googleRefreshToken?.length) {
            setCredentials({ refreshToken: googleRefreshToken });

            // const url = new URL(request.url);

            // const selection =
            //     url.searchParams.get('selection') || dayjs().toISOString();

            /**
             *? Daylight Savings Time requires 1 hour to be added
             *? Thils will eventually have to be revised and standardised for all timezones in all countries and accounting for DST
             */
            // const timeMin = dayjs(selection)
            //     .subtract(0, 'month')
            //     .startOf('month')
            //     .add(1, 'hour')
            //     .toISOString();
            // const timeMax = dayjs(selection)
            //     .add(0, 'month')
            //     .endOf('month')
            //     .toISOString();

            const user = await db.user
                .findUnique({
                    where: { email },
                    select: {
                        doctor: {
                            select: {
                                googleData: { select: { calendars: true } },
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

            const allCalendarsEvents = await Promise.all(
                (user?.doctor?.googleData?.calendars || []).map(
                    ({ googleCalendarId }) =>
                        googleCalendarAPI.events
                            .list({
                                auth: googleAuthClient,
                                calendarId: googleCalendarId as string,
                                // timeMin,
                                // timeMax,
                            })
                            .catch(async (error) => {
                                logError({
                                    filePath: '/office/index.tsx',
                                    message: `googleCalendarAPI.events error ~ calendarId: ${googleCalendarId}`,
                                    error,
                                });

                                throw GoogleErrors.ERROR_FETCHING_EVENTS;
                            })
                )
            );

            const uniqueEvents = uniqBy(
                allCalendarsEvents.flatMap((item) =>
                    item ? item?.data?.items || [] : []
                ),
                (event) => event.start?.dateTime
            ).filter((event) => event.organizer);
            console.log('🚀 ~ file: index.tsx:125 ~ uniqueEvents', uniqueEvents)

            const reductionInitialValue: LoaderEvents = {};

            const events = uniqueEvents.reduce((acc, event) => {
                const eventDay =
                    event.start?.date ||
                    dayjs(event.start?.dateTime).toISOString().split('T')[0];

                /**
                 *? We need to take all the events already assigned to a given day, push the new event into it, and create a new object with the new event assigned to this day
                 */
                const dayEvents = acc[eventDay] || [];
                dayEvents.push(event);

                const res = Object.assign({}, acc, { [eventDay]: dayEvents });

                return res;
            }, reductionInitialValue);

            return json({ events });
        } else {
            /**
             ** If the user is authenticated but we don't have their Google refresh token, we have to generate the Google authentication URL
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
    return dayjs(date).add(hoursToAdd, 'hour').toISOString().split('T')[0];
}

export default function OfficeIndex() {
    const { googleAuthorizationUrl, events, error } = useLoaderData<{
        googleAuthorizationUrl?: string;
        events?: LoaderEvents;
        error?: string;
    }>();

    const [value, setValue] = useState<Date | null>(null);

    const navigate = useNavigate();
    const transition = useTransition();

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
        <div>
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
                        const selection = dayjs(value).toISOString();

                        navigate(`/office?selection=${selection}`);
                    }}
                    firstDayOfWeek="sunday"
                    renderDay={(date) => {
                        const actualDate = makeActualDate(date);
                        const numberOfEvents = events?.[actualDate]?.length;

                        return (
                            <Indicator
                                size={16}
                                color="red"
                                disabled={numberOfEvents === undefined}
                                label={`${numberOfEvents}`}
                                position="top-end"
                                offset={7}
                            >
                                <div>{date.getDate()}</div>
                            </Indicator>
                        );
                    }}
                />
            )}
            <br />
            {value && events?.[makeActualDate(value)]?.length ? (
                <div>
                    {events?.[makeActualDate(value)].map(
                        (
                            { id, summary, description, source, organizer },
                            index,
                            array
                        ) => (
                            <div key={id}>
                                <div>Título: {summary}</div>
                                <div>Descrição: {description}</div>
                                <div>Source title: {source?.title}</div>
                                <div>Source url: {source?.url}</div>
                                <div>Organizer: {organizer?.displayName}</div>
                                <div>Email: {organizer?.email}</div>
                                {array.length - 1 !== index ? <br /> : null}
                            </div>
                        )
                    )}
                </div>
            ) : null}
        </div>
    );
}
