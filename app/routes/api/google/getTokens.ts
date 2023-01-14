import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import {
    commitSession,
    ErrorCodes,
    GenericErrors,
    getSession,
    getURL,
    googleAuthClient,
    googleCalendarAPI,
    logError,
} from '~/utils/common';
import { db } from '~/utils/server';

export const loader: LoaderFunction = async ({ request, context }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const { searchParams } = new URL(request.url, getURL());
        const code = searchParams.get('code') || '';

        const { tokens } = await googleAuthClient.getToken(code);

        if (!tokens.refresh_token) {
            logError({
                filePath: '/api/google/getTokens',
                message: `No Google refresh token, logging tokens`,
                error: tokens,
            });

            throw GenericErrors.GOOGLE_ERROR;
        } else {
            googleAuthClient.setCredentials(tokens);
            /**
             * Once we have Google's credentials for this user, we need to follow a series of steps in order to fully onboard the user with Medici. We need to:
             * 
             * 1. Have the user's Google refresh token stored in our DB
             * 2. Have a Medici calendar on their Google account
             * 3. Store the Medici calendar's information in our DB
             * 
             * There will be situations in which a user is only refreshing their Google credentials with Medici, but the calendar already exists on Google, in which case we mustn't create duplicates. There is a bunch of logic below to deal with these edge cases 
             */
            session.set('userGoogleRefreshToken', tokens.refresh_token);
            const email = session.get('userEmail');

            /**
             * Store the Google refresh token in the DB, either update it or create it
             */
            const userPromise = db.user
                .update({
                    where: { email },
                    data: {
                        doctor: {
                            update: {
                                googleData: {
                                    upsert: {
                                        update: {
                                            refreshToken: tokens.refresh_token,
                                        },
                                        create: {
                                            refreshToken: tokens.refresh_token,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        doctor: {
                            select: {
                                googleData: { select: { calendars: true } },
                                id: true,
                            },
                        },
                    },
                })
                .catch((error) => {
                    logError({
                        filePath: '/api/google/getTokens',
                        message: `prisma error ~ CREATE DOCTOR GOOGLE DATA`,
                        error,
                    });

                    throw GenericErrors.GOOGLE_ERROR;
                });

            /**
             * Check if there already is a Medici calendar with Google
             */
            const googleCalendarsPromise = googleCalendarAPI.calendarList
                .list()
                .catch((error) => {
                    logError({
                        filePath: '/api/google/getTokens',
                        message: `prisma error ~ CREATE DOCTOR GOOGLE DATA`,
                        error,
                    });

                    throw GenericErrors.GOOGLE_ERROR;
                });

            const [user, googleCalendars] = await Promise.all([
                userPromise,
                googleCalendarsPromise,
            ]);

            const googleMediciCalendar = googleCalendars.data.items?.find(
                ({ summary, description }) =>
                    summary === 'Medici' && description === 'Calendário Medici'
            );

            /**
             * If there is not yet a Medici calendar with Google, create one
             */
            if (!googleMediciCalendar?.id) {
                const googleMediciCalendar = await googleCalendarAPI.calendars
                    .insert({
                        requestBody: {
                            summary: 'Medici',
                            description: 'Calendário Medici',
                        },
                    })
                    .catch((error) => {
                        logError({
                            filePath: '/api/google/getTokens',
                            message: `prisma error ~ CREATE DOCTOR GOOGLE DATA`,
                            error,
                        });

                        throw GenericErrors.GOOGLE_ERROR;
                    });

                if (!googleMediciCalendar.data.id) {
                    logError({
                        filePath: '/api/google/getTokens',
                        message:
                            'No Google Medici Calendar ID, logging the calendar',
                        error: googleMediciCalendar,
                    });

                    throw GenericErrors.GOOGLE_ERROR;
                }

                /**
                 * If there isn't a Medici calendar with Google, then there can't be one with Medici
                 */
                await db.googleData.update({
                    where: { doctorId: user?.doctor?.id },
                    data: {
                        calendars: {
                            create: {
                                googleCalendarId: googleMediciCalendar.data.id,
                                isMediciCalendar: true,
                            },
                        },
                    },
                });
            } else {
                /**
                 * If there already is a Medici calendar with Google, then we must check if the same calendar is also with Medici
                 */
                const dbMediciCalendar =
                    user?.doctor?.googleData?.calendars.find(
                        ({ googleCalendarId }) =>
                            googleCalendarId === googleMediciCalendar.id
                    );

                /**
                 * If there isn't, that's weird. But let's store it there anyway
                 */
                if (!dbMediciCalendar) {
                    await db.googleData.update({
                        where: { doctorId: user?.doctor?.id },
                        data: {
                            calendars: {
                                create: {
                                    googleCalendarId: googleMediciCalendar.id,
                                    isMediciCalendar: true,
                                },
                            },
                        },
                    });
                }
            }
        }

        return redirect('/office', {
            headers: { 'Set-Cookie': await commitSession(session) },
        });
    } catch (error) {
        switch (error) {
            case GenericErrors.GOOGLE_ERROR: {
                redirect(`/office?googleError=true`);
                break;
            }
            default: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.UNKNOWN_ERROR,
                });
            }
        }
    }
};
