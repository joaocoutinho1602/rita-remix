import { useMemo } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate, useTransition } from '@remix-run/react';

import { Card, Loader, Space } from '@mantine/core';

import type { EnhancedAppointment } from '~/utils/common/types';
import { GenericErrors, logError } from '~/utils/common';
import { db, getSession, SessionData } from '~/utils/server';

import styles from '~/styles/office/appointments.css';
import {
    IconUsers,
    IconUser,
    IconCalendarEvent,
    IconMapPin,
} from '@tabler/icons';
import dayjs from 'dayjs';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const email = await session.get(SessionData.EMAIL);

        const appointments = await db.appointment
            .findMany({
                where: { doctor: { userEmail: email } },
                select: {
                    id: true,
                    date: true,
                    location: { select: { alias: true } },
                    patientsOnAppointments: {
                        select: {
                            patient: {
                                select: {
                                    client: {
                                        select: {
                                            user: {
                                                select: {
                                                    firstName: true,
                                                    lastName: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/appointments.tsx',
                    message: `prisma error - SELECT * FROM Appointment WHERE doctorId='${email}'`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });
        console.log(
            '🚀 ~ file: appointments.tsx:39 ~ appointments',
            appointments
        );

        return appointments;
    } catch (error) {
        switch (error) {
            default: {
                logError({
                    filePath: '/office/appointments.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

type AppointmentsLoader = EnhancedAppointment[];

export default function Appointments() {
    const data: AppointmentsLoader = useLoaderData();
    const transition = useTransition();
    const navigate = useNavigate();

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
                <h1>Consultas</h1>
                <Space w="sm" />
                {loadingEvents ? <Loader variant="oval" size="sm" /> : null}
            </div>
            <br />
            <br />
            <div className="appointments">
                {data.map((appointment, index) => {
                    const { id, date, patientsOnAppointments, location } =
                        appointment;
                    return (
                        <div
                            className="appointmentCardContainer"
                            key={appointment.id}
                        >
                            <Card
                                shadow="0px 0px 10px 5px rgba(0,0,0,0.1)"
                                onClick={() => navigate(`${id}`)}
                            >
                                <div className="info">
                                    {patientsOnAppointments.length > 1 ? (
                                        <IconUsers />
                                    ) : (
                                        <IconUser />
                                    )}
                                    <div>
                                        {patientsOnAppointments
                                            .map(
                                                ({ patient }) =>
                                                    `${patient.client.user.firstName} ${patient.client.user.lastName}`
                                            )
                                            .join(', ')}
                                    </div>
                                    <IconCalendarEvent />
                                    <div>
                                        {`${dayjs(date)
                                            .locale('pt')
                                            .format('D MMMM, YYYY')}`}
                                    </div>
                                    <IconMapPin />
                                    <div>{location.alias}</div>
                                </div>
                            </Card>
                            <br />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
