import { google } from 'googleapis';

import { getURL } from './environment';

export const googleAuthClient = new google.auth.OAuth2(
    '119395277308-2dh9is04npveii3sqt6li8hsdll3rrie.apps.googleusercontent.com',
    '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',
    `${getURL()}/api/google/getTokens`
);

type SetCredentialsArgs = {
    accessToken?: string;
    refreshToken?: string;
};
export function setCredentials({
    accessToken,
    refreshToken,
}: SetCredentialsArgs) {
    if (accessToken?.length) {
        googleAuthClient.credentials.access_token = accessToken;
    }
    if (refreshToken?.length) {
        googleAuthClient.credentials.refresh_token = refreshToken;
    }
}

export const googleCalendarAPI = google.calendar({
    version: 'v3',
    auth: googleAuthClient,
});
