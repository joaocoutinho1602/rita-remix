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

## HAMMERS

1. Due to Remix issues with data serialization when using Prisma types such as Date (see https://github.com/remix-run/remix/issues/3931), we have to force-cast types using `as unknown as` (see app/routes/office/settings.tsx:233).

## TODOs

NEXT UP:

1. Implement /api/doctor/addLocation and /api/doctor/addService routes
2. Test the creation of locations and services
3. Create EditService and DeleteService modals in ServicesList, also finish visuals of ServicesList
4. Implement /api/doctor/editService and /api/doctor/deleteService routes
5. Test the edition and deletion of Services
6. Finish visuals of SettingsLocations

Refactoring:

1. Implement Remix error boundaries
2. Migrate authentication to Passport
