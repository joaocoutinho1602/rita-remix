import { useEffect, useState } from 'react';

import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
    Link,
    useLoaderData,
    useNavigate,
    useTransition,
} from '@remix-run/react';

import { TextInput, Select, Button, Checkbox, Space } from '@mantine/core';
import { useForm } from '@mantine/form';

import { IconQuestionCircle, IconX } from '@tabler/icons';

import {
    DoctorSpecialty,
    GenericErrors,
    logError,
    SignupErrors,
} from '~/utils/common';
import { db } from '~/utils/server';

import styles from '~/styles/signup.css';
import { errorsInForm, handleError } from '~/utils/client/forms';
import { WrappedTooltip } from '~/components';
import { cleanNotifications, showNotification } from '@mantine/notifications';

export const links: LinksFunction = () => {
    return [{ rel: 'stylesheet', href: styles }];
};

export const loader: LoaderFunction = async ({ request }) => {
    try {
        const specialties = await db.doctorSpecialty
            .findMany({
                select: { id: true, name: true },
            })
            .catch((error) => {
                logError({
                    filePath: '/office/index.tsx',
                    message: `prisma error - SELECT (id, name) FROM DoctorSpecialty`,
                    error,
                });

                throw GenericErrors.PRISMA_ERROR;
            });

        const dropdownEntries = specialties
            .map(({ id, name }) => ({
                value: id,
                /**
                 *? For some reason Typescript thinks it can't match strings to enum entries that are also strings, but it can and it does
                 */
                //@ts-ignore
                label: (DoctorSpecialty[name] as string) || '',
            }))
            .filter(({ label }) => label.length > 0);

        const url = new URL(request.url);

        return json({
            dropdownEntries,
            email: url.searchParams.get('email') || '',
        });
    } catch (error) {
        switch (error) {
            default: {
                logError({
                    filePath: '/office/index.tsx',
                    message: 'loader unknown error',
                    error,
                });

                return json({ error: GenericErrors.UNKNOWN_ERROR });
            }
        }
    }
};

type LoaderType = {
    dropdownEntries: {
        value: string;
        label: string;
    }[];
    email: string;
    error?: string;
};

export default function Signup() {
    const { dropdownEntries, email } = useLoaderData<LoaderType>();
    const navigate = useNavigate();
    const transition = useTransition();

    const submitting =
        transition.state === 'submitting' &&
        transition.submission.formData.get('signupActions') === 'signup';

    const [isDoctor, setIsDoctor] = useState(false);

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: email || '',
            password: '',
            repeatPassword: '',
            doctorSpecialtyId: '',
        },
        validate: ({
            firstName,
            lastName,
            email,
            password,
            repeatPassword,
            doctorSpecialtyId,
        }) => ({
            firstName: firstName.length >= 2 ? null : 'Insira o seu nome',
            lastName: lastName.length >= 2 ? null : 'Insira o seu nome',
            email:
                email.length > 0 &&
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
                    ? null
                    : 'Email inválido',
            password: password.length >= 9 ? null : 'Mínimo de 9 caracteres',
            repeatPassword:
                password === repeatPassword
                    ? null
                    : 'As passwords têm de ser iguais',
            doctorSpecialtyId:
                !isDoctor || (isDoctor && doctorSpecialtyId.length > 0)
                    ? null
                    : 'Tem de escolher uma especialidade',
        }),
    });

    useEffect(() => {
        cleanNotifications();
    }, []);

    useEffect(() => {
        if (!isDoctor) {
            form.setValues({ doctorSpecialtyId: '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDoctor]);

    async function mySubmit(
        e:
            | React.FormEvent<HTMLFormElement>
            | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        if (errorsInForm(e, form)) {
            return;
        }

        await fetch('/api/signup', {
            method: 'POST',
            body: JSON.stringify(form.values),
        })
            .then(async (response) => {
                handleError(response);

                /**
                 * Redirect the user to the home page
                 */
                const url = new URL(response.url);
                navigate(url.pathname);
            })
            .catch((message) => {
                switch (message) {
                    case SignupErrors.EMAIL_ALREADY_REGISTERED: {
                        showNotification({
                            title: 'Este email já está registado.',
                            message: 'Clique aqui para fazer o login',
                            onClick: () =>
                                navigate(`/login?email=${form.values.email}`),
                            autoClose: false,
                            styles: { root: { marginTop: '50px' } },
                        });
                        break;
                    }
                    default: {
                        showNotification({
                            title: 'Algo de errado aconteceu',
                            message: 'Já estamos a tratar do assunto',
                            icon: <IconX />,
                            color: 'red',
                            autoClose: false,
                            styles: { root: { marginTop: '50px' } },
                        });
                    }
                }
            });
    }

    return (
        <div className="container">
            <div className="formContainer">
                <h1>MEDICI</h1>
                <h3>Registo</h3>
                <form onSubmit={mySubmit} className="form">
                    <TextInput
                        type="text"
                        label="Primeiro nome"
                        sx={(theme) => ({
                            marginBottom: theme.spacing.md,
                        })}
                        name="password"
                        {...form.getInputProps('firstName')}
                    />
                    <TextInput
                        type="text"
                        label="Apelido"
                        sx={(theme) => ({
                            marginBottom: theme.spacing.md,
                        })}
                        name="password"
                        {...form.getInputProps('lastName')}
                    />
                    <TextInput
                        type="text"
                        label="Email"
                        placeholder={
                            form.errors.email ? '' : 'joanasilva@email.com'
                        }
                        sx={(theme) => ({
                            marginBottom: theme.spacing.md,
                        })}
                        name="email"
                        {...form.getInputProps('email')}
                    />
                    <TextInput
                        type="password"
                        label="Password"
                        sx={(theme) => ({
                            marginBottom: theme.spacing.md,
                        })}
                        name="password"
                        {...form.getInputProps('password')}
                    />
                    <TextInput
                        type="password"
                        label="Repetir password"
                        sx={(theme) => ({
                            marginBottom: theme.spacing.md,
                        })}
                        name="password"
                        {...form.getInputProps('repeatPassword')}
                    />
                    <div className="checkboxTooltipContainer">
                        <Checkbox
                            label="Sou especialista de saúde"
                            checked={isDoctor}
                            onChange={() => setIsDoctor(!isDoctor)}
                        />
                        <WrappedTooltip
                            label="Marque esta caixa se planear usar esta plataforma como um profissional de saúde, ou deixe desmarcada caso apenas pretenda usá-la como cliente"
                            Icon={IconQuestionCircle}
                        />
                    </div>
                    {isDoctor ? (
                        <Select
                            label="Especialidade"
                            data={dropdownEntries}
                            {...form.getInputProps('doctorSpecialtyId')}
                        />
                    ) : null}
                    <Button
                        loading={submitting}
                        radius="md"
                        size="md"
                        style={classes.sendButton}
                        onClick={mySubmit}
                        type="submit"
                    >
                        Enviar
                    </Button>
                    <Space h="xs" />
                    <Link to="/login">Já estou registado</Link>
                </form>
            </div>
        </div>
    );
}

const classes = {
    sendButton: {
        marginTop: '1.5rem',
        fontSize: 20,
        fontWeight: 500,
        transition: 'all 0.2s ease-in-out',
    },
};
