import { db } from '~/utils/server/db.server';

import { GoogleErrors, getSession, GenericErrors } from '~/utils/common';

type GetUserRefreshTokenArgs = {
    request: Request;
};

export async function getUserRefreshToken({
    request,
}: GetUserRefreshTokenArgs) {
    const session = await getSession(request.headers.get('Cookie'));

    let refreshToken = session.get('userGoogleRefreshToken');

    if (!(refreshToken && refreshToken.length)) {
        const email = session.get('userEmail');

        const user = await getUserRefreshTokenFromDatabase(email);

        if (!user?.doctor?.googleData?.refreshToken?.length) {
            throw GoogleErrors.NO_REFRESH_TOKEN;
        }

        refreshToken = user.doctor.googleData.refreshToken.length;

        session.set('userGoogleRefreshToken', refreshToken);
    }

    return refreshToken;
}

type GetUserRefreshTokenFromDatabase = { email: string };

export async function getUserRefreshTokenFromDatabase({
    email,
}: GetUserRefreshTokenFromDatabase) {
    return await db.user
        .findUnique({
            where: { email },
            select: {
                doctor: {
                    select: {
                        googleData: { select: { refreshToken: true } },
                    },
                },
            },
        })
        .catch((error) => {
            console.log(
                `🚀 ~ file: ~/utils/server/functions/user.server.ts :: getUserRefreshTokenFromDatabase ~ prisma error - SELECT refreshToken FROM User WHERE email=${email}\n\n`,
                error
            );

            throw GenericErrors.PRISMA_ERROR;
        });
}
