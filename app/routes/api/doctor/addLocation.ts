import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { logError, GenericErrors, LocationErrors } from '~/utils/common';
import { customError, db, getSession, SessionData } from '~/utils/server';
import { isUnauthorized } from '~/utils/server';

export async function action({ request }: ActionArgs) {
    try {
        if (await isUnauthorized(request)) {
            return customError(GenericErrors.UNAUTHORIZED);
        }

        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        const { alias, address }: { alias: string; address: string } =
            await request.json();

        if (!alias?.length) {
            return customError(LocationErrors.MISSING_INPUT_ALIAS);
        }
        if (!address?.length) {
            return customError(LocationErrors.MISSING_INPUT_ADDRESS);
        }

        const doctor = await db.doctor
            .findUnique({
                where: {
                    userEmail: email,
                },
                include: {
                    locations: {
                        where: {
                            OR: [{ alias }, { address }],
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/addLocation',
                    message: `findMany location where alias=${alias} or address=${address}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const locations = doctor?.locations || [];
        if (locations.some((location) => location.alias === alias)) {
            return customError(LocationErrors.ALIAS_ALREADY_EXISTS);
        }
        if (locations.some((location) => location.address === address)) {
            return customError(LocationErrors.ADDRESS_ALREADY_EXISTS);
        }

        const newLocation = await db.location
            .create({
                data: { alias, address, doctorEmail: email },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/addLocation',
                    message: `create location, values alias=${alias}, address=${address}, doctorEmail=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        return json({
            id: newLocation.id,
            doctorEmail: newLocation.doctorEmail,
            createdAt: newLocation.createdAt,
            updatedAt: newLocation.updatedAt,
        });
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR:
            default: {
                logError({
                    filePath: '/api/doctor/addLocation',
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
}
