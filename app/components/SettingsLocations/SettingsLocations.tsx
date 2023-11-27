import { groupBy } from 'lodash';

import { Card } from '@mantine/core';

import { useAutoAnimate } from '@formkit/auto-animate/react';

import type { EnhancedLocation } from '~/utils/common/types';

import { AddLocationModal } from './AddLocationModal';
import { DeleteLocationModal } from './DeleteLocationModal';
import { EditLocationModal } from './EditLocationModal';

type SettingsLocationsProps = {
    locations: EnhancedLocation[];
};

export function SettingsLocations({ locations = [] }: SettingsLocationsProps) {
    const [parentRef] = useAutoAnimate<HTMLUListElement>();

    return (
        <div>
            <h2>Localizações</h2>
            <ul ref={parentRef} className="locationsListContainer">
                {locations.map((location) => {
                    const {
                        alias,
                        address,
                        id,
                        servicesOnLocationsWithPricing,
                    } = location;

                    const pivots = servicesOnLocationsWithPricing.filter(
                        (pivot) => pivot.locationId === id
                    );

                    const groupedPricings = groupBy(pivots, 'pricing.price');
                    const prices = Object.keys(groupedPricings);
                    const sortedPrices = prices.sort((a, b) =>
                        a < b ? 1 : -1
                    );

                    return (
                        <Card
                            key={id}
                            shadow="0px 0px 10px 5px rgba(0,0,0,0.1)"
                        >
                            <div className="locationCard">
                                <div className="locationInfo">
                                    <div>{alias}</div>
                                    <div className="locationAddress">
                                        {location.alias !== 'Online'
                                            ? address
                                            : 'Apenas para visualização, não pode ser editada nem apagada'}
                                    </div>
                                    {sortedPrices.map((price) => (
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
                                    ))}
                                </div>
                                {location.alias === 'Online' ? null : (
                                    <div className="locationActions">
                                        <EditLocationModal
                                            location={location}
                                            locations={locations}
                                        />
                                        <DeleteLocationModal
                                            location={location}
                                            locations={locations}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </ul>
            <br />
            <br />
            <AddLocationModal locations={locations} />
        </div>
    );
}
