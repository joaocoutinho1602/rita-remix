import { google } from 'googleapis';

import { getURL } from './environment';

export const googleAuthClient = new google.auth.OAuth2(
    '119395277308-2dh9is04npveii3sqt6li8hsdll3rrie.apps.googleusercontent.com',
    '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',
    `${getURL()}/api/google/getTokens`
);

export const setGoogleCredentials = (refreshToken: string) => {
    googleAuthClient.credentials.refresh_token = refreshToken;
};

export const googleCalendarAPI = google.calendar({
    version: 'v3',
    auth: googleAuthClient,
});
