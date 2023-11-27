import type { LinksFunction, LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
    IconCalendarEvent,
    IconMapPin,
    IconUser,
    IconUsers,
} from '@tabler/icons';

import dayjs from 'dayjs';
import 'dayjs/locale/pt';

import type { EnhancedAppointment } from '~/utils/common/types';
import { db } from '~/utils/server';

import styles from '~/styles/office/$appointmentId.css';

export const links: LinksFunction = () => {
    return [{ href: styles, rel: 'stylesheet' }];
};

export const loader = async ({ params }: LoaderArgs) => {
    try {
        const appointment = await db.appointment.findUnique({
            where: { id: params.appointmentId },
            select: {
                id: true,
                date: true,
                location: { select: { alias: true } },
                patientsOnAppointments: {
                    select: {
                        patient: {
                            select: {
                                id: true,
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
        });

        return appointment;
    } catch (error) {
        console.log('🚀 ~ file: $appointmentId.tsx:10 ~ error', error);
        return 'error';
    }
};

export default function AppointmentId() {
    const { date, location, patientsOnAppointments }: EnhancedAppointment =
        useLoaderData();
    const navigate = useNavigate();
    console.log(
        '🚀 ~ file: $appointmentId.tsx:61 ~ patientsOnAppointments',
        patientsOnAppointments
    );

    function goToPatient(id: string) {
        navigate(`/office/patients/${id}`);
    }

    return (
        <div>
            <h1>Consulta</h1>
            <div className="info">
                {patientsOnAppointments.length > 1 ? (
                    <IconUsers />
                ) : (
                    <IconUser />
                )}
                <div className="patients">
                    {patientsOnAppointments.map(({ patient }, index) => (
                        <div key={patient.id} className="patientContainer">
                            <div
                                className="patientName"
                                onClick={() => goToPatient(patient.id)}
                            >
                                {`${patient.client.user.firstName} ${patient.client.user.lastName}`}
                            </div>
                            {patientsOnAppointments.length ===
                            index + 1 ? null : (
                                <div>{', '}</div>
                            )}
                        </div>
                    ))}
                </div>
                <IconCalendarEvent />
                <div>{dayjs(date).locale('pt').format('D MMMM, YYYY')}</div>
                <IconMapPin />
                <div>{location.alias}</div>
            </div>
        </div>
    );
}
