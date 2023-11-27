import type { ActionFunction } from '@remix-run/node';

import type { EditServiceModalForm } from '~/components/SettingsServices/EditServiceModal';

import {
    GenericErrors,
    logError,
    prismaErrorThrow,
    ServiceErrors,
} from '~/utils/common';
import {
    customError,
    db,
    getSession,
    isUnauthorized,
    SessionData,
} from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId') as string;

    if (!serviceId?.length) {
        return customError(ServiceErrors.MISSING_PARAM_ID);
    }

    const filePath = `/api/doctor/editLocation/${serviceId}`;

    try {
        if (await isUnauthorized(request)) {
            return customError(GenericErrors.UNAUTHORIZED);
        }

        const session = await getSession(request.headers.get('Cookie'));
        const email = session.get(SessionData.EMAIL);

        const url = new URL(request.url);
        const serviceId = url.searchParams.get('serviceId') as string;

        if (!serviceId?.length) {
            return customError(ServiceErrors.MISSING_PARAM_ID);
        }

        const {
            serviceName,
            serviceDescription,
            locations,
            price,
            isMultiPrice,
            multiPrice,
        }: EditServiceModalForm = await request.json();

        if (!serviceName?.length) {
            return customError(ServiceErrors.MISSING_INPUT_NAME);
        }
        if (!serviceDescription?.length) {
            return customError(ServiceErrors.MISSING_INPUT_DESCRIPTION);
        }
        if (!locations?.length) {
            return customError(ServiceErrors.MISSING_INPUT_LOCATION);
        }
        if (!isMultiPrice && (!price || price <= 0)) {
            return customError(ServiceErrors.MISSING_INPUT_PRICE);
        }
        if (locations.some((locationId) => multiPrice[locationId] <= 0)) {
            return customError(ServiceErrors.MISSING_INPUT_MULTIPRICE);
        }

        const doctor = await db.doctor
            .findUnique({
                where: {
                    userEmail: email,
                },
                include: {
                    services: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            servicesOnLocationsWithPricing: {
                                include: {
                                    service: true,
                                    location: true,
                                    pricing: true,
                                },
                            },
                        },
                    },
                },
            })
            .catch(prismaErrorThrow(filePath));

        const services = doctor?.services || [];
        if (
            services?.some(
                (service) =>
                    service.name === serviceName && service.id !== serviceId
            )
        ) {
            return customError(ServiceErrors.NAME_ALREADY_EXISTS);
        }
        if (
            services.some(
                (service) =>
                    service.description === serviceDescription &&
                    service.id !== serviceId
            )
        ) {
            return customError(ServiceErrors.DESCRIPTION_ALREADY_EXISTS);
        }

        const thisService = services.find(
            (service) => service.id === serviceId
        );

        const deleteRelationsData =
            thisService?.servicesOnLocationsWithPricing.map((relation) => ({
                id: relation.id,
            }));
        const updateServiceData = locations.map((locationId) => ({
            locationId,
        }));

        const updatedDoctorPromise = db.doctor
            .update({
                where: { userEmail: email },
                data: {
                    services: {
                        update: {
                            where: { id: serviceId },
                            data: {
                                name: serviceName,
                                description: serviceDescription,
                                servicesOnLocationsWithPricing: {
                                    deleteMany: deleteRelationsData,
                                    createMany: { data: updateServiceData },
                                },
                            },
                        },
                    },
                },
                select: {
                    services: {
                        select: {
                            name: true,
                            servicesOnLocationsWithPricing: {
                                select: { id: true, locationId: true },
                            },
                        },
                    },
                },
            })
            .catch(prismaErrorThrow(filePath));

        const relationsIds = thisService?.servicesOnLocationsWithPricing.map(
            (relation) => relation.pricing?.id || ''
        );
        const deletePricingsPromise = db.pricing
            .deleteMany({
                where: { id: { in: relationsIds } },
            })
            .catch();

        const [updatedDoctor] = await Promise.all([
            updatedDoctorPromise,
            deletePricingsPromise,
        ]);

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
            .catch(prismaErrorThrow(filePath));

        return 'OK';
    } catch (error) {
        switch (error) {
            case GenericErrors.PRISMA_ERROR:
            default: {
                logError({
                    filePath,
                    message: GenericErrors.UNKNOWN_ERROR,
                    error,
                });

                return customError();
            }
        }
    }
};
