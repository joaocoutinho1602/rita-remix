import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { GenericErrors, getSessionEmail, logError } from '~/utils/common';
import { db } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    try {
        const email = await getSessionEmail(request);

        const {
            checkboxes,
            googleDataId,
        }: {
            checkboxes: { [googleCalendarId: string]: boolean };
            googleDataId: string;
        } = await request.json();

        const user = await db.user.findUnique({
            where: { email },
            select: {
                doctor: {
                    select: { googleData: { select: { calendars: true } } },
                },
            },
        });
        const savedCalendars = user?.doctor?.googleData?.calendars;

        let calendarsToAdd: { googleCalendarId: string }[] = [];
        let calendarsToDelete: string[] = [];

        Object.entries(checkboxes).forEach(([calendarId, shouldKeep]) => {
            const calendarIsSaved = savedCalendars?.find(
                (calendar) => calendar.googleCalendarId === calendarId
            );

            if (shouldKeep) {
                /**
                 * If the calendar should be kept and it can't be found in the already saved calendars, then add it to the calendars to add
                 */
                if (!calendarIsSaved) {
                    calendarsToAdd.push({ googleCalendarId: calendarId });
                }
            } else {
                /**
                 * If the calendar shouldn't be kept and it is in the already saved calendars, then add it to the calendars to delete
                 */
                if (calendarIsSaved) {
                    calendarsToDelete.push(calendarId);
                }
            }
            /**
             * In every other case there is nothing to do
             */
        });

        await db.googleData
            .update({
                where: { id: googleDataId },
                data: {
                    calendars: {
                        createMany: {
                            data: calendarsToAdd,
                        },
                        deleteMany: {
                            googleCalendarId: {
                                in: calendarsToDelete,
                            },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/settings.tsx',
                    message: `prisma error - UPDATE googleData WHERE googleDataId=${googleDataId} CREATING ${calendarsToAdd} AND DELETING ${calendarsToDelete}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        return null;
        // case 'deleteAccount': {
        //     const [user, doctor, client] = await Promise.all([
        //         db.user.findUnique({ where: { email } }).catch((error) => {
        //             logError({
        //                 filePath: '/office/settings.tsx',
        //                 message: `prisma error - SELECT * FROM User WHERE email=${email}`,
        //                 error,
        //             });

        //             throw GenericErrors.PRISMA_ERROR;
        //         }),
        //         db.doctor
        //             .findUnique({ where: { userEmail: email } })
        //             .catch((error) => {
        //                 logError({
        //                     filePath: '/office/settings.tsx',
        //                     message: `prisma error - SELECT * FROM Doctor WHERE email=${email}`,
        //                     error,
        //                 });

        //                 throw GenericErrors.PRISMA_ERROR;
        //             }),
        //         db.client
        //             .findUnique({ where: { userEmail: email } })
        //             .catch((error) => {
        //                 logError({
        //                     filePath: '/office/settings.tsx',
        //                     message: `prisma error - SELECT * FROM Client WHERE email=${email}`,
        //                     error,
        //                 });

        //                 throw GenericErrors.PRISMA_ERROR;
        //             }),
        //     ]);

        //     let deleteUserPromise,
        //         deleteDoctorPromise,
        //         deleteClientPromise,
        //         deleteGoogleDataPromise;

        //     if (doctor?.userEmail) {

        //     }

        //     const something = await db.user
        //         .delete({ where: { email } })
        //         .catch((error) => {
        //             logError({
        //                 filePath: '/office/settings.tsx',
        //                 message: `prisma error - DELETE User WHERE email=${email}`,
        //                 error,
        //             });

        //             throw GenericErrors.PRISMA_ERROR;
        //         });
        //     console.log(
        //         '🚀 ~ file: settings.tsx ~ line 296 ~ something',
        //         something
        //     );

        //     return redirect('/login', {
        //         headers: {
        //             'Set-Cookie': await destroySession(session),
        //         },
        //     });
        // }
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return json({ error: GenericErrors.PRISMA_ERROR });
            }
            default: {
                logError({
                    filePath: '/office/settings.tsx',
                    message: 'action googleDataId unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};
