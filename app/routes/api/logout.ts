import type { ActionFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { destroySession } from '~/utils/server';

export const action: ActionFunction = async ({ request }) =>
    redirect('/login', {
        headers: {
            'Set-Cookie': await destroySession(request),
        },
    });
