import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

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
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { GenericErrors, ServiceErrors } from '~/utils/common';
import type { EnhancedLocation, EnhancedService, SelectInputProps } from '~/utils/common/types';

const invalidNameError = 'Já tem um serviço com este nome';
const invalidDescriptionError = 'Já tem um serviço com esta descrição';
const missingNameError = 'Tem de dar um nome ao serviço';
const missingDescriptionError = 'Tem de escrever uma descrição para o serviço';
const missingDurationError = 'Tem de especificar uma duração para o serviço';
const missingLocationError = 'Tem de atribuir uma localização ao serviço';
const missingPriceError = 'Tem de atribuir um preço maior que zero ao serviço';
const missingPricesError = 'Tem de atribuir preços a cada serviço';

export type AddServiceModalForm = {
    serviceName: string;
    serviceDescription: string;
    duration: Number;
    locations: string[];
    price: Number;
    isMultiPrice: boolean;
    multiPrice: { [locationId: string]: Number };
};
const formInitialValues: AddServiceModalForm = {
    serviceName: '',
    serviceDescription: '',
    duration: 0,
    locations: [],
    price: 0,
    isMultiPrice: false,
    multiPrice: {},
};

type AddServiceModalProps = {
    services: EnhancedService[];
    locations: EnhancedLocation[];
};

export function AddServiceModal({
    services = [],
    locations = [],
}: AddServiceModalProps) {
    const [open, toggle] = useState(false);

    const [sendingService, setSendingService] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    const form = useForm<AddServiceModalForm>({
        initialValues: formInitialValues,
        validate: ({
            serviceName: formName,
            serviceDescription: formDescription,
            duration,
            locations,
            price,
            isMultiPrice,
            multiPrice,
        }) => ({
            serviceName: services.some(
                ({ name: serviceName }) => formName === serviceName
            )
                ? invalidNameError
                : null,
            serviceDescription: services.some(
                ({ description: serviceDescription }) =>
                    formDescription === serviceDescription
            )
                ? invalidDescriptionError
                : null,
            duration: duration > 0 ? null : missingPriceError,
            price: isMultiPrice || price > 0 ? null : missingPriceError,
            multiPrice:
                !isMultiPrice ||
                locations.every((locationId) => multiPrice[locationId] > 0)
                    ? null
                    : missingPricesError,
        }),
    });

    const isFormFilled = useMemo(() => {
        if (!form.isDirty()) {
            return false;
        }
        const isPriceFilled = form.values.isMultiPrice
            ? form.values.locations.every(
                  (formLocationId) => form.values.multiPrice[formLocationId] > 0
              )
            : form.values.price > 0;

        return isPriceFilled;
    }, [form]);

    const locationsForInput = useMemo<SelectInputProps>(
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

        await fetch('/api/doctor/addService', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then(async (response) => {
                setSendingService(false);
                handleError(response);
                form.setValues(formInitialValues);
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
                    case ServiceErrors.MISSING_INPUT_NAME: {
                        form.setFieldError('serviceName', missingNameError);
                        break;
                    }
                    case ServiceErrors.MISSING_INPUT_DESCRIPTION: {
                        form.setFieldError('serviceDescription', missingDescriptionError);
                        break;
                    }
                    case ServiceErrors.MISSING_INPUT_DURATION: {
                        form.setFieldError('duration', missingDurationError);
                        break;
                    }
                    case ServiceErrors.MISSING_INPUT_LOCATION: {
                        form.setFieldError('locations', missingLocationError);
                        break;
                    }
                    case ServiceErrors.MISSING_INPUT_PRICE: {
                        form.setFieldError('price', missingPriceError);
                        break;
                    }
                    case ServiceErrors.MISSING_INPUT_MULTIPRICE: {
                        form.setFieldError('multiPrice', missingPricesError);
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
            <Button onClick={() => toggle(true)}>Adicionar serviço</Button>
            <Modal
                opened={open}
                onClose={() => toggle(false)}
                title={<div className="title">Adicionar serviço</div>}
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
                        <NumberInput
                                label="Duração"
                                defaultValue={0}
                                precision={2}
                                min={0}
                                max={8561}
                                {...form.getInputProps('duration')}
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
                        disabled={!isFormFilled}
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
