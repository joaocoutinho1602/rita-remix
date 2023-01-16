import type { ActionFunction } from '@remix-run/router';
import { GenericErrors, logError } from '~/utils/common';
import { customResponse, db, getSession, SessionData } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        if (!(email?.length > 0)) {
            throw GenericErrors.UNAUTHORIZED;
        }

        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId') as string;

        await db.location
            .delete({ where: { id: locationId } })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/deleteLocation',
                    message: `prisma error ~ DELETE FROM Location WHERE (locationId=${locationId})`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return customResponse(GenericErrors.PRISMA_ERROR);
            }
            case GenericErrors.UNAUTHORIZED: {
                return customResponse(GenericErrors.UNAUTHORIZED);
            }
            default: {
                logError({
                    filePath: '/api/doctor/deleteLocation',
                    message: 'unknown action error',
                    error,
                });

                return customResponse(GenericErrors.UNKNOWN_ERROR);
            }
        }
    }
};
