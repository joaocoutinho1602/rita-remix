import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import type { Location } from '@prisma/client';

import {
    setGoogleCredentials,
    googleCalendarAPI,
    getURL,
    GenericErrors,
    logError,
} from '~/utils/common';
import { db, getSession, SessionData } from '~/utils/server';

import { SettingsCalendars } from '~/components/SettingsCalendars';
import { SettingsLocations } from '~/components/SettingsLocations';

import styles from '~/styles/office/settings.css';
import settingsLocationsStyles from '~/components/SettingsLocations/styles.css';

export type CalendarsObject = {
    [key: string]: {
        id: string;
        selected: boolean;
        summary: string;
        description: string;
        backgroundColor: string;
        isMediciCalendar: boolean;
    };
};

export type CheckboxesObject = { [key: string]: boolean };

export function links() {
    return [
        { rel: 'stylesheet', href: styles },
        { rel: 'stylesheet', href: settingsLocationsStyles },
    ];
}

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const email = session.get(SessionData.EMAIL);
        const googleRefreshToken = session.get(
            SessionData.GOOGLE_REFRESH_TOKEN
        );

        if (!email?.length) {
            return redirect('/login');
        }

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

        /**
         * First we get all the Google calendars on Google and on Medici
         */
        const allcalendarsPromise = googleCalendarAPI.calendarList.list();

        const userPromise = db.user
            .findUnique({
                where: { email },
                select: {
                    doctor: {
                        select: {
                            googleData: {
                                select: {
                                    id: true,
                                    calendars: {
                                        select: {
                                            id: true,
                                            googleCalendarId: true,
                                            isMediciCalendar: true,
                                        },
                                        orderBy: {
                                            isMediciCalendar: 'asc',
                                        },
                                    },
                                },
                            },
                            locations: true,
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/settings.tsx',
                    message: `prisma error - SELECT (id, googleCalendarId, idMediciCalendar) FROM (SELECT calendars FROM (SELECT googleData From (SELECT doctor FROM User WHERE email=${email})))`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const [allCalendars, user] = await Promise.all([
            allcalendarsPromise,
            userPromise,
        ]);

        const selectedCalendars = user?.doctor?.googleData?.calendars;

        /**
         * We then extend the information of every Google calendar with wether they've been selected by the Doctor to be shown and set the flag for which is the Medici calendar
         */
        const calendarsArray = (allCalendars?.data?.items || []).map(
            ({ id, summary, description, backgroundColor }) => {
                const selectedCalendar = selectedCalendars?.find(
                    (calendar) => calendar.googleCalendarId === id
                );

                return {
                    id,
                    selected: selectedCalendar ? true : false,
                    summary,
                    description,
                    backgroundColor,
                    isMediciCalendar: selectedCalendar?.isMediciCalendar,
                };
            }
        );

        const calendarsInitialValue: CalendarsObject = {};
        /**
         * We then put the Medici calendar as the head of the list and create an object of calendars by ID
         */
        let calendars = calendarsArray
            .sort((a) => (a.isMediciCalendar ? -1 : 1))
            .reduce(
                (acc, curVal) =>
                    Object.assign({}, acc, {
                        [curVal.id as string]: curVal,
                    }),
                calendarsInitialValue
            );

        const checkboxesInitialValues: CheckboxesObject = {};
        /**
         * Lastly we create an object that represents the initial values for the checkboxes that are shown to the user
         */
        const loaderCheckboxes = Object.entries(calendars).reduce(
            (acc, [key, value]) =>
                Object.assign({}, acc, { [key]: value.selected }),
            checkboxesInitialValues
        );

        const loaderLocations = user?.doctor?.locations;

        return json({
            googleDataId: user?.doctor?.googleData?.id,
            calendars,
            loaderCheckboxes,
            loaderLocations,
        });
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return json({ error: GenericErrors.PRISMA_ERROR });
            }
            default: {
                logError({
                    filePath: '/office/settings.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

export default function Settings() {
    const {
        googleAuthorizationUrl,
        googleDataId,
        calendars,
        loaderCheckboxes,
        loaderLocations,
    } = useLoaderData<{
        googleDataId?: string;
        googleAuthorizationUrl?: string;
        calendars?: CalendarsObject;
        loaderCheckboxes?: CheckboxesObject;
        loaderLocations: Location[];
        error?: string;
    }>();

    return (
        <div>
            <h1>Definições</h1>
            <br />
            <SettingsCalendars
                googleAuthorizationUrl={googleAuthorizationUrl}
                googleDataId={googleDataId}
                calendars={calendars}
                loaderCheckboxes={loaderCheckboxes}
            />
            <br />
            <SettingsLocations loaderLocations={loaderLocations} />
            <br />
            {/* <Form method="post">
                <Button type="submit" name="action" value="deleteAccount">
                    Apagar Conta
                </Button>
            </Form> */}
        </div>
    );
}
