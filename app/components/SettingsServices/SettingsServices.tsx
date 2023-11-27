import { AddServiceModal } from './AddServiceModal';
import { ServicesList } from './ServicesList';

import type { EnhancedLocation, EnhancedService } from '~/utils/common/types';

type SettingsServicesProps = {
    services: EnhancedService[];
    locations: EnhancedLocation[];
};

export function SettingsServices({
    services = [],
    locations = [],
}: SettingsServicesProps) {
    return (
        <div>
            <h2>Serviços</h2>
            <ServicesList services={services} locations={locations} />
            <AddServiceModal services={services} locations={locations} />
        </div>
    );
}
