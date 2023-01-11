import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import {
    destroySession,
    ErrorCodes,
    GenericErrors,
    getSession,
} from '~/utils/common';

export const action: ActionFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        return redirect('/login', {
            headers: {
                'Set-Cookie': await destroySession(session),
            },
        });
    } catch (error) {
        console.log('🚀 ~ file: /api/logout.ts ~ error\n\n', error);

        return new Response(undefined, {
            status: ErrorCodes.CUSTOM_ERROR,
            statusText: GenericErrors.UNKNOWN_ERROR,
        });
    }
};
