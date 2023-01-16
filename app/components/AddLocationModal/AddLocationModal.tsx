import { useState } from 'react';

import type { Location } from '@prisma/client';

import { Modal, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons';

type AddPatientModalProps = {
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
};

export function AddLocationModal({
    locations,
    setLocations,
}: AddPatientModalProps) {
    const [open, toggle] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const form = useForm({
        initialValues: { alias: '', address: '' },
        validate: ({ alias, address }) => ({
            alias:
                alias.length < 2
                    ? 'Insira um nome'
                    : locations.some(
                          ({ alias: locationAlias }) => alias === locationAlias
                      )
                    ? 'Já tem uma localização com este nome'
                    : null,
            address: address.length >= 2 ? null : 'Insira um endereço',
        }),
    });

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setSending(true);

        await fetch('/api/doctor/addLocation', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                handleError(response);

                showNotification({
                    message: 'Localização adicionada com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });

                toggle(false);
            })
            .catch(() => {
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
            })
            .finally(() => {
                setSending(false);
            });
    }

    return (
        <div>
            <Button onClick={() => toggle(true)}>Adicionar Localização</Button>
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
                        validateInputOnChange
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
                        validateInputOnChange
                        {...form.getInputProps('address')}
                    />
                    <br />
                    <Button
                        type="submit"
                        name="action"
                        loading={sending}
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
