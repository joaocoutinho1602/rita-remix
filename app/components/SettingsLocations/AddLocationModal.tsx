import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import { Button, Modal, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { GenericErrors, LocationErrors } from '~/utils/common';
import type { EnhancedLocation } from '~/utils/common/types';

const missingAliasError = 'Insira um nome';
const invalidAliasError = 'Já tem uma localização com este nome';

const missingAddressError = 'Insira um endereço';
const invalidAddressError = 'Já tem um endereço com este nome';

type AddLocationModalForm = { alias: string; address: string };
const formInitialValues: AddLocationModalForm = { alias: '', address: '' };

type AddPatientModalProps = {
    locations: EnhancedLocation[];
};

export function AddLocationModal({ locations }: AddPatientModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    const form = useForm({
        initialValues: formInitialValues,
        validate: ({ alias: formAlias, address: formAddress }) => ({
            alias:
                formAlias.length < 2
                    ? missingAliasError
                    : locations.some(
                          ({ alias: locationAlias }) =>
                              formAlias === locationAlias
                      )
                    ? invalidAliasError
                    : null,
            address:
                formAddress.length < 2
                    ? missingAddressError
                    : locations.some(
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

        await fetch('/api/doctor/addLocation', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then(async (response) => {
                setSending(false);
                handleError(response);
                form.setValues(formInitialValues);
                revalidate();
                toggle(false);

                showNotification({
                    message: 'Localização adicionada com sucesso',
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
                        form.setFieldError('alias', missingAddressError);
                        break;
                    }
                    case LocationErrors.ALIAS_ALREADY_EXISTS: {
                        form.setFieldError('alias', invalidAliasError);
                        break;
                    }
                    case LocationErrors.ADDRESS_ALREADY_EXISTS: {
                        form.setFieldError('alias', invalidAddressError);
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

    const isFormFilled = useMemo(
        () => Object.keys(form.values).every((key) => form.isDirty(key)),
        [form]
    );

    return (
        <div>
            <Button onClick={() => toggle(true)}>Adicionar localização</Button>
            <Modal
                opened={open}
                onClose={() => toggle(false)}
                closeOnClickOutside
                title={<div className="title">Adicionar localização</div>}
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
                        disabled={!isFormFilled}
                        radius="md"
                        size="md"
                    >
                        Adicionar
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
