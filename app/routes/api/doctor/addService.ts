import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';

import { GenericErrors, logError, ServiceErrors } from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
} from '~/utils/server';

import type { AddServiceModalForm } from '~/components/SettingsServices/AddServiceModal';
import { prettyJSON } from '~/utils/common/functions';

export const action: ActionFunction = async ({ request }) => {
    try {
        if (await isUnauthorized(request)) {
            return GenericErrors.UNAUTHORIZED;
        }

        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        const {
            serviceName,
            serviceDescription,
            duration,
            locations,
            price,
            isMultiPrice,
            multiPrice,
        }: AddServiceModalForm = await request.json();

        if (!serviceName?.length) {
            return customError(ServiceErrors.MISSING_INPUT_NAME);
        }
        if (!serviceDescription?.length) {
            return customError(ServiceErrors.MISSING_INPUT_DESCRIPTION);
        }
        if (!duration) {
            return customError(ServiceErrors.MISSING_INPUT_DURATION);
        }
        if (!locations?.length) {
            return customError(ServiceErrors.MISSING_INPUT_LOCATION);
        }
        if (!isMultiPrice && !price) {
            return customError(ServiceErrors.MISSING_INPUT_PRICE);
        }
        if (locations.some((locationId) => multiPrice[locationId] <= 0)) {
            return customError(ServiceErrors.MISSING_INPUT_MULTIPRICE);
        }

        const doctor = await db.doctor
            .findUnique({
                where: { userEmail: email },
                include: {
                    services: {
                        where: {
                            OR: [
                                { name: serviceName },
                                { description: serviceDescription },
                            ],
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/addService',
                    message: `prisma error ~ findUnique doctor where\nuserEmail=${email}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const services = doctor?.services || [];
        if (services.some((service) => service.name === serviceName)) {
            return customError(ServiceErrors.NAME_ALREADY_EXISTS);
        }
        if (
            services.some(
                (service) => service.description === serviceDescription
            )
        ) {
            return customError(ServiceErrors.DESCRIPTION_ALREADY_EXISTS);
        }

        const createLocationsData = locations.map((id) => ({
            locationId: id,
        }));

        const updatedDoctor = await db.doctor
            .update({
                where: { userEmail: email },
                data: {
                    services: {
                        create: {
                            name: serviceName,
                            description: serviceDescription,
                            duration: duration.valueOf(),
                            servicesOnLocationsWithPricing: {
                                createMany: { data: createLocationsData },
                            },
                        },
                    },
                },
                include: {
                    services: {
                        include: {
                            servicesOnLocationsWithPricing: {
                                select: { id: true, locationId: true },
                            },
                        },
                    },
                },
            })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/addService',
                    message: `prisma error ~ update doctor where\nuserEmail=${email}\ndata services create\nname=${serviceName}\ndescription=${serviceDescription}\nlocations=${prettyJSON(
                        createLocationsData
                    )}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const findServiceOnLocationsWithPricingByLocationId = (
            locationId: string
        ) =>
            updatedDoctor.services
                .find((service) => service.name === serviceName)
                ?.servicesOnLocationsWithPricing.find(
                    (serviceOnLocationsWithPricing) =>
                        serviceOnLocationsWithPricing.locationId === locationId
                )?.id || '';

        const createPricingsData = isMultiPrice
            ? Object.entries(multiPrice).map(([locationId, thisPrice]) => ({
                  price: thisPrice.valueOf(),
                  servicesOnLocationsWithPricingId:
                      findServiceOnLocationsWithPricingByLocationId(locationId),
              }))
            : locations.map((locationId) => ({
                  price: price.valueOf(),
                  servicesOnLocationsWithPricingId:
                      findServiceOnLocationsWithPricingByLocationId(locationId),
              }));

        await db.pricing
            .createMany({ data: createPricingsData })
            .catch((error) => {
                logError({
                    filePath: '/api/doctor/addService',
                    message: `createMany pricing data ${prettyJSON(
                        createPricingsData
                    )}`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const newService = await db.service.findUnique({
            where: {
                id: updatedDoctor.services.find(
                    (service) => service.name === serviceName
                )?.id,
            },
        });

        return json(newService);
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR:
            default: {
                logError({
                    filePath: '/api/doctor/addService',
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
};
