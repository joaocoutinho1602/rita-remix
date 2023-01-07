import { useMemo, useState } from 'react';

import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { isEqual, uniqBy } from 'lodash';

import { Button, ColorSwatch, Checkbox } from '@mantine/core';

import { db } from '~/utils/server';

import {
    getSession,
    setCredentials,
    googleCalendarAPI,
    getURL,
    GenericErrors,
    logError,
    destroySession,
} from '~/utils/common';

import styles from '~/styles/office/settings.css';

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

        if (googleRefreshToken?.length) {
            setCredentials({ refreshToken: googleRefreshToken });

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

            const calendarsArray = uniqBy(
                allCalendars?.data?.items?.map(
                    ({ id, summary, description, backgroundColor }) => ({
                        id,
                        selected: selectedCalendars?.some(
                            (calendar) => calendar.googleCalendarId === id
                        ),
                        summary,
                        description,
                        backgroundColor,
                        isMediciCalendar: selectedCalendars?.find(
                            (calendar) => calendar.googleCalendarId === id
                        )?.isMediciCalendar,
                    })
                ),
                (calendar) => calendar.summary
            );

            const calendarsInitialValue: CalendarsObject = {};

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

const separator = '__separator__';
const delimiter = '__delimiter__';

export const action: ActionFunction = async ({ request }) => {
    console.log('🚀 ~ file: settings.tsx ~ line 179 ~ request', request);
    try {
        const [formData, session] = await Promise.all([
            request.formData(),
            getSession(request.headers.get('Cookie')),
        ]);

        const action = formData.get('action');
        const email = session.get('userEmail');

        switch (action) {
            case 'googleDataId': {
                const googleDataId = formData.get('googleDataId') as string;

                const checkboxesString = formData.getAll(
                    'checkboxes'
                )[0] as string;

                let newGoogleCalendars: { googleCalendarId: string }[] = [];
                let googleCalendarIdsToDelete: string[] = [];

                /**
                 * Parsing the value encoded in the workaround
                 */
                checkboxesString.split(delimiter).forEach((checkbox) =>
                    checkbox.split(separator)[1] === 'true'
                        ? newGoogleCalendars.push({
                              googleCalendarId: checkbox.split(separator)[0],
                          })
                        : googleCalendarIdsToDelete.push(
                              checkbox.split(separator)[0]
                          )
                );

                await db.googleData
                    .update({
                        where: { id: googleDataId },
                        data: {
                            calendars: {
                                createMany: {
                                    data: newGoogleCalendars,
                                },
                                deleteMany: {
                                    googleCalendarId: {
                                        in: googleCalendarIdsToDelete,
                                    },
                                },
                            },
                        },
                    })
                    .catch((error) => {
                        logError({
                            filePath: '/office/settings.tsx',
                            message: `prisma error - UPDATE googleData WHERE googleDataId=${googleDataId} CREATING ${newGoogleCalendars} AND DELETING ${googleCalendarIdsToDelete}`,
                            error,
                        });

                        throw GenericErrors.PRISMA_ERROR;
                    });

                return null;
            }
            case 'deleteAccount': {
                // const [user, doctor, client] = await Promise.all([
                //     db.user.findUnique({ where: { email } }).catch((error) => {
                //         logError({
                //             filePath: '/office/settings.tsx',
                //             message: `prisma error - SELECT * FROM User WHERE email=${email}`,
                //             error,
                //         });

                //         throw GenericErrors.PRISMA_ERROR;
                //     }),
                //     db.doctor
                //         .findUnique({ where: { userEmail: email } })
                //         .catch((error) => {
                //             logError({
                //                 filePath: '/office/settings.tsx',
                //                 message: `prisma error - SELECT * FROM Doctor WHERE email=${email}`,
                //                 error,
                //             });

                //             throw GenericErrors.PRISMA_ERROR;
                //         }),
                //     db.client
                //         .findUnique({ where: { userEmail: email } })
                //         .catch((error) => {
                //             logError({
                //                 filePath: '/office/settings.tsx',
                //                 message: `prisma error - SELECT * FROM Client WHERE email=${email}`,
                //                 error,
                //             });

                //             throw GenericErrors.PRISMA_ERROR;
                //         }),
                // ]);

                // let deleteUserPromise,
                //     deleteDoctorPromise,
                //     deleteClientPromise,
                //     deleteGoogleDataPromise;

                // if (doctor?.userEmail) {

                // }

                const something = await db.user
                    .delete({ where: { email } })
                    .catch((error) => {
                        logError({
                            filePath: '/office/settings.tsx',
                            message: `prisma error - DELETE User WHERE email=${email}`,
                            error,
                        });

                        throw GenericErrors.PRISMA_ERROR;
                    });
                console.log(
                    '🚀 ~ file: settings.tsx ~ line 296 ~ something',
                    something
                );

                return redirect('/login', {
                    headers: {
                        'Set-Cookie': await destroySession(session),
                    },
                });
            }
        }
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return json({ error: GenericErrors.PRISMA_ERROR });
            }
            default: {
                logError({
                    filePath: '/office/settings.tsx',
                    message: 'action googleDataId unknown error',
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

    /**
     * This workaround is needed because Mantine checkboxes won't
     * send values through to Remix's action if all checkboxes are
     * false or disabled.
     * This generates the following string:
     * {calendarId}__separator__{value}__delimiter__{calendarId}__separator__{value}
     * It excludes the Medici calendar
     */
    const checkboxesValue = useMemo(
        () =>
            Object.entries(checkboxes).reduce(
                (acc, [id, value], index, array) =>
                    acc +
                    (data?.calendars?.[id].isMediciCalendar
                        ? ''
                        : `${id}${separator}${value}` +
                          (index !== array.length - 1 ? delimiter : '')),
                ''
            ),
        [checkboxes, data?.calendars]
    );

    return (
        <div>
            <h1>Definições</h1>
            <br />
            <h2>Calendários</h2>
            <h5>
                Defina aqui quais os calendários que aparecem na sua página
                principal
            </h5>
            <Form method="post">
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
                                <ColorSwatch color={backgroundColor} />
                                <div className="summary">{summary}</div>
                            </div>
                        )
                    )}
                </div>
                <br />
                {/**
                 * These hidden inputs carry the checkbox string and the Google Data ID through to the Remix action
                 */}
                <input
                    hidden
                    readOnly
                    name="checkboxes"
                    value={checkboxesValue}
                />
                <input
                    hidden
                    readOnly
                    name="googleDataId"
                    value={data?.googleDataId}
                />
                <Button
                    type="submit"
                    name="action"
                    value="googleDataId"
                    disabled={saveButtonDisabled}
                >
                    Salvar
                </Button>
            </Form>
            <br />
            <Form method="post">
                <Button type="submit" name="action" value="deleteAccount">
                    Apagar Conta
                </Button>
            </Form>
        </div>
    );
}
