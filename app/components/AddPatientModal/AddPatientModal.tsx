import { useState } from 'react';

import { Modal, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { showNotification } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons';

type AddPatientModalProps = {
    open: boolean;
    toggle: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AddPatientModal({ open, toggle }: AddPatientModalProps) {
    const [sending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const form = useForm({
        initialValues: { email: '', firstName: '', lastName: '' },
        validate: ({ firstName, lastName, email }) => ({
            firstName: firstName.length >= 2 ? null : 'Insira um nome',
            lastName: lastName.length >= 2 ? null : 'Insira um nome',
            email:
                email.length > 0 &&
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
                    ? null
                    : 'Email inválido',
        }),
    });

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        await fetch('/api/doctor/addPatient', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                handleError(response);

                showNotification({
                    message: 'Paciente adicionado com sucesso',
                    autoClose: 5000,
                    color: 'green',
                    icon: <IconCheck size={18} />,
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
                        icon: <IconAlertTriangle size={18} />,
                        color: 'yellow',
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
            });
    }

    return (
        <Modal
            opened={open}
            onClose={() => toggle(!open)}
            title={<div className="title">Adicionar paciente</div>}
            centered
        >
            <form onSubmit={submit}>
                <TextInput
                    name="firstName"
                    label="Primeiro nome"
                    placeholder={form.errors.name ? '' : 'Joana'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange
                    {...form.getInputProps('firstName')}
                />
                <TextInput
                    name="lastName"
                    label="Apelido"
                    placeholder={form.errors.name ? '' : 'Silva'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange
                    {...form.getInputProps('lastName')}
                />
                <TextInput
                    name="email"
                    label="Email"
                    placeholder={form.errors.name ? '' : 'joanasilva@email.pt'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange
                    {...form.getInputProps('email')}
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
    );
}
