import { groupBy } from 'lodash';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Card } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons';

import type { EnhancedLocation, EnhancedService } from '~/utils/common/types';

import { DeleteServiceModal } from './DeleteServiceModal';
import { EditServiceModal } from './EditServiceModal';

type ServicesListProps = {
    services: EnhancedService[];
    locations: EnhancedLocation[];
};

export function ServicesList({ services, locations }: ServicesListProps) {
    const [parent] = useAutoAnimate<HTMLUListElement>();

    return (
        <ul ref={parent} className="servicesListContainer">
            {services.map((service) => {
                const {
                    id,
                    name,
                    description,
                    servicesOnLocationsWithPricing,
                } = service;

                const pivots = servicesOnLocationsWithPricing.filter(
                    (pivot) => pivot.serviceId === id
                );

                const groupedPricings = groupBy(pivots, 'pricing.price');
                const prices = Object.keys(groupedPricings);
                const sortedPrices = prices.sort((a, b) => (a < b ? 1 : -1));

                return (
                    <Card key={id} shadow="0px 0px 10px 5px rgba(0,0,0,0.1)">
                        <div className="serviceCard">
                            <div className="serviceInfo">
                                <div>{name}</div>
                                <div className="serviceDescription">
                                    {description}
                                </div>
                                {pivots.length > 0 ? (
                                    sortedPrices.map((price) => (
                                        <div key={price}>{`${groupedPricings[
                                            price
                                        ]
                                            .map(
                                                ({ locationId }) =>
                                                    locations.find(
                                                        (thisLocation) =>
                                                            thisLocation.id ===
                                                            locationId
                                                    )?.alias
                                            )
                                            .join(', ')} - €${price}`}</div>
                                    ))
                                ) : (
                                    <div className="noPivotsErrorContainer">
                                        <IconAlertCircle
                                            size={50}
                                            color="red"
                                        />
                                        <div className="noPivotsErrorMessage">
                                            Este serviço não tem localizações
                                            definidas! Edite-o para o poder usar
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="serviceActions">
                                <EditServiceModal
                                    service={service}
                                    services={services}
                                    locations={locations}
                                />
                                <DeleteServiceModal service={service} />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </ul>
    );
}
