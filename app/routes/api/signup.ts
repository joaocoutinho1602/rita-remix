import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import bcrypt from 'bcryptjs';

import {
    ErrorCodes,
    getSession,
    SignupErrors,
    GenericErrors,
    commitSession,
    logError,
} from '~/utils/common';
import { db } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const sessionPromise = getSession(request.headers.get('Cookie'));
        const bodyPromise = request.json();

        let [
            session,
            { firstName, lastName, email, password, doctorSpecialtyId },
        ] = await Promise.all([sessionPromise, bodyPromise]);

        const registeredUser = await db.user
            .findUnique({
                where: { email },
                select: { email: true },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/signup.ts',
                    message: `prisma error ~ SELECT email FROM user WHERE email=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        if (registeredUser?.email) {
            throw SignupErrors.EMAIL_ALREADY_REGISTERED;
        }

        const createdUser = await db.user
            .create({
                data: { firstName, lastName, email, password },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/signup.ts',
                    message: `prisma error ~ INSERT INTO User (firstName, lastName, email, password) VALUES (${firstName}, ${lastName}, ${email}, ${password})`,
                    error,
                });

                throw SignupErrors.ERROR_CREATING_USER;
            });

        await db.doctor
            .create({
                data: { userEmail: email, doctorSpecialtyId },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/signup.ts',
                    message: `prisma error ~ INSERT INTO Doctor (doctorSpecialtyId, userEmail) VALUES (${doctorSpecialtyId}, ${email})`,
                    error,
                });

                throw SignupErrors.ERROR_CREATING_DOCTOR;
            });

        session.set('userEmail', createdUser.email);

        const url = `/office?password=${bcrypt.hashSync(
            createdUser.password,
            10
        )}`;

        return redirect(url, {
            headers: { 'Set-Cookie': await commitSession(session) },
        });
    } catch (error) {
        switch (error) {
            case SignupErrors.EMAIL_ALREADY_REGISTERED: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: SignupErrors.EMAIL_ALREADY_REGISTERED,
                });
            }
            case SignupErrors.ERROR_CREATING_USER: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: SignupErrors.ERROR_CREATING_USER,
                });
            }
            case SignupErrors.ERROR_CREATING_DOCTOR: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: SignupErrors.ERROR_CREATING_DOCTOR,
                });
            }
            case GenericErrors.PRISMA_ERROR: {
                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.PRISMA_ERROR,
                });
            }
            default: {
                logError({
                    filePath: '/api/signup.ts',
                    message: 'loader error',
                    error,
                });

                return new Response(undefined, {
                    status: ErrorCodes.CUSTOM_ERROR,
                    statusText: GenericErrors.UNKNOWN_ERROR,
                });
            }
        }
    }
};
