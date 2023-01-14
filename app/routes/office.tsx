import { useMemo, useState } from 'react';

import dayjs from 'dayjs';

import type { LoaderFunction } from '@remix-run/node';
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

import { AddPatientModal } from '~/components/AddPatientModal';

import { ErrorCodes } from '~/utils/common';

import styles from '~/styles/office.css';

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
                <Outlet />
            )}
            <AddPatientModal
                open={addClientModalOpened}
                toggle={setAddClientModalOpened}
            />
        </AppShell>
    );
}
