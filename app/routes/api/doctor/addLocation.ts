import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import { logError, GenericErrors, AddClientErrors } from '~/utils/common';
import { customResponse, db, getSession, SessionData } from '~/utils/server';

export async function action({ request }: ActionArgs) {
    try {
        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        const { alias, address }: { alias: string; address: string } =
            await request.json();

        /**
         * We can simply create the location since we already have client-side validation that this is a valid address for this Doctor
         */
        await db.location.create({
            data: { alias, address, doctorEmail: email },
        });

        return 'OK';
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
