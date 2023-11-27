import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import dayjs from 'dayjs';
import { differenceBy } from 'lodash';

import { useForm } from '@mantine/form';
import { Modal, MultiSelect, Select, TextInput, Button } from '@mantine/core';
import { DatePicker, TimeInput } from '@mantine/dates';
import { usePrevious } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import {
    IconCheck,
    IconAlertTriangle,
    IconX,
    IconTransform,
} from '@tabler/icons';

import type {
    EnhancedEvent,
    EnhancedPatient,
    EnhancedService,
    SelectInputProps,
} from '~/utils/common/types';
import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { AppointmentErrors, GenericErrors } from '~/utils/common';
import { ConvertPatientModal } from './ConvertPatientModal/ConvertPatientModal';

export type ConvertAppointmentModalForm = {
    patients: string[];
    service: string;
    duration: number;
    location: string;
    price: number;
    date: Date | undefined;
    time: Date | undefined;
};

const formInitialValues = {
    patients: [],
    service: '',
    duration: 0,
    location: '',
    price: 0,
    date: undefined,
    time: undefined,
};

const missingPatientsError = 'Escolha um ou mais pacientes para a sua consulta';
const missingServiceError = 'Escolha o tipo da consulta';
const missingDurationError = 'Tem de especificar uma duração para o serviço';
const missingLocationError = 'Escolha uma localização para a consulta';
const missingPriceError = 'Atribua um preço à consulta';
const missingDateError = 'Escolha uma data para a consulta';
const missingTimeError = 'Escolha uma hora para a consulta';

type ConvertEventModalProps = {
    event: EnhancedEvent;
    services: EnhancedService[];
    patients: EnhancedPatient[];
};

