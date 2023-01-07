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

CRITICAL:
1. Fix Google account association to use email used to login into Goole instead of email stored in session

Refactoring:

1. Migrate client-side JS interaction functions into Remix actions (/office)
2. Migrate Mantine forms and form submissions into remix-validated-forms and Remix actions (/login)

Eventually:

1. Add remix-image (https://github.com/Josh-McFarlin/remix-image)
2. Read into Sentry with Remix (https://github.com/getsentry/sentry-javascript/tree/master/packages/remix)


## Authentication

1. A registered user navigates to `/office`. We check if they have an open session by checking if the session has a stored email. If they don't, they are redirected to `/login`, where they input their password and username. They are then redirected to `/office`.
2. On loading the page, we check if we have the user's Google refresh token stored in their session. If we do, skip to step 4. If we don't, we check if we have it in our database. If we don't, continue to step 3.
3. Using `/api/google/generateAuthUrl` we generate a Google URL that opens up a modal for the user to give permission for MEDICI to use their Google data. This modal will callback to `/api/google/getTokens` where we extract the tokens from the Google response and set both the current user session and also save the user's refresh token in the database.
4. With the refresh token stored in the user session, we can now get information about the user's calendars.

## Session

In a given user's session we are storing:

1. `userGoogleAccessToken`
2. `userGoogleRefreshToken`
2. `userEmail`

## Error handling

Throughout the lifetime of a call to an API route errors may be thrown from essentially anywhere. Due to this reason, every function corresponding to an API route should start with a try/catch block so that every possible error occurring within the lifetime of this call is caught and is uniformly handled in a single place.

Many errors are natural and should be handled with a specific error message so they can be identified and handled appropriately, both within the API route and also on the client. An example of this is when a user is trying to login but they input an email that isn't registered. Naturally, if the user isn't registered, the database won't return anything. Knowing this, we can throw an error message that says this happened and catch it in that catch block we mentioned previously. Since this is expected behaviour, we don't need to log this to our external logging service. Instead, we can simply send the error message back to the client where it will be caught as an error and will display an error message to the user, even prompting them to register an account with that email since it isn't registered.

Other errors are unexpected and may come from an unknown source. Because of this, the handling of errors should be handled with a switch/case statement with one case for every expected error and then a default case for every other unexpected error. The expected errors are manually thrown, so if it is required we can log to our logging service just before throwing them and then we don't need to log again when that case is found inside our switch/case statement. On the other hand, the default case should always log something before doing anything else.

Regardless of whether we are met with an expected or unexpected error, we should always return back to the client an error code and a message. Using this message the client can then react appropriately and fail gracefully using the same practice. For an application of this explanation you can check ~/routes/login.tsx and ~/api/routes/login.tsx where you'll see this exact mechanism being used: the client makes a request to an API route, the API route throws and catches errors, logs where appropriate, returns a message to the client, and the client catches the error message and reacts appropriately.
