import { redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

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
        const { searchParams } = new URL(request.url, getURL());

        const code = searchParams.get('code') || '';

        const { tokens } = await googleAuthClient.getToken(code);

        googleAuthClient.setCredentials(tokens);

        const session = await getSession(request.headers.get('Cookie'));

        if (tokens.access_token) {
            session.set('userGoogleAccessToken', tokens.access_token);
        }

        if (tokens.refresh_token) {
            session.set('userGoogleRefreshToken', tokens.refresh_token);

            const email = session.get('userEmail');

            const user = await db.user
                .findUnique({
                    where: { email },
                    select: {
                        doctor: {
                            select: {
                                id: true,
                                googleData: true,
                            },
                        },
                    },
                })
                .catch((error) => {
                    logError({
                        filePath: '/api/google/getTokens',
                        message: `prisma error ~ SELECT id, googleData FROM (SELECT doctor FROM User WHERE email=${email})`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                });

            if (user?.doctor?.id && !user?.doctor?.googleData?.refreshToken) {
                const [mediciCalendar, userGoogleData] = await Promise.all([
                    googleCalendarAPI.calendars.insert({
                        requestBody: {
                            summary: 'Medici',
                            description: 'Calendário Medici',
                        },
                    }),
                    db.googleData
                        .create({
                            data: {
                                doctorId: user?.doctor?.id,
                                refreshToken: tokens.refresh_token,
                            },
                        })
                        .catch((error) => {
                            logError({
                                filePath: '/api/google/getTokens',
                                message: `prisma error ~ CREATE DOCTOR GOOGLE DATA`,
                                error,
                            });

                            throw GenericErrors.PRISMA_ERROR;
                        }),
                ]);

                await db.user
                    .update({
                        where: { email },
                        data: {
                            doctor: {
                                update: {
                                    googleData: {
                                        update: {
                                            id: userGoogleData.id,
                                            calendars: {
                                                create: {
                                                    isMediciCalendar: true,
                                                    googleCalendarId:
                                                        mediciCalendar.data
                                                            .id as string,
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
                            filePath: '/api/google/getTokens',
                            message: `prisma error ~ UPDATE Doctor VALUES (mediciCalendar) WHERE email=${email}`,
                            error,
                        });

                        throw GenericErrors.PRISMA_ERROR;
                    });
            }
        }

        return redirect('/office', {
            headers: { 'Set-Cookie': await commitSession(session) },
        });
    } catch (error) {
        if (
            typeof error === 'string' &&
            [GenericErrors.PRISMA_ERROR as string].includes(error)
        ) {
            logError({
                filePath: '/api/google/getTokens.ts',
                message: 'loader error',
                error,
            });
        }

        switch (error) {
            default: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.UNKNOWN_ERROR,
                });
            }
        }
    }
};