export function ConvertEventModal({
    event,
    services,
    patients,
}: ConvertEventModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [convertPatientModal, toggleConvertPatientModal] = useState(false);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    const form = useForm<ConvertAppointmentModalForm>({
        initialValues: formInitialValues,
        validate: ({
            patients: formPatients,
            service: formService,
            duration: formDuration,
            location: formLocation,
            price: formPrice,
            date: formDate,
            time: formTime,
        }) => ({
            patients: formPatients.length ? null : missingPatientsError,
            service: formService.length ? null : missingServiceError,
            duration: formDuration > 0 ? null : missingDurationError,
            location: formLocation.length ? null : missingLocationError,
            price: formPrice && formPrice > 0 ? null : missingPriceError,
            date: formDate ? null : missingDateError,
            time: formTime ? null : missingTimeError,
        }),
    });

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setSending(true);

        await fetch('/api/doctor/createAppointment', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                setSending(false);
                handleError(response);
                revalidate();

                showNotification({
                    message: 'Consulta marcada com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });

                toggle(false);
            })
            .catch((error) => {
                switch (error) {
                    case AppointmentErrors.MISSING_INPUT_PATIENTS: {
                        form.setFieldError('patients', missingPatientsError);
                        break;
                    }
                    case AppointmentErrors.MISSING_INPUT_SERVICE: {
                        form.setFieldError('service', missingServiceError);
                        break;
                    }
                    case AppointmentErrors.MISSING_INPUT_LOCATION: {
                        form.setFieldError('location', missingLocationError);
                        break;
                    }
                    case AppointmentErrors.MISSING_INPUT_PRICE: {
                        form.setFieldError('price', missingPriceError);
                        break;
                    }
                    case AppointmentErrors.MISSING_INPUT_DATE: {
                        form.setFieldError('date', missingDateError);
                        break;
                    }
                    case AppointmentErrors.MISSING_INPUT_TIME: {
                        form.setFieldError('time', missingTimeError);
                        break;
                    }
                    case GenericErrors.UNAUTHORIZED: {
                        navigate('/login');
                        break;
                    }
                    default: {
                        setErrorCount(errorCount + 1);

                        if (errorCount < 3) {
                            showNotification({
                                title: 'Algo de errado aconteceu',
                                message:
                                    'Por favor, volte a tentar submeter o novo paciente. Entretanto, já estamos em cima do assunto.',
                                color: 'yellow',
                                icon: <IconAlertTriangle size={18} />,
                                disallowClose: true,
                                styles: { root: { marginTop: '50px' } },
                            });
                        } else {
                            showNotification({
                                title: 'Estamos com problemas',
                                message:
                                    'Vamos tentar resolver tudo o mais rapidamente possível',
                                color: 'red',
                                icon: <IconX size={18} />,
                                autoClose: false,
                                styles: { root: { marginTop: '50px' } },
                            });
                        }
                    }
                }
            });
    }

    const patientsForInput = useMemo<SelectInputProps>(
        () =>
            [
                {
                    value: 'new',
                    label: 'Adicionar novo paciente',
                    description: '',
                    group: 'Criar paciente',
                },
            ].concat(
                patients.map(
                    ({
                        id,
                        client: {
                            user: { firstName, lastName },
                        },
                    }) => ({
                        value: id,
                        label: `${firstName} ${lastName}`,
                        description: '',
                        group: 'Pacientes',
                    })
                )
            ),
        [patients]
    );
    const servicesForInput = useMemo<SelectInputProps>(
        () =>
            services.map(({ id, name }) => ({
                value: id,
                label: name,
            })),
        [services]
    );
    const locationsForInput = useMemo<SelectInputProps>(
        () =>
            services
                .find((service) => service.id === form.values.service)
                ?.servicesOnLocationsWithPricing?.map((relation) => ({
                    value: relation.locationId,
                    label: relation.location.alias,
                    description: relation.location.address,
                }))
                ?.map(({ value, label, description }) => ({
                    value,
                    label,
                    description,
                })) || [],
        [form.values.service, services]
    );

    const suggestions = useMemo(() => {
        const splitSummary = event.summary?.split(' | ') || '';
        const name = splitSummary[0];
        const phone = splitSummary[1];

        let suggestedName: string = '';

        const splitNames = name.split(' ');

        if (splitNames.length === 2) {
            suggestedName = `${splitNames[1]} ${splitNames[0]}`;
        } else if (splitNames.length === 3) {
            suggestedName = `${splitNames[1]} ${splitNames[2]} ${splitNames[0]}`;
            suggestedName = `${splitNames[2]} ${splitNames[0]} ${splitNames[1]}`;
        } else {
            suggestedName = name;
        }

        return { names: suggestedName, phone };
    }, [event.summary]);

    const previousLoaderPatients = usePrevious(patients);
    const previousFormPatients = usePrevious(form.values.patients);
    useEffect(() => {
        const newPatientSelected =
            !previousFormPatients?.includes('new') &&
            form.values.patients.includes('new');

        if (newPatientSelected) {
            toggleConvertPatientModal(true);
            form.setFieldValue('patients', previousFormPatients || []);
        }

        const newPatientAddedFromAppointmentModal =
            previousLoaderPatients &&
            patients.length !== previousLoaderPatients.length
                ? differenceBy(
                      patients,
                      previousLoaderPatients,
                      (patient) => patient.id
                  )[0]
                : undefined;

        if (newPatientAddedFromAppointmentModal) {
            form.setFieldValue('patients', [
                newPatientAddedFromAppointmentModal.id,
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.patients, patients]);

    useEffect(() => {
        const selectedService = services.find(
            (service) => service.id === form.values.service
        );

        const selectedServiceDuration = selectedService?.duration;

        const priceForSelectedLocation =
            selectedService?.servicesOnLocationsWithPricing.find(
                (relation) =>
                    relation.serviceId === form.values.service &&
                    relation.locationId === form.values.location
            )?.pricing.price;

        form.setFieldValue('price', priceForSelectedLocation || 0);
        form.setFieldValue('duration', selectedServiceDuration || 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.values.service, form.values.location, services]);

    return (
        <div>
            <IconTransform
                onClick={() => toggle(true)}
                style={{
                    marginRight: '1rem',
                    cursor: 'pointer',
                }}
            />
            <Modal
                opened={open}
                onClose={() => toggle(!open)}
                title={<div className="title">Converter consulta</div>}
                centered
                zIndex={1000}
                styles={{
                    modal: {
                        minHeight: '50vh',
                        maxHeight: '90vh',
                        overflowY: 'scroll',
                    },
                }}
            >
                <form onSubmit={submit} className="createAppointmentForm">
                    <MultiSelect
                        className="createAppointmentFormPatients"
                        label="Escolha os pacientes para a consulta"
                        data={patientsForInput}
                        searchable
                        withAsterisk
                        {...form.getInputProps('patients')}
                    />
                    <Select
                        className="createAppointmentFormServices"
                        label="Serviço"
                        data={servicesForInput}
                        searchable
                        withAsterisk
                        {...form.getInputProps('service')}
                    />
                    <Select
                        className="createAppointmentFormLocations"
                        label="Localização"
                        data={locationsForInput}
                        searchable
                        disabled={form.values.service.length === 0}
                        withAsterisk
                        {...form.getInputProps('location')}
                    />
                    <div className="createAppointmentFormPriceDuration">
                        <TextInput
                            label="Preço (€)"
                            type="number"
                            disabled={form.values.service.length === 0}
                            {...form.getInputProps('price')}
                        />
                        <TextInput
                            label="Duração (min)"
                            type="number"
                            disabled={form.values.service.length === 0}
                            {...form.getInputProps('duration')}
                        />
                    </div>
                    <DatePicker
                        label="Data"
                        placeholder="Janeiro 12, 2023"
                        clearable={false}
                        allowLevelChange={false}
                        locale="pt"
                        excludeDate={(date) =>
                            dayjs(date).isBefore(dayjs().subtract(1, 'day'))
                                ? true
                                : false
                        }
                        {...form.getInputProps('date')}
                    />
                    <TimeInput
                        label="Hora"
                        withAsterisk
                        {...form.getInputProps('time')}
                    />
                    <br />
                    <Button
                        type="submit"
                        name="action"
                        loading={sending}
                        radius="md"
                        size="md"
                    >
                        Converter
                    </Button>
                </form>
            </Modal>
            <ConvertPatientModal
                open={convertPatientModal}
                toggle={toggleConvertPatientModal}
                suggestions={suggestions}
            />
        </div>
    );
}
