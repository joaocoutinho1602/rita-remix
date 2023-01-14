import { useMemo, useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { isEqual } from 'lodash';

import { Button, ColorSwatch, Checkbox } from '@mantine/core';

import {
    getSession,
    setCredentials,
    googleCalendarAPI,
    getURL,
    GenericErrors,
    logError,
} from '~/utils/common';
import { db } from '~/utils/server';
import type { CustomFormEvent} from '~/utils/client';
import { handleError } from '~/utils/client';

import styles from '~/styles/office/settings.css';
import { showNotification } from '@mantine/notifications';

type CalendarsObject = {
    [key: string]: {
        id: string;
        selected: boolean;
        summary: string;
        description: string;
        backgroundColor: string;
        isMediciCalendar: boolean;
    };
};

type CheckboxesObject = { [key: string]: boolean };

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

        setCredentials({ refreshToken: googleRefreshToken });

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
        const checkboxes = Object.entries(calendars).reduce(
            (acc, [key, value]) =>
                Object.assign({}, acc, { [key]: value.selected }),
            checkboxesInitialValues
        );

        return json({
            googleDataId: user?.doctor?.googleData?.id,
            calendars,
            checkboxes,
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
    const data = useLoaderData<{
        googleDataId?: string;
        calendars?: CalendarsObject;
        checkboxes?: CheckboxesObject;
        googleAuthorizationUrl?: string;
        error?: string;
    }>();

    const [checkboxes, setCheckboxes] = useState<{ [key: string]: boolean }>(
        data?.checkboxes || {}
    );

    const saveButtonDisabled = useMemo(
        () => isEqual(data?.checkboxes || {}, checkboxes),
        [checkboxes, data?.checkboxes]
    );

    async function submit(e: CustomFormEvent) {
        e.preventDefault();

        await fetch('/api/doctor/showCalendars', {
            method: 'POST',
            body: JSON.stringify({
                checkboxes,
                googleDataId: data?.googleDataId,
            }),
        })
            .then((response) => {
                handleError(response);
                showNotification({
                    message: 'Alterações submetidas com sucesso',
                    color: 'green',
                });
            })
            .catch(() => {
                showNotification({
                    title: 'Algo de errado aconteceu',
                    message:
                        'Por favor, volte a tentar submeter as alterações. Entretanto, já estamos em cima do assunto.',
                    color: 'yellow',
                });
            });
    }

    return (
        <div>
            <h1>Definições</h1>
            <br />
            <h2>Calendários</h2>
            <h5>
                Defina aqui quais os calendários que aparecem na sua página
                principal
            </h5>
            <form onSubmit={submit}>
                <div className="calendar">
                    {Object.values(data?.calendars || {})?.map(
                        ({
                            id,
                            summary,
                            description,
                            backgroundColor,
                            isMediciCalendar,
                        }) => (
                            <div key={id} className="row">
                                <Checkbox
                                    checked={checkboxes[id]}
                                    disabled={isMediciCalendar}
                                    onChange={() =>
                                        setCheckboxes(
                                            Object.assign({}, checkboxes, {
                                                [id]: !checkboxes[id],
                                            })
                                        )
                                    }
                                />
                                <ColorSwatch color={backgroundColor} size={18} />
                                <div className="summary">{summary}</div>
                            </div>
                        )
                    )}
                </div>
                <br />
                <Button
                    type="submit"
                    name="action"
                    value="googleDataId"
                    disabled={saveButtonDisabled}
                    onClick={submit}
                >
                    Salvar
                </Button>
            </form>
            <br />
            <br />
            <h2>Localizações</h2>
            <h5>Aqui pode gerir as localizações onde dá consultas</h5>
            <br />
            <br />
            <br />
            {/* <Form method="post">
                <Button type="submit" name="action" value="deleteAccount">
                    Apagar Conta
                </Button>
            </Form> */}
        </div>
    );
}
