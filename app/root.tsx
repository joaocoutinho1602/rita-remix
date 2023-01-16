import { useState } from 'react';

import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from '@remix-run/react';

import type { ColorScheme } from '@mantine/core';
import {
    ColorSchemeProvider,
    MantineProvider,
    createEmotionCache,
} from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import { StylesPlaceholder } from '@mantine/remix';
import { theme } from '~/theme';

import globalStylesUrl from '~/styles/global.css';

const cache = createEmotionCache({ key: 'mantine' });

export const meta: MetaFunction = () => ({
    charset: 'utf-8',
    title: 'Rita Meira, Psicóloga',
    viewport: 'width=device-width,initial-scale=1',
    description:
        'Consultas de psicologia em Braga e Viana do Castelo. Não abdiques da tua saúde mental!',
    'Content-Security-Policy': `default-src 'self' https://vitals.vercel-insights.com`,
    'Content-Security-Policy-Report-Only': `script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src https://accounts.google.com/gsi/`,
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
});

export const links: LinksFunction = () => {
    return [
        {
            rel: 'preload',
            href: '/fonts/signature.ttf',
            as: 'font',
            crossOrigin: 'anonymous',
            type: 'font/ttf',
        },
        {
            rel: 'preload',
            href: '/fonts/body.ttf',
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

function MantineTheme({ children }: { children: React.ReactNode }) {
    const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
    const toggleColorScheme = (value?: ColorScheme) =>
        setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

    return (
        <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
        >
            <MantineProvider
                emotionCache={cache}
                theme={theme}
                withNormalizeCSS
                withGlobalStyles
            >
                <NotificationsProvider position="top-right" zIndex={1001}>
                    {children}
                </NotificationsProvider>
            </MantineProvider>
        </ColorSchemeProvider>
    );
}

export default function App() {
    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
                <StylesPlaceholder />
            </head>
            <body>
                <MantineTheme>
                    <Outlet />
                </MantineTheme>
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
