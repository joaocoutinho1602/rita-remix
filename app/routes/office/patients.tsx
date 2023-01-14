import { useMemo, useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useTransition } from '@remix-run/react';

import { Card, Loader, Space } from '@mantine/core';

import { GenericErrors, getSession, logError } from '~/utils/common';
import { db } from '~/utils/server';

import styles from '~/styles/office/patients.css';

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
                select: {
                    client: {
                        select: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
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

type LoaderPatients = {
    client: {
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}[];

export default function Patients() {
    const data: LoaderPatients = useLoaderData();
    const transition = useTransition();

    const [nameSearch, setNameSearch] = useState('');

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
                <h1>Pacientes</h1>
                <Space w="sm" />
                {loadingEvents ? <Loader variant="oval" size="sm" /> : null}
            </div>
            <input
                type="text"
                onChange={(e) => setNameSearch(e.target.value)}
            />
            <br />
            <br />
            <div className="patients">
                {data
                    .filter(
                        ({
                            client: {
                                user: { email, firstName, lastName },
                            },
                        }) => `${firstName} ${lastName}`.includes(nameSearch)
                    )
                    .map(
                        (
                            {
                                client: {
                                    user: { email, firstName, lastName },
                                },
                            },
                            index
                        ) => (
                            <div
                                className="patientCardContainer"
                                key={`${email}_${index}`}
                            >
                                <Card shadow="0px 0px 10px 5px rgba(0,0,0,0.1)">
                                    <div>
                                        Nome: {firstName} {lastName}
                                    </div>
                                </Card>
                                <br />
                            </div>
                        )
                    )}
            </div>
        </div>
    );
}
