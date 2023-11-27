import { useMemo, useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate, useTransition } from '@remix-run/react';

import { Card, Loader, Space } from '@mantine/core';
import { IconUser } from '@tabler/icons';

import type { EnhancedPatient } from '~/utils/common/types';
import { GenericErrors, logError } from '~/utils/common';
import { db, getSession, SessionData } from '~/utils/server';

import styles from '~/styles/office/patients.css';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const email = session.get(SessionData.EMAIL);

        if (!email?.length) {
            return redirect('/login');
        }

        const patients = await db.patient
            .findMany({
                where: { doctorEmail: email },
                select: {
                    id: true,
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

type LoaderPatients = EnhancedPatient[];

export default function Patients() {
    const data: LoaderPatients = useLoaderData();
    const transition = useTransition();
    const navigate = useNavigate();

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
                        ({
                            id,
                            client: {
                                user: { email, firstName, lastName },
                            },
                        }) => (
                            <div className="patientCardContainer" key={id}>
                                <Card
                                    shadow="0px 0px 10px 5px rgba(0,0,0,0.1)"
                                    onClick={() => navigate(`${id}`)}
                                >
                                    <div className="info">
                                        <IconUser />
                                        <div>
                                            {firstName} {lastName}
                                        </div>
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
