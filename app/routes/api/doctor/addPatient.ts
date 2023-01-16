import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { logError, GenericErrors, AddClientErrors } from '~/utils/common';
import { customResponse, db, getSession, SessionData } from '~/utils/server';

export async function action({ request }: ActionArgs) {
    try {
        const session = await getSession(request.headers.get('Cookie'));
        const doctorEmail = session.get(SessionData.EMAIL);

        const {
            firstName,
            lastName,
            email,
        }: { firstName: string; lastName: string; email: string } =
            await request.json();

        /**
         * First we need to check if there already is a User and/or a Client for this email
         */
        let [user, client] = await Promise.all([
            db.user
                .findUnique({
                    where: { email },
                    select: { email: true },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `SELECT email FROM User WHERE email={email}`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                }),
            db.client
                .findUnique({
                    where: {
                        userEmail: email,
                    },
                    select: {
                        userEmail: true,
                        patients: true,
                    },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `SELECT (userEmail, patients) FROM Client WHERE userEmail={email}`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                }),
        ]);

        /**
         * If there is no User, we generate a password using random.org and then create the User and send them the password
         */
        if (!user?.email) {
            const password = await fetch(
                'https://www.random.org/strings/?num=1&len=10&digits=on&upperalpha=on&loweralpha=on&unique=on&format=plain&rnd=new',
                { method: 'GET' }
            )
                .then(async (response) => {
                    const data = await response.body?.getReader()?.read();

                    const utf8Decoder = new TextDecoder('utf-8');

                    const password = utf8Decoder.decode(data?.value) || '';

                    return password;
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: 'error fetching string from random.org',
                        error,
                    });

                    throw GenericErrors.UNKNOWN_ERROR;
                });

            [user] = await Promise.all([
                db.user
                    .create({
                        data: { email, firstName, lastName, password },
                        select: { email: true },
                    })
                    .catch((error) => {
                        logError({
                            filePath: '/office.tsx',
                            message: `prisma error ~ INSERT INTO User (firstName, lastName, email, password) VALUES (${firstName}, ${lastName}, ${email}, ${password})`,
                            error,
                        });

                        throw GenericErrors.PRISMA_ERROR;
                    }),
                await fetch('/api/email/doctorCreatedAppointemnt', {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        password,
                        firstName,
                        lastName,
                    }),
                }),
            ]);
        }

        /**
         * If there is no Client, we need to create one
         */
        if (!client?.userEmail) {
            client = await db.client
                .create({
                    data: { userEmail: email },
                    select: { userEmail: true, patients: true },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `prisma error ~ INSERT INTO Client (userEmail) VALUES (${email})`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                });
        }

        /**
         * If there already is a Patient registered for this Client and associated with this Doctor, then there's nothing to create
         */
        if (
            client?.patients.find(
                ({ doctorEmail: thisDoctorEmail }) =>
                    thisDoctorEmail === doctorEmail
            )
        ) {
            throw AddClientErrors.IS_ALREADY_PATIENT;
        }

        /**
         * Lastly, we create a Patient related to the User and associated with the Doctor
         */
        await db.patient
            .create({
                data: { userEmail: email, doctorEmail },
                select: { id: true },
            })
            .catch((error) => {
                if (error !== GenericErrors.PRISMA_ERROR) {
                    logError({
                        filePath: '/office.tsx',
                        message: `prisma error ~ UPDATE Doctor SET patients=(INSERT INTO Patient (userEmail)) ${doctorEmail}`,
                        error,
                    });
                }

                throw GenericErrors.PRISMA_ERROR;
            });

        return json({ message: 'success' });
    } catch (error) {
        switch (error) {
            case AddClientErrors.IS_ALREADY_PATIENT: {
                return customResponse(AddClientErrors.IS_ALREADY_PATIENT);
            }
            case GenericErrors.PRISMA_ERROR: {
                return customResponse(GenericErrors.PRISMA_ERROR);
            }
            default: {
                logError({
                    filePath: '/office.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
}
