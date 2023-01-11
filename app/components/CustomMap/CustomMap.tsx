import React from 'react';

import { useViewportSize } from '@mantine/hooks';

import { Map, Marker } from 'pigeon-maps';

type CustomMapProps = {
    mobile?: boolean;
    toggle: boolean;
};

export function CustomMap({ mobile, toggle }: CustomMapProps) {
    const { width } = useViewportSize();

    const MAPTILER_ACCESS_TOKEN = 'TFR4xgf5HFB31gUN8zsw';
    const MAP_ID = 'streets';

    const coordinates: [number, number] = toggle
        ? [41.69955751915841, -8.824261707984284]
        : [41.551244817779, -8.425586543281696];

    function mapTilerProvider(x: number, y: number, z: number, dpr?: number) {
        return `https://api.maptiler.com/maps/${MAP_ID}/256/${z}/${x}/${y}${
            dpr && dpr >= 2 ? '@2x' : ''
        }.png?key=${MAPTILER_ACCESS_TOKEN}`;
    }

    function onMapClick() {
        window.open(
            toggle
                ? 'https://www.google.com/maps/dir//LabMED+Sa%C3%BAde+%7C+Cl%C3%ADnica+Viana+do+Castelo+-+S.+Jo%C3%A3o+de+Deus,+R.+de+S%C3%A3o+Jo%C3%A3o+de+Deus+179,+4900-455+Viana+do+Castelo/@41.6995808,-8.8241913,21z/data=!4m9!4m8!1m0!1m5!1m1!1s0xd25b7cd4cca1a8f:0x209cbf4eacc8232d!2m2!1d-8.8242623!2d41.6995576!3e0'
                : 'https://www.google.com/maps/dir//41.5512363,-8.4255686/@41.5512604,-8.4256933,21z'
        );
    }

    return (
        <Map
            provider={mapTilerProvider}
            center={coordinates}
            zoom={18}
            width={mobile ? Math.min(0.8 * width, 600) : 600}
            height={mobile ? Math.min(0.8 * width, 400) : 400}
            onClick={onMapClick}
        >
            <Marker anchor={coordinates} payload={1} onClick={onMapClick} />
        </Map>
    );
}
