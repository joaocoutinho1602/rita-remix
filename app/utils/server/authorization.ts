import { getSession, SessionData } from './sessions';

export const isUnauthorized = async (request: Request) => {
    const session = await getSession(request.headers.get('Cookie'));
    const email = session.get(SessionData.EMAIL);

    if (!email?.length) {
        return true;
    }
};
