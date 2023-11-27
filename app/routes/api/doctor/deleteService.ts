import type { ActionFunction } from '@remix-run/node';

import { GenericErrors, logError, ServiceErrors } from '~/utils/common';
import { customError, db, isUnauthorized } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return customError(GenericErrors.UNAUTHORIZED);
        }

        const url = new URL(request.url);
        const serviceId = url.searchParams.get('serviceId');

        if (!serviceId?.length) {
            return customError(ServiceErrors.MISSING_PARAM_ID);
        }

        await db.service
            .delete({
                where: { id: serviceId },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/deleteService',
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
                    filePath: '/api/doctor/deleteService',
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
};
