import type { ActionFunction } from '@remix-run/node';
import { GenericErrors, LocationErrors, logError } from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
} from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return customError(GenericErrors.UNAUTHORIZED);
        }

        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId') as string;
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
                        where: { OR: [{ alias }, { address }] },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/editLocation',
                    message: `findUnique doctor where userEmail=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const locations = doctor?.locations || [];

        if (
            locations.some(
                (location) =>
                    location.alias === alias && location.id !== locationId
            )
        ) {
            return customError(LocationErrors.ALIAS_ALREADY_EXISTS);
        }
        if (
            locations.some(
                (location) =>
                    location.address === address && location.id !== locationId
            )
        ) {
            return customError(LocationErrors.ADDRESS_ALREADY_EXISTS);
        }

        await db.location
            .update({ where: { id: locationId }, data: { alias, address } })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/editLocation',
                    message: `prisma error ~ update location where locationId=${locationId}, values alias=${alias}, address=${address}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        return 'OK';
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR:
            default: {
                logError({
                    filePath: '/api/doctor/editLocation',
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
};
