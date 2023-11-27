import { json } from '@remix-run/node';
import type { LoaderFunction } from 'react-router';
import { db } from '~/utils/server';

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const res = await db.user.findUnique({
            where: {
                email: 'testuser1@test.com',
            },
            include: {
                doctor: {
                    include: {
                        locations: {
                            where: {
                                OR: [
                                    {
                                        alias: 'Online',
                                    },
                                    {
                                        address:
                                            'Rua Luís António Correia, nº 10, 6º frente, 4715-310, Nogueiró, Braga',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        });
        console.log('🚀 ~ file: query.ts:8 ~ res', res);

        return json(res);
    } catch (error) {
        return 'error';
    }
};
