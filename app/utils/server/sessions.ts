import { createCookieSessionStorage } from '@remix-run/node';

const { getSession, commitSession, destroySession } =
    createCookieSessionStorage({
        cookie: {
            name: '__session',
            httpOnly: true,
            maxAge: 36000,
            path: '/',
            sameSite: 'lax',
            secrets: ['s3cret1'],
            secure: true,
        },
    });

const SessionData = {
    ID: 'userId',
    EMAIL: 'userEmail',
    GOOGLE_REFRESH_TOKEN: 'userGoogleRefreshToken',
}

export { getSession, commitSession, destroySession, SessionData };
