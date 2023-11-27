import { useState } from 'react';

import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Link, Outlet, useLoaderData, useNavigate } from '@remix-run/react';

import {
    AppShell,
    Burger,
    Divider,
    Group,
    Header,
    Loader,
    MediaQuery,
    Navbar,
    ScrollArea,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
    IconAdjustmentsHorizontal,
    IconCalendar,
    IconCalendarPlus,
    IconGraph,
    IconReportMedical,
    IconStethoscope,
    IconUserPlus,
    IconUsers,
} from '@tabler/icons';

import {
    ErrorCodes,
    GenericErrors,
    getURL,
    googleCalendarAPI,
    logError,
    setGoogleCredentials,
} from '~/utils/common';
import type {
    CalendarsObject,
    EnhancedLocation,
    EnhancedPatient,
    EnhancedService,
} from '~/utils/common/types';
import { db, getSession, SessionData } from '~/utils/server';

import { AddPatientModal } from '~/components/AddPatientModal';
import { CreateAppointmentModal } from '~/components/CreateAppointmentModal';

import styles from '~/styles/office.css';
import { useOutletTransitioning } from '~/utils/client/hooks';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export type OfficeLoaderData = {
    googleDataId?: string;
    googleAuthorizationUrl?: string;
    calendars: CalendarsObject;
    loaderLocations: EnhancedLocation[];
    loaderServices: EnhancedService[];
    patients: EnhancedPatient[];
};

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const session = await getSession(request.headers.get('Cookie'));

        const email = session.get(SessionData.EMAIL);
        const googleRefreshToken = session.get(
            SessionData.GOOGLE_REFRESH_TOKEN
        );

        if (!email?.length) {
            return redirect('/login');
        }

        if (!googleRefreshToken?.length) {
            /**
             * If the user is authenticated but we don't have their Google refresh token, we have to generate the Google authentication URL
             */
            const response = await fetch(
                `${getURL()}/api/google/generateAuthUrl`,
                {
                    method: 'GET',
                }
            );

            const { googleAuthorizationUrl } = await response.json();

            return json({ googleAuthorizationUrl });
        }

        setGoogleCredentials(googleRefreshToken);

        /**
         * First we get all the Google calendars on Google and on Medici
         */
        const allCalendarsPromise = googleCalendarAPI.calendarList.list();

        const doctorPromise = db.doctor
            .findUnique({
                where: { userEmail: email },
                select: {
                    patients: {
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
                    locations: {
                        include: {
                            servicesOnLocationsWithPricing: {
                                include: {
                                    location: true,
                                    service: true,
                                    pricing: true,
                                },
                            },
                        },
                    },
                    services: {
                        include: {
                            servicesOnLocationsWithPricing: {
                                include: {
                                    service: true,
                                    location: true,
                                    pricing: true,
                                },
                            },
                        },
                    },
                    googleData: {
                        select: {
                            id: true,
                            calendars: {
                                select: {
                                    id: true,
                                    googleCalendarId: true,
                                    isMediciCalendar: true,
                                },
                            },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/settings.tsx',
                    message: `prisma error - findUnique user where email=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const [allCalendars, doctor] = await Promise.all([
            allCalendarsPromise,
            doctorPromise,
        ]);

        const selectedCalendars = doctor?.googleData?.calendars;

        /**
         * We then extend the information of every Google calendar with wether they've been selected by the Doctor to be shown and set the flag for which is the Medici calendar
         */
        const calendarsArray = (allCalendars?.data?.items || []).map(
            ({ id, summary, description, backgroundColor }) => {
                const selectedCalendar = selectedCalendars?.find(
                    (calendar) => calendar.googleCalendarId === id
                );

                return {
                    id,
                    selected: selectedCalendar ? true : false,
                    summary,
                    description,
                    backgroundColor,
                    isMediciCalendar: selectedCalendar?.isMediciCalendar,
                };
            }
        );

        const calendarsInitialValue: CalendarsObject = {};
        /**
         * We then put the Medici calendar as the head of the list and create an object of calendars by ID
         */
        let calendars = calendarsArray
            .sort((a) => (a.isMediciCalendar ? -1 : 1))
            .reduce(
                (acc, curVal) =>
                    Object.assign({}, acc, {
                        [curVal.id as string]: curVal,
                    }),
                calendarsInitialValue
            );

        /**
         * Sort locations by created date ascending and put Online last
         */
        const loaderLocations =
            doctor?.locations
                ?.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
                ?.sort((a) => (a.alias === 'Online' ? 1 : -1)) || [];
        const loaderServices =
            doctor?.services?.sort((a, b) =>
                a.createdAt > b.createdAt ? -1 : 1
            ) || [];

        const patients = doctor?.patients;

        return json({
            googleDataId: doctor?.googleData?.id,
            calendars,
            loaderLocations,
            loaderServices,
            patients,
        });
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return json({ error: GenericErrors.PRISMA_ERROR });
            }
            default: {
                logError({
                    filePath: '/office.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

export default function Office() {
    const { loaderServices, patients } = useLoaderData<OfficeLoaderData>();

    const [burgerOpened, setBurgerOpened] = useState(false);
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] =
        useState(false);

    const [, setUserEmailLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInUserEmail',
    });
    const [, setPasswordLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInPassword',
    });

    const navigate = useNavigate();
    const outletTransitioning = useOutletTransitioning();

    function logout() {
        fetch('/api/logout', { method: 'POST' }).then((response) => {
            if (response.status === ErrorCodes.CUSTOM_ERROR) {
                return;
            }

            setUserEmailLocalStorage('');
            setPasswordLocalStorage('');

            const url = new URL(response.url);

            navigate(url.pathname);
        });
    }

    function toggleBurger() {
        setBurgerOpened((o) => !o);
    }

    return (
        <AppShell
            navbarOffsetBreakpoint="sm"
            header={
                <Header zIndex={1} height={60} p="md">
                    <Group
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                        px={20}
                    >
                        <MediaQuery
                            largerThan="sm"
                            styles={{ display: 'none' }}
                        >
                            <Burger
                                opened={burgerOpened}
                                onClick={toggleBurger}
                                size="sm"
                                color="#1A1B1E"
                                mr="xl"
                            />
                        </MediaQuery>
                        <div className="logo">
                            <IconStethoscope size={30} strokeWidth={1.2} />
                            <div>MEDICI</div>
                        </div>
                        <div onClick={logout}>Sair</div>
                    </Group>
                </Header>
            }
            navbar={
                <Navbar
                    p="md"
                    hiddenBreakpoint="sm"
                    hidden={!burgerOpened}
                    width={{ sm: 200, lg: 300 }}
                    zIndex={1}
                >
                    <ScrollArea style={{ height: '100%' }} type="never">
                        <Navbar.Section>
                            <div className="calendarAction">
                                <IconCalendar />
                                <Link
                                    className="calendarActionText"
                                    to="/office"
                                    onClick={toggleBurger}
                                >
                                    Calendário
                                </Link>
                            </div>
                        </Navbar.Section>
                        <Divider
                            style={{ marginTop: '1rem', marginBottom: '1rem' }}
                        />
                        <Navbar.Section>
                            <div className="quickActions">
                                <div className="quickAction">
                                    <IconCalendarPlus />
                                    <div
                                        className="quickActionText"
                                        onClick={() => {
                                            toggleBurger();
                                            setIsCreateAppointmentModalOpen(
                                                true
                                            );
                                        }}
                                    >
                                        Agendar consulta
                                    </div>
                                </div>
                                <div className="quickAction">
                                    <IconUserPlus />
                                    <div
                                        className="quickActionText"
                                        onClick={() => {
                                            toggleBurger();
                                            setIsAddPatientModalOpen(true);
                                        }}
                                    >
                                        Adicionar paciente
                                    </div>
                                </div>
                            </div>
                        </Navbar.Section>
                        <Divider
                            style={{ marginTop: '1rem', marginBottom: '1rem' }}
                        />
                        <Navbar.Section grow>
                            <div className="quickActions">
                                <div className="quickAction">
                                    <IconUsers />
                                    <Link
                                        className="quickActionText"
                                        to="patients"
                                        onClick={toggleBurger}
                                    >
                                        Pacientes
                                    </Link>
                                </div>
                                <div className="quickAction">
                                    <IconReportMedical />
                                    <Link
                                        className="quickActionText"
                                        to="appointments"
                                        onClick={toggleBurger}
                                    >
                                        Consultas
                                    </Link>
                                </div>
                                <div className="quickAction">
                                    <IconGraph />
                                    <Link
                                        className="quickActionText"
                                        to="analytics"
                                        onClick={toggleBurger}
                                    >
                                        Estatísticas
                                    </Link>
                                </div>
                                <div className="quickAction">
                                    <IconAdjustmentsHorizontal />
                                    <Link
                                        to="settings"
                                        className="quickActionText"
                                        onClick={toggleBurger}
                                    >
                                        Definições
                                    </Link>
                                </div>
                            </div>
                        </Navbar.Section>
                    </ScrollArea>
                </Navbar>
            }
        >
            {outletTransitioning ? (
                <div className="loaderCenterer">
                    <Loader />
                </div>
            ) : (
                <Outlet
                    context={{
                        services:
                            loaderServices as unknown as EnhancedService[],
                        patients,
                    }}
                />
            )}
            <AddPatientModal
                open={isAddPatientModalOpen}
                toggle={setIsAddPatientModalOpen}
            />
            <CreateAppointmentModal
                open={isCreateAppointmentModalOpen}
                toggle={setIsCreateAppointmentModalOpen}
                toggleAddPatientModal={setIsAddPatientModalOpen}
                services={loaderServices as unknown as EnhancedService[]}
                patients={patients}
            />
        </AppShell>
    );
}
