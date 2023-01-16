import { useState } from 'react';

import type { Location } from '@prisma/client';

import { Button, Modal, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconPencil, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';

type EditLocationModalProps = {
    locationId: string;
    locations: Location[];
    setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
};

export function EditLocationModal({
    locationId,
    locations,
    setLocations,
}: EditLocationModalProps) {
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

        await fetch(`/api/doctor/editLocation?locationId=${locationId}`, {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                handleError(response);

                const newLocations: Location[] = locations.map(
                    ({ address, alias, doctorEmail, id }) =>
                        id === locationId
                            ? {
                                  id,
                                  doctorEmail,
                                  address: form.values.address,
                                  alias: form.values.alias,
                              }
                            : { address, alias, doctorEmail, id }
                );
                setLocations(newLocations);
                toggle(false);

                showNotification({
                    message: 'Localização adicionada com sucesso',
                    autoClose: 5000,
                    color: 'green',
                    icon: <IconCheck size={18} />,
                });
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
                        autoClose: 5000,
                    });
                } else {
                    showNotification({
                        title: 'Estamos com problemas',
                        message:
                            'Vamos tentar resolver tudo o mais rapidamente possível',
                        color: 'red',
                        icon: <IconX size={18} />,
                        autoClose: 10000,
                    });
                }
            })
            .finally(() => {
                setSending(false);
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
