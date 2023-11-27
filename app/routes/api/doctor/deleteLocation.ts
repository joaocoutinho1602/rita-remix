import type { ActionFunction } from '@remix-run/router';
import { GenericErrors, logError } from '~/utils/common';
import { customError, db, isUnauthorized } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return customError(GenericErrors.UNAUTHORIZED);
        }

        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId') as string;

        await db.location
            .delete({ where: { id: locationId } })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/deleteLocation',
                    message: `prisma error ~ delete location where id=${locationId}`,
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
                    filePath: '/api/doctor/deleteLocation',
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
};
