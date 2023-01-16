import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import bcrypt from 'bcryptjs';

import { SignupErrors, GenericErrors, logError } from '~/utils/common';
import { getSession, commitSession, customResponse, db } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const {
            firstName,
            lastName,
            email,
            password,
            doctorSpecialtyId,
        }: {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            doctorSpecialtyId: string;
        } = await request.json();

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

        /**
         * If the User is already registered with Medici, then they can't signup again
         */
        if (registeredUser?.email) {
            throw SignupErrors.EMAIL_ALREADY_REGISTERED;
        }

        /**
         * If they aren't, then create them
         */
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

        /**
         * If the User is also registering as a Doctor, then create it and add the default location of Online
         */
        if (doctorSpecialtyId?.length) {
            await db.doctor
                .create({
                    data: {
                        userEmail: email,
                        doctorSpecialtyId,
                        locations: { create: { alias: 'Online' } },
                    },
                })
                .catch((error) => {
                    logError({
                        filePath: '/api/signup.ts',
                        message: `prisma error ~ INSERT INTO Doctor (doctorSpecialtyId, userEmail) VALUES (${doctorSpecialtyId}, ${email})`,
                        error,
                    });

                    throw SignupErrors.ERROR_CREATING_DOCTOR;
                });
        }

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
                return customResponse(SignupErrors.EMAIL_ALREADY_REGISTERED);
            }
            case SignupErrors.ERROR_CREATING_USER: {
                return customResponse(SignupErrors.ERROR_CREATING_USER);
            }
            case SignupErrors.ERROR_CREATING_DOCTOR: {
                return customResponse(SignupErrors.ERROR_CREATING_DOCTOR);
            }
            case GenericErrors.PRISMA_ERROR: {
                return customResponse(GenericErrors.PRISMA_ERROR);
            }
            default: {
                logError({
                    filePath: '/api/signup.ts',
                    message: 'action error',
                    error,
                });

                return customResponse(GenericErrors.UNKNOWN_ERROR);
            }
        }
    }
};
