import type { ActionFunction } from '@remix-run/node';
import { GenericErrors, logError } from '~/utils/common';
import { customResponse, db, getSession, SessionData } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        if (!email?.length) {
            throw GenericErrors.UNAUTHORIZED;
        }

        const { alias, address } = await request.json();
        const url = new URL(request.url);
        const locationId = url.searchParams.get('locationId') as string;

        await db.location
            .update({ where: { id: locationId }, data: { alias, address } })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/editLocation',
                    message: `prisma error ~ UPDATE Location WHERE (locationId='${locationId}') VALUES (alias, address) (${alias}, ${address})`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        return 'success';
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
                    filePath: '/api/doctor/editLocation',
                    message: 'unknown action error',
                    error,
                });

                return customResponse(GenericErrors.UNKNOWN_ERROR);
            }
        }
    }
};
