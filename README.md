## Development

Install dependencies:

```sh
yarn
```

In one terminal proxy into PlanetScale database on port 3309:

```sh
yarn connect
```

Then in another terminal start Prisma Studio on port 5555:

```sh
yarn studio
```

Then in another terminal start Remix local server on port 3000:

```sh
yarn dev
```

Open up [http://localhost:3000](http://localhost:3000)

## TODOs

NEXT UP:
1. Test EditLocation and DeleteLocation
2. Test AddPatient
3. Start creation of Appointments for Patients

CRITICAL:
1. Deal with Google errors when associating Google account, remember Google is source of truth
2. Fix Google account association to use email used to login into Goole instead of email stored in session

Refactoring:

1. Implement Remix error boundaries
2. Migrate authentication to Passport

Eventually:

1. Add remix-image (https://github.com/Josh-McFarlin/remix-image)
2. Read into Sentry with Remix (https://github.com/getsentry/sentry-javascript/tree/master/packages/remix)
3. Remove signature font from office pages

## Authentication

1. A registered user navigates to `/office`. We check if they have an open session by checking if the session has a stored email. If they don't, they are redirected to `/login`, where they input their password and username. They are then redirected to `/office`.
2. On loading the page, we check if we have the user's Google refresh token stored in their session. If we do, skip to step 4. If we don't, we check if we have it in our database. If we don't, continue to step 3.
3. Using `/api/google/generateAuthUrl` we generate a Google URL that opens up a modal for the user to give permission for MEDICI to use their Google data. This modal will callback to `/api/google/getTokens` where we extract the tokens from the Google response and set both the current user session and also save the user's refresh token in the database.
4. With the refresh token stored in the user session, we can now get information about the user's calendars.

## Session

In a given user's session we are storing:

1. `userEmail` - the user's email, stored in the session for easy identification of the user
