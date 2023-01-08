import { useMemo, useState } from 'react';

import type { ActionArgs, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Link, Outlet, useNavigate, useTransition } from '@remix-run/react';

import { getSession } from '~/utils/common/sessions';

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
    AddClientErrors,
    ErrorCodes,
    GenericErrors,
    logError,
} from '~/utils/common';

import styles from '../styles/office.css';
import AddClientModal from '~/components/AddClientModal/AddClientModal';
import { db } from '~/utils/server';
import dayjs from 'dayjs';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'));

    if (!session.has('userEmail')) {
        return redirect('/login');
    }

    /**
     * TODO
     * ***
     *? verificar se o utilizador tem um googleRefreshToken na sessão
     *? se não tiver, tem de aparecer o prompt da google ao utilizador
     *? se tiver, podemos apresentar dados dos calendários
     */

    const data = { error: session.get('error'), env: process.env.NODE_ENV };

    return json(data);
};

export async function action({ request }: ActionArgs) {
    console.log('🚀 ~ file: office.tsx:71 ~ request', request)
    const session = await getSession(request.headers.get('Cookie'));

    /**
     * TODO
     * ***
     * testar criação de clients
     */

    try {
        const doctorEmail = session.get('userEmail');

        const formData = await request.formData();

        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const email = formData.get('email') as string;

        let [user, client] = await Promise.all([
            db.user
                .findUnique({
                    where: { email },
                    select: { email: true },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `SELECT email FROM User WHERE email={email}`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                }),
            db.client
                .findUnique({
                    where: {
                        userEmail: email,
                    },
                    select: {
                        userEmail: true,
                        patients: true,
                    },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `SELECT (userEmail, patients) FROM Client WHERE userEmail={email}`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                }),
        ]);

        if (!user?.email) {
            const password = await fetch(
                'https://www.random.org/strings/?num=1&len=10&digits=on&upperalpha=on&loweralpha=on&unique=on&format=plain&rnd=new',
                { method: 'GET' }
            )
                .then(async (response) => {
                    const data = await response.body?.getReader()?.read();

                    const utf8Decoder = new TextDecoder('utf-8');

                    const password = utf8Decoder.decode(data?.value) || '';

                    return password;
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: 'error fetching string from random.org',
                        error,
                    });

                    throw GenericErrors.UNKNOWN_ERROR;
                });

            user = await db.user
                .create({
                    data: { email, firstName, lastName, password },
                    select: { email: true },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `prisma error ~ INSERT INTO User (firstName, lastName, email, password) VALUES (${firstName}, ${lastName}, ${email}, ${password})`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                });
        }

        if (!client?.userEmail) {
            client = await db.client
                .create({
                    data: { userEmail: email },
                    select: { userEmail: true, patients: true },
                })
                .catch((error) => {
                    logError({
                        filePath: '/office.tsx',
                        message: `prisma error ~ INSERT INTO Client (userEmail) VALUES (${email})`,
                        error,
                    });

                    throw GenericErrors.PRISMA_ERROR;
                });
        }

        if (
            client?.patients.find(
                ({ doctorEmail: thisDoctorEmail }) =>
                    thisDoctorEmail === doctorEmail
            )
        ) {
            return json({ error: AddClientErrors.IS_ALREADY_PATIENT });
        }

        await db.patient
            .create({
                data: { userEmail: email, doctorEmail },
                select: { id: true },
            })
            .then(async (newPatient) => {
                await db.doctor
                    .update({
                        where: { userEmail: doctorEmail },
                        data: {
                            patients: { create: { userEmail: email } },
                        },
                    })
                    .catch((error) => {
                        logError({
                            filePath: '/office.tsx',
                            message: `prisma error ~ UPDATE Doctor SET patients=(INSERT INTO Patient (userEmail)) ${doctorEmail}`,
                            error,
                        });

                        throw GenericErrors.PRISMA_ERROR;
                    });
            })
            .catch((error) => {
                if (error !== GenericErrors.PRISMA_ERROR) {
                    logError({
                        filePath: '/office.tsx',
                        message: `prisma error ~ UPDATE Doctor SET patients=(INSERT INTO Patient (userEmail)) ${doctorEmail}`,
                        error,
                    });
                }

                throw GenericErrors.PRISMA_ERROR;
            });

        return json({ message: 'success' });
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR: {
                return json({});
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
}

export default function Office() {
    const [, setUserEmailLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInUserEmail',
    });
    const [, setPasswordLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInPassword',
    });

    const [burgerOpened, setBurgerOpened] = useState(false);
    const [addClientModalOpened, setAddClientModalOpened] = useState(false);

    const navigate = useNavigate();
    const transition = useTransition();

    const outletTransitioning = useMemo(() => {
        /**
         * This logic controls whether we should show the user the Outlet is loading
         * It should be replicated everywhere there is a Loader
         */
        const routes = ['clients', 'appointments', 'analytics', 'settings'];

        /**
         * splitPathname[0] will always be ''
         */
        const splitPathname = transition.location?.pathname.split('/') || [];

        const isOfficeIndex =
            splitPathname.length === 2 && splitPathname[1] === 'office';

        if (isOfficeIndex) {
            /**
             * If we are in the /office index route, we must control wether we are navigating the calendar
             */
            const search = (transition.location?.search || '')
                .split('?')[1]
                ?.split('&');

            const selectionDate = search?.[0].split('=')[1];

            if (selectionDate?.length && dayjs(selectionDate).isValid()) {
                return false;
            } else {
                return true;
            }
        }

        /**
         * This ensures we don't display the Loader if we are navigating from
         * /office/clients/123
         * to
         * /office/clients/456
         */
        const isOfficeDirectSubroute =
            splitPathname.length === 3 && routes.includes(splitPathname[2]);

        return transition.state === 'loading' && isOfficeDirectSubroute;
    }, [
        transition.location?.pathname,
        transition.location?.search,
        transition.state,
    ]);

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
            zIndex={999}
            header={
                <Header height={70} p="md">
                    <Group sx={{ height: '100%' }} px={20} position="apart">
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
                            <IconStethoscope size={40} strokeWidth={1.2} />
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
                                            setAddClientModalOpened(true);
                                        }}
                                    >
                                        Adicionar cliente
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
                                        to="clients"
                                        onClick={toggleBurger}
                                    >
                                        Clientes
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
                <Outlet />
            )}
            <AddClientModal
                open={addClientModalOpened}
                toggle={setAddClientModalOpened}
            />
        </AppShell>
    );
}
