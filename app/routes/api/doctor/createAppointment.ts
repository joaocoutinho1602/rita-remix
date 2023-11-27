import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import {
    AppointmentErrors,
    GenericErrors,
    logError,
    googleCalendarAPI,
    setGoogleCredentials,
    prismaErrorThrow,
    googleErrorThrow,
} from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
} from '~/utils/server';

import type { CreateAppointmentModalForm } from '~/components/CreateAppointmentModal/CreateAppointmentModal';
import dayjs from 'dayjs';

const filePath = '/api/doctor/createAppointment';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return GenericErrors.UNAUTHORIZED;
        }

        const session = await getSession(request.headers.get('Cookie'));
        const doctorEmail = session.get(SessionData.EMAIL);
        const googleRefreshToken = session.get(
            SessionData.GOOGLE_REFRESH_TOKEN
        );
        setGoogleCredentials(googleRefreshToken);

        const {
            patients,
            service,
            duration,
            location,
            price,
            date,
            time,
        }: CreateAppointmentModalForm = await request.json();

        if (!patients?.length) {
            return customError(AppointmentErrors.MISSING_INPUT_PATIENTS);
        }
        if (!service?.length) {
            return customError(AppointmentErrors.MISSING_INPUT_SERVICE);
        }
        if (!(duration && duration > 0)) {
            return customError(AppointmentErrors.MISSING_INPUT_DURATION);
        }
        if (!location?.length) {
            return customError(AppointmentErrors.MISSING_INPUT_LOCATION);
        }
        if (!(price && price > 0)) {
            return customError(AppointmentErrors.MISSING_INPUT_PRICE);
        }
        if (!date) {
            return customError(AppointmentErrors.MISSING_INPUT_DATE);
        }
        if (!time) {
            return customError(AppointmentErrors.MISSING_INPUT_TIME);
        }

        const year = dayjs(date).year();
        const month = dayjs(date).month();
        const day = dayjs(date).date();
        const hour = dayjs(time).hour();
        const minute = dayjs(time).minute();

        const startTime = dayjs()
            .set('year', year)
            .set('month', month)
            .set('date', day)
            .set('hour', hour)
            .set('minute', minute)
            .set('seconds', 0)
            .set('millisecond', 0);
        const endTime = startTime.add(duration, 'minute');

        const doctor = await db.doctor
            .findUnique({
                where: { userEmail: doctorEmail },
                select: {
                    googleData: {
                        select: {
                            calendars: {
                                where: { isMediciCalendar: true },
                                select: {
                                    id: true,
                                    isMediciCalendar: true,
                                    googleCalendarId: true,
                                },
                            },
                        },
                    },
                },
            })
            .catch(prismaErrorThrow(filePath + ':105'));

        const patientsFromPrisma = await db.patient.findMany({
            where: { id: { in: patients } },
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
        });

        const attendees = patientsFromPrisma.map((patient) => ({
            id: patient.id,
            email: patient.client.user.email,
            displayName: `${patient.client.user.firstName} ${patient.client.user.lastName}`,
        }));

        const createPatientsOnAppointmentsData = patients.map((id) => ({
            patientId: id,
        }));

        const createdAppointment = await db.appointment
            .create({
                data: {
                    doctor: { connect: { userEmail: doctorEmail } },
                    date: startTime.toISOString(),
                    duration,
                    service: { connect: { id: service } },
                    location: { connect: { id: location } },
                    price,
                    patientsOnAppointments: {
                        createMany: {
                            data: createPatientsOnAppointmentsData,
                        },
                    },
                },
                select: { id: true },
            })
            .catch(prismaErrorThrow(filePath + ':156'));

        const mediciCalendar = doctor?.googleData?.calendars?.find(
            (calendar) => calendar.isMediciCalendar
        );
        const mediciCalendarId = mediciCalendar?.id || '';
        const mediciGoogleCalendarId = mediciCalendar?.googleCalendarId;

        await googleCalendarAPI.events
            .insert({
                calendarId: mediciGoogleCalendarId,
                requestBody: {
                    attendees,
                    start: { dateTime: startTime.toISOString() },
                    end: { dateTime: endTime.toISOString() },
                    extendedProperties: {
                        private: {
                            mediciCalendarId: mediciCalendarId,
                            mediciEventId: createdAppointment.id,
                        },
                    },
                },
            })
            .then(async (event) => {
                await db.appointment.update({
                    where: { id: createdAppointment.id },
                    data: { googleEventId: event.data.id || '' },
                });
            })
            .catch(async (error) => {
                await db.appointment.delete({
                    where: { id: createdAppointment.id },
                });

                googleErrorThrow(filePath + ':181')(error);
            });

        return json(createdAppointment);
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR:
            case GenericErrors.GOOGLE_ERROR: {
                break;
            }
            default: {
                logError({
                    filePath,
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });
            }
        }

        return customError();
    }
};
