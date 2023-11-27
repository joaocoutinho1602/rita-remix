import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import bcrypt from 'bcryptjs';

import {
    ErrorCodes,
    GenericErrors,
    LoginErrors,
    logError,
} from '~/utils/common';
import { commitSession, db, getSession, SessionData } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const { email, password, keepLoggedIn, fromLocalStorage } =
            await request.json();

        const user = await db.user
            .findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    doctor: {
                        select: {
                            googleData: { select: { refreshToken: true } },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/login.ts',
                    message: `prisma error - SELECT password FROM User WHERE email=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        /**
         * If the database returns no user, then the email is not registered
         */
        if (!user) {
            throw LoginErrors.EMAIL_NOT_REGISTERED;
        }

        /**
         * If the password came from local storage but the hash doesn't match the password in the database, then the hash is wrong and the user must resubmit the password
         */
        if (fromLocalStorage && !bcrypt.compareSync(user.password, password)) {
            throw LoginErrors.WRONG_HASH;
        }

        /**
         * If the password doesn't come from local storage and it doesn't match the password in the database, then the user inputted the wrong password
         */
        if (!fromLocalStorage && user.password !== password) {
            throw LoginErrors.WRONG_PASSWORD;
        }

        /**
         * If the email and the password match, set the email and the refresh token in session and redirect the user to the home page
         */
        session.set(SessionData.ID, user.id);
        session.set(SessionData.EMAIL, user.email);

        const refreshToken = user.doctor?.googleData?.refreshToken;
        if (refreshToken) {
            session.set(SessionData.GOOGLE_REFRESH_TOKEN, refreshToken);
        }

        /**
         * If the user wants to stay logged in on their device, we send a hash of their password to be kept in local storage
         */
        const url = `/office${
            keepLoggedIn ? `?password=${bcrypt.hashSync(password, 10)}` : ''
        }`;

        return redirect(url, {
            headers: { 'Set-Cookie': await commitSession(session) },
        });
    } catch (error) {
        switch (error) {
            case LoginErrors.EMAIL_NOT_REGISTERED: {
                logError({
                    filePath: '/api/login.ts',
                    message: LoginErrors.EMAIL_NOT_REGISTERED,
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: LoginErrors.EMAIL_NOT_REGISTERED,
                    headers: {
                        statusText: LoginErrors.EMAIL_NOT_REGISTERED,
                    },
                });
            }
            case LoginErrors.WRONG_HASH: {
                logError({
                    filePath: '/api/login.ts',
                    message: LoginErrors.WRONG_HASH,
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: LoginErrors.WRONG_HASH,
                    headers: {
                        statusText: LoginErrors.WRONG_HASH,
                    },
                });
            }
            case LoginErrors.WRONG_PASSWORD: {
                logError({
                    filePath: '/api/login.ts',
                    message: LoginErrors.WRONG_PASSWORD,
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: LoginErrors.WRONG_PASSWORD,
                    headers: {
                        statusText: LoginErrors.WRONG_PASSWORD,
                    },
                });
            }
            case GenericErrors.PRISMA_ERROR: {
                logError({
                    filePath: '/api/login.ts',
                    message: GenericErrors.PRISMA_ERROR,
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.PRISMA_ERROR,
                    headers: {
                        statusText: GenericErrors.PRISMA_ERROR,
                    },
                });
            }
            default: {
                logError({
                    filePath: '/api/login.ts',
                    message: 'loader error',
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.UNKNOWN_ERROR,
                    headers: {
                        statusText: GenericErrors.UNKNOWN_ERROR,
                    },
                });
            }
        }
    }
};
