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

const getSessionEmail = async (request: Request) =>
    (await getSession(request.headers.get('Cookie'))).get('userEmail');

export { getSession, commitSession, destroySession, getSessionEmail };
