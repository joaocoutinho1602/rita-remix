import { useMemo } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useTransition } from '@remix-run/react';

import { Loader, Space } from '@mantine/core';

import styles from '~/styles/office/clients.css';

import { GenericErrors, getSession, logError } from '~/utils/common';
import { db } from '~/utils/server';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'));

    try {
        const email = session.get('userEmail');

        if (!email?.length) {
            return redirect('/login');
        }

        const patients = await db.patient
            .findMany({
                where: { doctorEmail: email },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/index.tsx',
                    message: `prisma error - SELECT * FROM Patient WHERE doctorEmail='${email}'`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        return patients;
    } catch (error) {
        switch (error) {
            default: {
                logError({
                    filePath: '/office/index.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

export default function Clients() {
    const data = useLoaderData();
    console.log('🚀 ~ file: clients.tsx:17 ~ data', data);

    const transition = useTransition();

    const loadingEvents = useMemo(() => {
        console.log(
            '🚀 ~ file: clients.tsx:26 ~ transition.location?.search',
            transition.location?.search
        );

        return false;
    }, [transition.location?.search]);

    return (
        <div className="container">
            <div className="headerLoaderContainer">
                <h1>Clientes</h1>
                <Space w="sm" />
                {loadingEvents ? <Loader variant="oval" size="sm" /> : null}
            </div>
        </div>
    );
}
