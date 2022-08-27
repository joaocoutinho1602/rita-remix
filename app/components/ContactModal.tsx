import React, { useState } from 'react';

import { Button, Modal, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
// import { useViewportSize } from '@mantine/hooks';
// import { showNotification } from '@mantine/notifications';

// import { IconCheck, IconX } from '@tabler/icons';

type ContactModalProps = {
    buttonStyles: { [key: string]: string | number };
};

export function ContactModal({ buttonStyles }: ContactModalProps) {
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // const { width } = useViewportSize();

    const form = useForm({
        initialValues: {
            name: '',
            email: '',
            phone: '',
            description: '',
        },
        validate: ({ name, email, phone }) => ({
            name: name.length > 0 ? null : 'Escreva o seu nome',
            email:
                email.length > 0 &&
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
                    ? null
                    : 'Escreva um email válido',
            phone:
                phone.length === 9 &&
                (phone.charAt(0) === '2' ||
                    ['91', '92', '93', '96'].some(
                        (prefix) => prefix === phone.slice(0, 2)
                    ))
                    ? null
                    : 'Escreva um número válido',
        }),
    });

    async function sendEmail(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (form.validate().hasErrors) {
            return;
        }

        const { name, email, phone, description } = form.values;

        console.log(
            'name, email, phone, description -> ',
            name,
            email,
            phone,
            description
        );

        // setSending(true);

        // mutate(
        //     { name, email, phone, description },
        //     {
        //         onSuccess: () => {
        //             setSent(true);
        //             setTimeout(toggle, 5000);
        //             showNotification({
        //                 id: 'email-success',
        //                 autoClose: 5000,
        //                 title: 'Enviado com sucesso',
        //                 message: 'será contactada/o em breve',
        //                 color: 'teal',
        //                 icon: <IconCheck />,
        //                 loading: false,
        //             });
        //         },
        //         onError: () => {
        //             showNotification({
        //                 id: 'email-error',
        //                 autoClose: 5000,
        //                 title: 'Ocorreu um erro',
        //                 message: 'tente submeter novamente',
        //                 color: 'red',
        //                 icon: <IconX />,
        //                 loading: false,
        //             });
        //         },
        //         onSettled: () => {
        //             setSending(false);
        //         },
        //     }
        // );
    }

    function toggle() {
        setOpen(!open);
        if (sent) {
            setSent(false);
            form.setValues({
                name: '',
                email: '',
                phone: '',
                description: '',
            });
        }
        setSending(false);
    }

    return (
        <div>
            <div style={classes.buttonContainer}>
                <Button
                    onClick={toggle}
                    radius="md"
                    style={{ ...classes.openButton, ...buttonStyles }}
                >
                    Marcar Consulta
                </Button>
            </div>
            <Modal
                opened={open}
                onClose={toggle}
                title={<div style={classes.title}>Formulário de Contacto</div>}
            >
                <form onSubmit={sendEmail}>
                    <TextInput
                        placeholder={form.errors.name ? '' : 'Joana Silva'}
                        label="Nome"
                        sx={(theme) => ({ marginBottom: theme.spacing.md })}
                        {...form.getInputProps('name')}
                    />
                    <TextInput
                        placeholder={
                            form.errors.email ? '' : 'joanasilva@email.com'
                        }
                        label="Email"
                        sx={(theme) => ({ marginBottom: theme.spacing.md })}
                        {...form.getInputProps('email')}
                    />
                    <TextInput
                        placeholder={form.errors.phone ? '' : '912345678'}
                        label="Telefone"
                        sx={(theme) => ({ marginBottom: theme.spacing.xl })}
                        {...form.getInputProps('phone')}
                    />
                    <Textarea
                        placeholder="Escreva sobre o motivo do seu contacto,
                    ou peça mais informações"
                        autosize
                        minRows={5}
                        {...form.getInputProps('description')}
                    />
                    <div style={classes.sendButtonContainer}>
                        <Button
                            type="submit"
                            loading={sending}
                            radius="md"
                            size="md"
                            style={classes.sendButton}
                        >
                            Enviar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

const classes = {
    buttonContainer: { padding: '0.5rem' },
    openButton: {
        fontWeight: 500,
        backgroundColor: '#495057',
        transition: 'all 0.2s ease-in-out',
        '&:hover': { backgroundColor: '#adb5bd' },
    },
    title: { fontSize: 24, marginTop: '0.5rem' },
    sendButtonContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    sendButton: {
        marginTop: '1.5rem',
        fontSize: 20,
        fontWeight: 500,
        backgroundColor: '#37b24d',
        transition: 'all 0.2s ease-in-out',
        '&:hover': { backgroundColor: '#51cf66' },
    },
};
