import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from '@remix-run/react';

import { MantineProvider } from '@mantine/core';
import { StylesPlaceholder } from '@mantine/remix';
import { theme } from '~/theme';

import globalStylesUrl from '~/styles/global.css';

export const meta: MetaFunction = () => ({
    charset: 'utf-8',
    title: 'Rita Meira, Psicóloga',
    viewport: 'width=device-width,initial-scale=1',
    description:
        'Consultas de psicologia em Braga e Viana do Castelo. Não abdiques da tua saúde mental!',
});

export const links: LinksFunction = () => {
    return [
        {
            rel: 'preload',
            href: '/fonts/signature/signature.ttf',
            as: 'font',
            crossOrigin: 'anonymous',
            type: 'font/ttf',
        },
        {
            rel: 'preload',
            href: '/fonts/body/body.ttf',
            as: 'font',
            crossOrigin: 'anonymous',
            type: 'font/ttf',
        },
        {
            rel: 'stylesheet',
            href: globalStylesUrl,
        },
    ];
};

export default function App() {
    return (
        <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
            <html lang="en">
                <head>
                    <Meta />
                    <Links />
                    <StylesPlaceholder />
                </head>
                <body>
                    <Outlet />
                    <ScrollRestoration />
                    <Scripts />
                    <LiveReload />
                </body>
            </html>
        </MantineProvider>
    );
}
