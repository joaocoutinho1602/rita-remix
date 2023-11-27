import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import { uniq } from 'lodash';

import type { Location } from '@prisma/client';

import {
    Button,
    Checkbox,
    Modal,
    MultiSelect,
    NumberInput,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconPencil, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { GenericErrors } from '~/utils/common';
import type { EnhancedService } from '~/utils/common/types';

const missingNameError = 'Insira um nome';
const invalidNameError = 'Já tem um serviço com este nome';
const missingDescriptionError = 'Insira uma descrição';
const invalidDescriptionError = 'Já tem um serviço com esta descrição';
const missingLocationsError = 'Tem de selecionar pelo menos uma localização';
const missingPriceError = 'Tem de atribuir um preço maior que zero ao serviço';
const missingPricesError = 'Tem de atribuir preços a cada serviço';

type InputProps = {
    value: string;
    label: string;
    description?: string;
};

export type EditServiceModalForm = {
    serviceName: string;
    serviceDescription: string;
    locations: string[];
    price: Number;
    isMultiPrice: boolean;
    multiPrice: { [locationId: string]: Number };
};

type EditServiceModalProps = {
    service: EnhancedService;
    services: EnhancedService[];
    locations: Location[];
};

export function EditServiceModal({
    service,
    services = [],
    locations = [],
}: EditServiceModalProps) {
    const [open, toggle] = useState(false);

    const [sendingService, setSendingService] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    const serviceIsMultiPrice = useMemo(
        () =>
            uniq(
                service.servicesOnLocationsWithPricing.map(
                    (relation) => relation.pricing.price
                )
            ).length > 1
                ? true
                : false,
        [service.servicesOnLocationsWithPricing]
    );
    const singlePrice = useMemo(
        () => service.servicesOnLocationsWithPricing[0].pricing.price,
        [service.servicesOnLocationsWithPricing]
    );
    const multiPrice = useMemo(() => {
        const multiPriceInitialValue: EditServiceModalForm['multiPrice'] = {};

        return service.servicesOnLocationsWithPricing.reduce((acc, curVal) => {
            return Object.assign({}, acc, {
                [curVal.locationId]: curVal.pricing.price,
            });
        }, multiPriceInitialValue);
    }, [service.servicesOnLocationsWithPricing]);

    const form = useForm<EditServiceModalForm>({
        initialValues: {
            serviceName: service.name,
            serviceDescription: service.description,
            locations: service.servicesOnLocationsWithPricing.map(
                (relation) => relation.location.id
            ),
            price: serviceIsMultiPrice ? 0 : singlePrice,
            isMultiPrice: serviceIsMultiPrice,
            multiPrice: !serviceIsMultiPrice ? {} : multiPrice,
        },
        validate: ({
            serviceName: formName,
            serviceDescription: formDescription,
            locations,
            price,
            isMultiPrice,
            multiPrice,
        }) => ({
            serviceName:
                formName.length < 2
                    ? missingNameError
                    : services.some(
                          ({ name: serviceName, id: serviceId }) =>
                              serviceId !== service.id &&
                              formName === serviceName
                      )
                    ? invalidNameError
                    : null,
            serviceDescription:
                formDescription.length < 2
                    ? missingDescriptionError
                    : services.some(
                          ({
                              description: serviceDescription,
                              id: serviceId,
                          }) =>
                              serviceId !== service.id &&
                              formDescription === serviceDescription
                      )
                    ? invalidDescriptionError
                    : null,
            locations: locations.length > 0 ? null : missingLocationsError,
            price: isMultiPrice ? null : price > 0 ? null : missingPriceError,
            multiPrice: !isMultiPrice
                ? null
                : locations.every(
                      (locationId) =>
                          typeof multiPrice[locationId] !== 'undefined'
                  )
                ? null
                : missingPricesError,
        }),
    });

    const isFormDirty = useMemo(() => {
        if (!form.isDirty()) {
            return false;
        }

        const isPriceDirty = form.values.isMultiPrice
            ? form.values.locations.every(
                  (formLocationId) => form.values.multiPrice[formLocationId] > 0
              )
            : form.values.price > 0;

        return isPriceDirty;
    }, [form]);

    const locationsForInput = useMemo<InputProps[]>(
        () =>
            locations.map(({ id, alias, address }) => ({
                value: id,
                label: alias,
                description: address,
            })),
        [locations]
    );

    useEffect(() => {
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toggle]);

    async function submitService(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setSendingService(true);

        await fetch(`/api/doctor/editService?serviceId=${service.id}`, {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then(async (response) => {
                setSendingService(false);
                handleError(response);
                revalidate();
                toggle(false);

                showNotification({
                    message: 'Serviço adicionado com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });
            })
            .catch((error) => {
                switch (error) {
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
                                    'Por favor, volte a tentar submeter a nova localização. Entretanto, já estamos em cima do assunto.',
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

    return (
        <div>
            <IconPencil
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(true)}
            />
            <Modal
                opened={open}
                onClose={() => toggle(false)}
                title={<div className="title">Editar serviço</div>}
                centered
                styles={{ modal: { maxHeight: '80vh', overflowY: 'scroll' } }}
            >
                <form onSubmit={submitService} className="servicesForm">
                    <div className="serviceInputs">
                        <TextInput
                            label="Nome"
                            placeholder="Consulta individual de psicologia"
                            withAsterisk
                            {...form.getInputProps('serviceName')}
                        />
                        <TextInput
                            label="Descrição"
                            placeholder="Consulta individual de psicoterapia dinâmica para adultos e adolescentes"
                            {...form.getInputProps('serviceDescription')}
                        />
                        <MultiSelect
                            label="Escolha uma ou mais localizações para o serviço"
                            data={locationsForInput}
                            withAsterisk
                            {...form.getInputProps('locations')}
                        />
                        {!form.values.isMultiPrice ? (
                            <NumberInput
                                label="Preço"
                                defaultValue={0}
                                precision={2}
                                min={0}
                                max={8561}
                                {...form.getInputProps('price')}
                            />
                        ) : (
                            form.values.locations.map((locationId) => {
                                const thisLocationAlias = locations.find(
                                    ({ id: thisLocationId }) =>
                                        thisLocationId === locationId
                                )?.alias as string;

                                const value = Number(
                                    form.values.multiPrice[locationId] || 0
                                );

                                return (
                                    <NumberInput
                                        key={locationId}
                                        label={`Preço - ${thisLocationAlias}`}
                                        defaultValue={0}
                                        precision={2}
                                        min={0}
                                        max={8561}
                                        value={value}
                                        onChange={(e) =>
                                            form.setFieldValue(
                                                'multiPrice',
                                                Object.assign(
                                                    {},
                                                    form.values.multiPrice,
                                                    {
                                                        [locationId]: Number(
                                                            e?.toString()
                                                        ),
                                                    }
                                                )
                                            )
                                        }
                                    />
                                );
                            })
                        )}
                        {form.values.locations.length > 1 ? (
                            <Checkbox
                                className="priceCheckbox"
                                label="Diferenciar preço por localização?"
                                {...form.getInputProps('isMultiPrice', {
                                    type: 'checkbox',
                                })}
                            />
                        ) : null}
                    </div>
                    <Button
                        type="submit"
                        loading={sendingService}
                        disabled={!isFormDirty}
                        radius="md"
                        size="md"
                        className="settingsButtons"
                    >
                        Adicionar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
