import type { LinksFunction, LoaderArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import {
    IconCalendarEvent,
    IconCurrencyEuro,
    IconMapPin,
    IconUser,
} from '@tabler/icons';

import dayjs from 'dayjs';
import 'dayjs/locale/pt';

import type { PatientWithPatientsOnAppointments } from '~/utils/common/types';
import { db } from '~/utils/server';

import styles from '~/styles/office/$patientId.css';
import { Timeline } from '@mantine/core';

export const links: LinksFunction = () => {
    return [{ href: styles, rel: 'stylesheet' }];
};

export const loader = async ({ params }: LoaderArgs) => {
    try {
        const patient = await db.patient.findUnique({
            where: { id: params.patientId },
            select: {
                id: true,
                client: {
                    select: {
                        user: { select: { firstName: true, lastName: true } },
                    },
                },
                patientsOnAppointments: {
                    select: {
                        appointment: {
                            select: {
                                id: true,
                                price: true,
                                date: true,
                                duration: true,
                                location: { select: { alias: true } },
                                service: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        patient?.patientsOnAppointments.sort((a, b) =>
            a.appointment.date < b.appointment.date ? -1 : 1
        );

        return patient;
    } catch (error) {
        console.log('🚀 ~ file: $appointmentId.tsx:10 ~ error', error);
        return 'error';
    }
};

export default function PatientId() {
    //@ts-ignore
    const {
        client,
        patientsOnAppointments,
    }: PatientWithPatientsOnAppointments = useLoaderData();
    console.log(
        '🚀 ~ file: $appointmentId.tsx:44 ~ patientsOnAppointments',
        patientsOnAppointments
    );

    const navigate = useNavigate();

    function goToAppointment(id: string) {
        navigate(`/office/appointments/${id}`);
    }

    return (
        <div>
            <h1>Paciente</h1>
            <div className="info">
                <IconUser />
                {`${client.user.firstName} ${client.user.lastName}`}
            </div>
            <br />
            <div>Consultas</div>
            <br />
            <Timeline
                active={
                    patientsOnAppointments.findIndex(({ appointment }) =>
                        dayjs(appointment.date).isAfter(dayjs())
                    ) - 1
                }
            >
                {patientsOnAppointments.map(({ appointment }) => (
                    <Timeline.Item key={dayjs(appointment.date).toISOString()}>
                        <div
                            className="appointment"
                            onClick={() => goToAppointment(appointment.id)}
                        >
                            <IconCalendarEvent />
                            <div>
                                {dayjs(appointment.date)
                                    .locale('pt')
                                    .format('D MMMM, YYYY, HH:mm')}
                            </div>
                            <IconMapPin />
                            <div>{appointment.location.alias}</div>
                            <IconCurrencyEuro />
                            <div>{appointment.price}</div>
                        </div>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
}
