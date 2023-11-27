import { useEffect, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import { Button, Modal, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconPencil, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { GenericErrors, LocationErrors } from '~/utils/common';
import type { EnhancedLocation } from '~/utils/common/types';

const missingAliasError = 'Insira um nome';
const invalidAliasError = 'Já tem uma localização com este nome';

const missingAddressError = 'Insira um endereço';
const invalidAddressError = 'Já tem uma localização com este endereço';

type EditLocationModalProps = {
    location: EnhancedLocation;
    locations: EnhancedLocation[];
};

export function EditLocationModal({
    location,
    locations,
}: EditLocationModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();

    const revalidator = useRevalidator();

    const form = useForm({
        initialValues: { alias: location.alias, address: location.address },
        validate: ({ alias: formAlias, address: formAddress }) => ({
            alias:
                formAlias.length < 2
                    ? missingAliasError
                    : locations
                          .filter(
                              (thisLocation) => thisLocation.id !== location.id
                          )
                          .some(
                              ({ alias: locationAlias }) =>
                                  formAlias === locationAlias
                          )
                    ? invalidAliasError
                    : null,
            address:
                formAddress.length < 2
                    ? missingAddressError
                    : locations
                          .filter(
                              (thisLocation) => thisLocation.id !== location.id
                          )
                          .some(
                              ({ address: locationAddress }) =>
                                  formAddress === locationAddress
                          )
                    ? invalidAddressError
                    : null,
        }),
    });

    useEffect(() => {
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toggle]);

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setSending(true);

        await fetch(`/api/doctor/editLocation?locationId=${location.id}`, {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                setSending(false);
                handleError(response);
                form.setValues({ alias: '', address: '' });
                revalidator.revalidate();
                toggle(false);

                showNotification({
                    message: 'Localização alterada com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });
            })
            .catch((error) => {
                switch (error) {
                    case LocationErrors.MISSING_INPUT_ALIAS: {
                        form.setFieldError('alias', missingAliasError);
                        break;
                    }
                    case LocationErrors.MISSING_INPUT_ADDRESS: {
                        form.setFieldError('address', missingAddressError);
                        break;
                    }
                    case LocationErrors.ALIAS_ALREADY_EXISTS: {
                        form.setFieldError('alias', invalidAliasError);
                        break;
                    }
                    case LocationErrors.ADDRESS_ALREADY_EXISTS: {
                        form.setFieldError('address', invalidAddressError);
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
                                    'Por favor, volte a tentar submeter as alterações. Entretanto, já estamos em cima do assunto.',
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
                closeOnClickOutside
                title={<div className="title">Editar localização</div>}
                centered
                zIndex={1000}
            >
                <form onSubmit={submit}>
                    <TextInput
                        name="alias"
                        label="Nome"
                        placeholder={form.errors.alias ? '' : 'Braga'}
                        sx={(theme) => ({ marginBottom: theme.spacing.md })}
                        validateInputOnChange={true}
                        {...form.getInputProps('alias')}
                    />
                    <TextInput
                        name="address"
                        label="Endereço"
                        placeholder={
                            form.errors.address
                                ? ''
                                : 'Rua Ponte Pedrinha, nº 64, 4705-183, Lomar'
                        }
                        sx={(theme) => ({ marginBottom: theme.spacing.md })}
                        validateInputOnChange={true}
                        {...form.getInputProps('address')}
                    />
                    <br />
                    <Button
                        type="submit"
                        loading={sending}
                        disabled={!form.isDirty()}
                        radius="md"
                        size="md"
                    >
                        Salvar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
