import { useMemo } from 'react';

import { useRouteLoaderData } from '@remix-run/react';

import type {
    CheckboxesObject,
    EnhancedLocation,
    EnhancedService,
} from '~/utils/common/types';

import type { OfficeLoaderData } from '~/routes/office';

import { SettingsCalendars } from '~/components/SettingsCalendars';
import { SettingsLocations } from '~/components/SettingsLocations';
import { SettingsServices } from '~/components/SettingsServices';

import styles from '~/styles/office/settings.css';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

const checkboxesInitialValues: CheckboxesObject = {};

export default function Settings() {
    const {
        googleAuthorizationUrl,
        googleDataId,
        calendars,
        loaderLocations,
        loaderServices,
    } = useRouteLoaderData('routes/office') as OfficeLoaderData;

    const loaderCheckboxes = useMemo(
        () =>
            Object.entries(calendars).reduce(
                (acc, [key, value]) =>
                    Object.assign({}, acc, { [key]: value.selected }),
                checkboxesInitialValues
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [calendars]
    );

    return (
        <div>
            <h1>Definições</h1>
            <br />
            <SettingsCalendars
                googleAuthorizationUrl={googleAuthorizationUrl}
                googleDataId={googleDataId}
                calendars={calendars}
                checkboxes={loaderCheckboxes}
            />
            <br />
            <SettingsServices
                services={loaderServices as unknown as EnhancedService[]}
                locations={loaderLocations as unknown as EnhancedLocation[]}
            />
            <br />
            <SettingsLocations
                locations={loaderLocations as unknown as EnhancedLocation[]}
            />
            {/* <Form method="post">
                <Button type="submit" name="action" value="deleteAccount">
                    Apagar Conta
                </Button>
            </Form> */}
        </div>
    );
}
