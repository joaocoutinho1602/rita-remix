import { useState } from 'react';

import { Modal, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';

type AddPatientModalProps = {
    open: boolean;
    toggle: React.Dispatch<React.SetStateAction<boolean>>;
};

export function AddPatientModal({ open, toggle }: AddPatientModalProps) {
    const [sending] = useState(false);

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

                /**
                 * Deal with this shit
                 */
            })
            .catch((error) => {
                /**
                 * Deal with this shit
                 */
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
