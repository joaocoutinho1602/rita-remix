import type { LoaderFunction } from '@remix-run/node';

import { googleAuthClient } from '~/utils/common';

export const loader: LoaderFunction = async () => {
    const scope = ['https://www.googleapis.com/auth/calendar'];

    const googleAuthorizationUrl = googleAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope,
    });

    return { googleAuthorizationUrl };
};
