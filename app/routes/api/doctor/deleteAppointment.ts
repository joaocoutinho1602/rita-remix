import type { ActionFunction } from '@remix-run/node';

import type { DeleteAppointmentRequestBody } from '~/components/DeleteAppointmentModal/DeleteAppointmentModal';

import {
    GenericErrors,
    googleCalendarAPI,
    googleErrorThrow,
    logError,
    prismaErrorThrow,
    setGoogleCredentials,
} from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
} from '~/utils/server';

const filePath = '/api/doctor/deleteAppointment';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return GenericErrors.UNAUTHORIZED;
        }

        const session = await getSession(request.headers.get('Cookie'));
        const googleRefreshToken = session.get(
            SessionData.GOOGLE_REFRESH_TOKEN
        );
        setGoogleCredentials(googleRefreshToken);

        const {
            googleCalendarId,
            googleEventId,
            mediciEventId,
        }: DeleteAppointmentRequestBody = await request.json();

        await Promise.all([
            googleCalendarAPI.events
                .delete({
                    calendarId: googleCalendarId,
                    eventId: googleEventId,
                })
                .catch(googleErrorThrow(filePath)),
            db.appointment
                .delete({ where: { id: mediciEventId } })
                .catch(prismaErrorThrow(filePath)),
        ]);

        return 'OK';
    } catch (error) {
        switch (error) {
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
