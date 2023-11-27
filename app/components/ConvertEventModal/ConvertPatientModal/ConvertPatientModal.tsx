import { useMemo, useState } from 'react';

import { useNavigate, useRevalidator } from '@remix-run/react';

import { Modal, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconCheck, IconAlertTriangle, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client';
import { errorsInForm, handleError } from '~/utils/client';
import { PatientErrors, GenericErrors } from '~/utils/common';

import countries from '../../../../public/data/countries.json';

const missingNameError = 'Insira um nome';
const missingEmailError = 'Insira um email';
const missingPhoneError = 'Insira um contacto';
const invalidNameError = 'Insira um nome válido';
const invalidEmailError = 'Email inválido';
const invalidPhoneError = 'Insira um número válido';

export type ConvertPatientForm = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

type ConvertPatientModalProps = {
    open: boolean;
    toggle: React.Dispatch<React.SetStateAction<boolean>>;
    suggestions: { names: string; phone: string };
};

export function ConvertPatientModal({
    open,
    toggle,
    suggestions,
}: ConvertPatientModalProps) {
    console.log(
        '🚀 ~ file: ConvertPatientModal.tsx:39 ~ suggestions',
        suggestions
    );
    const [sending, setSending] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const navigate = useNavigate();
    const { revalidate } = useRevalidator();

    const { firstName, lastName } = useMemo(() => {
        const fullName = suggestions.names.split(' ');
        if (fullName.length === 2) {
            return { firstName: fullName[0], lastName: fullName[1] };
        } else if (fullName.length === 3) {
            return {
                firstName: fullName[0] + fullName[1],
                lastName: fullName[2],
            };
        } else {
            return { firstName: '', lastName: '' };
        }
    }, [suggestions.names]);

    const form = useForm<ConvertPatientForm>({
        initialValues: {
            email: '',
            firstName,
            lastName,
            phone: suggestions.phone,
        },
        validate: ({ firstName, lastName, email, phone }) => ({
            firstName: firstName.length >= 2 ? null : invalidNameError,
            lastName: lastName.length >= 2 ? null : invalidNameError,
            email:
                email.length > 0 &&
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
                    ? null
                    : invalidEmailError,
            phone:
                phone &&
                phone.length === 9 &&
                ['91', '92', '93', '96'].some(
                    (prefix) => prefix === phone.slice(0, 2)
                )
                    ? null
                    : invalidPhoneError,
        }),
    });

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setSending(true);

        await fetch('/api/doctor/addPatient', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then((response) => {
                setSending(false);
                handleError(response);
                revalidate();

                showNotification({
                    message: 'Paciente adicionado com sucesso',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                    disallowClose: true,
                    styles: { root: { marginTop: '50px' } },
                });

                toggle(false);
            })
            .catch((error) => {
                switch (error) {
                    case PatientErrors.MISSING_INPUT_FIRSTNAME: {
                        form.setFieldError('firstName', missingNameError);
                        break;
                    }
                    case PatientErrors.MISSING_INPUT_LASTNAME: {
                        form.setFieldError('lastName', missingNameError);
                        break;
                    }
                    case PatientErrors.MISSING_INPUT_EMAIL: {
                        form.setFieldError('email', missingEmailError);
                        break;
                    }
                    case PatientErrors.MISSING_INPUT_PHONE: {
                        form.setFieldError('phone', missingPhoneError);
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
    return (
        <Modal
            opened={open}
            onClose={() => toggle(!open)}
            title={<div className="title">Converter paciente</div>}
            zIndex={1001}
            centered
        >
            <form onSubmit={submit}>
                {/* {Object.entries(countries).map(([code, data]) => {
                    const  = require('mantine-flagpack/flags');

                })} */}
                <TextInput
                    name="firstName"
                    label="Primeiro nome"
                    placeholder={form.errors.name ? '' : 'Joana'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange={true}
                    {...form.getInputProps('firstName')}
                />
                <TextInput
                    name="lastName"
                    label="Apelido"
                    placeholder={form.errors.name ? '' : 'Silva'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange={true}
                    {...form.getInputProps('lastName')}
                />
                <TextInput
                    name="email"
                    label="Email"
                    placeholder={form.errors.name ? '' : 'joanasilva@email.pt'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange={true}
                    {...form.getInputProps('email')}
                />
                <TextInput
                    name="phone"
                    type="number"
                    label="Telemóvel"
                    placeholder={form.errors.name ? '' : '912345678'}
                    sx={(theme) => ({ marginBottom: theme.spacing.md })}
                    validateInputOnChange={true}
                    {...form.getInputProps('phone')}
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
