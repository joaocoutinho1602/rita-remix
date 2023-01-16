import { Card } from '@mantine/core';
import { useState } from 'react';

import type { Location } from '@prisma/client';

import { AddLocationModal } from '../AddLocationModal';
import { EditLocationModal } from '../EditLocationModal';
import { DeleteLocationModal } from '../DeleteLocationModal';

type SettingsLocationsProps = {
    loaderLocations?: Location[];
};

export function SettingsLocations({
    loaderLocations = [],
}: SettingsLocationsProps) {
    const [locations, setLocations] = useState<Location[]>(loaderLocations);

    return (
        <div>
            <h2>Localizações</h2>
            <h4>Aqui pode gerir as localizações onde dá consultas</h4>
            <h5 className="subtitle">
                Para além destas opções, terá sempre disponível para marcações a
                modalidade Online
            </h5>
            <div className="locationsContainer">
                {locations
                    .filter(({ alias }) => alias !== 'Online')
                    .map(({ alias, address, id }) => (
                        <div className="cardContainer" key={id}>
                            <Card shadow="0px 0px 10px 5px rgba(0,0,0,0.1)">
                                <div className="card">
                                    <div className="info">
                                        <div className="alias">{alias}</div>
                                        <div className="address">{address}</div>
                                    </div>
                                    <div className="actions">
                                        <EditLocationModal
                                            locationId={id}
                                            locations={locations}
                                            setLocations={setLocations}
                                        />
                                        <DeleteLocationModal
                                            locationId={id}
                                            locations={locations}
                                            setLocations={setLocations}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
            </div>
            <br />
            <AddLocationModal
                locations={locations}
                setLocations={setLocations}
            />
        </div>
    );
}
