import type { ActionArgs } from '@remix-run/node';

import type { AddPatientForm } from '~/components/AddPatientModal/AddPatientModal';

import { logError, GenericErrors, AddClientErrors, PatientErrors } from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
    generatePassword,
} from '~/utils/server';

export async function action({ request }: ActionArgs) {
    try {
        if (await isUnauthorized(request)) {
            return GenericErrors.UNAUTHORIZED;
        }

        const session = await getSession(request.headers.get('Cookie'));
        const doctorEmail = session.get(SessionData.EMAIL);

        const { firstName, lastName, email, phone }: AddPatientForm =
            await request.json();

        if (!firstName.length) {
            return customError(PatientErrors.MISSING_INPUT_FIRSTNAME);
        }
        if (!lastName.length) {
            return customError(PatientErrors.MISSING_INPUT_LASTNAME);
        }
        if (!email.length) {
            return customError(PatientErrors.MISSING_INPUT_EMAIL);
        }
        if (!phone.length) {
            return customError(PatientErrors.MISSING_INPUT_PHONE);
        }

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
                    logError({ filePath: '/api/doctor/addPatient', error });
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
                    logError({ filePath: '/api/doctor/addPatient', error });
                    throw GenericErrors.PRISMA_ERROR;
                }),
        ]);

        /**
         * If there already is a Patient registered for this Client and associated with this Doctor, then there's nothing to do
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
         * If there is no User, we generate a password and then create the User and send them the password
         */
        if (!user?.email) {
            const password = generatePassword();

            await fetch('/api/email/password', {
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    password,
                }),
            }).catch(() => {
                return customError(GenericErrors.NODEMAILER_ERROR);
            });

            user = await db.user
                .create({
                    data: { email, firstName, lastName, password, phone },
                    select: { email: true },
                })
                .catch((error) => {
                    logError({ filePath: '/api/doctor/addPatient', error });
                    throw GenericErrors.PRISMA_ERROR;
                });
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
                    logError({ filePath: '/api/doctor/addPatient', error });
                    throw GenericErrors.PRISMA_ERROR;
                });
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
                logError({ filePath: '/api/doctor/addPatient', error });
                throw GenericErrors.PRISMA_ERROR;
            });

        return 'OK';
    } catch (error) {
        switch (error) {
            case AddClientErrors.IS_ALREADY_PATIENT: {
                return customError(AddClientErrors.IS_ALREADY_PATIENT);
            }
            case GenericErrors.PRISMA_ERROR: {
                return customError(GenericErrors.PRISMA_ERROR);
            }
            default: {
                logError({
                    filePath: '/api/doctor/addPatient',
                    message: 'loader unknown error',
                    error,
                });

                return customError();
            }
        }
    }
}
