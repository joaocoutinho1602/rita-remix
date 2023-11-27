import type { Prisma } from '@prisma/client';
import type { calendar_v3 } from 'googleapis';

import type {
    Location,
    Pricing,
    Service,
    ServicesOnLocationsWithPricing,
} from '@prisma/client';

export type SelectInputProps = {
    value: string;
    label: string;
    description?: string;
    image?: any;
}[];

export type CalendarsObject = {
    [key: string]: {
        id: string;
        selected: boolean;
        summary: string;
        description: string;
        backgroundColor: string;
        isMediciCalendar: boolean;
    };
};

export type CheckboxesObject = { [key: string]: boolean };

export type EnhancedServicesOnLocationsWithPricing =
    ServicesOnLocationsWithPricing & {
        service: Service;
        location: Location;
        pricing: Pricing;
    };

export type EnhancedLocation = Location & {
    servicesOnLocationsWithPricing: EnhancedServicesOnLocationsWithPricing[];
};

export type EnhancedService = Service & {
    servicesOnLocationsWithPricing: EnhancedServicesOnLocationsWithPricing[];
};

export type EnhancedPatient = {
    id: string;
    client: {
        user: {
            firstName: string;
            lastName: string;
            email?: string;
        };
    };
};

export type PatientWithPatientsOnAppointments = Prisma.PatientGetPayload<{
    select: {
        client: {
            select: { user: { select: { firstName: true; lastName: true } } };
        };
        patientsOnAppointments: {
            select: {
                appointment: {
                    select: {
                        id: true;
                        price: true;
                        googleEventId: true;
                        date: true;
                        duration: true;
                        location: true;
                        service: true;
                    };
                };
            };
        };
    };
}>;

export type EnhancedEvent = {
    mediciCalendarId: string;
    mediciEventId: string;
    color: string;
} & calendar_v3.Schema$Event;

export type EnhancedAppointment = {
    id: string;
    googleEventId: string;
    date: string;
    duration: number;
    price: number;
    serviceId: string;
    locationId: string;
    doctorId: string;
    createdAt: string;
    updatedAt: string;
    location: { alias: string };
    patientsOnAppointments: {
        patient: {
            id: string;
            client: {
                user: {
                    firstName: string;
                    lastName: string;
                };
            };
        };
    }[];
};
