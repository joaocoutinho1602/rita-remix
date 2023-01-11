import { useState } from 'react';

import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
    Link,
    useLoaderData,
    useNavigate,
    useTransition,
} from '@remix-run/react';

import {
    TextInput,
    Select,
    Button,
    Checkbox,
    Space,
    Popover,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import { IconAlertCircle } from '@tabler/icons';

import { DoctorSpecialty, ErrorCodes, SignupErrors } from '~/utils/common';
import { db } from '~/utils/server';

import styles from '~/styles/signup.css';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export async function loader({ request }: LoaderArgs) {
    const specialties = await db.doctorSpecialty.findMany({
        select: { id: true, name: true },
    });

    const dropdownEntries = specialties
        .map(({ id, name }) => ({
            value: id,
            /**
             *? For some reason Typescript thinks is can't match strings to enum entries, but it can and it does
             */
            //@ts-ignore
            label: DoctorSpecialty[name] || '',
        }))
        .filter(({ label }) => label.length > 0);

    const url = new URL(request.url);

    return json({
        dropdownEntries,
        email: url.searchParams.get('email') || '',
    });
}

export default function Signup() {
    const { dropdownEntries, email } = useLoaderData();
    const navigate = useNavigate();
    const transition = useTransition();

    const submitting =
        transition.state === 'submitting' &&
        transition.submission.formData.get('signupActions') === 'signup';

    const [isDoctor, setIsDoctor] = useState(false);
    const [error, setError] = useState('');

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
                doctorSpecialtyId.length > 0
                    ? null
                    : 'Tem de escolher uma especialidade',
        }),
    });

    async function submit(
        e:
            | React.FormEvent<HTMLFormElement>
            | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        if (e) {
            e.preventDefault();
        }

        if (form.validate().hasErrors) {
            return;
        }

        setError('');

        const { firstName, lastName, email, password, doctorSpecialtyId } =
            form.values;

        await fetch('/api/signup', {
            method: 'POST',
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                doctorSpecialtyId,
            }),
        })
            .then(async (response) => {
                if (response.status === ErrorCodes.CUSTOM_ERROR) {
                    throw response.statusText;
                }

                const url = new URL(response.url);

                /**
                 * Redirect the user to the home page
                 */
                navigate(url.pathname);
            })
            .catch((message) => {
                switch (message) {
                    default: {
                        setError(message);
                    }
                }
            });
    }

    return (
        <div className="container">
            <div className="formContainer">
                <h1>MEDICI</h1>
                <h3>Registo</h3>
                <form onSubmit={(e) => submit(e)} className="form">
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
                    <Popover
                        opened={error === SignupErrors.EMAIL_ALREADY_REGISTERED}
                        withArrow
                        transition={'fade'}
                        transitionDuration={200}
                        position="right"
                    >
                        <Popover.Target>
                            <TextInput
                                type="text"
                                label="Email"
                                placeholder={
                                    form.errors.email
                                        ? ''
                                        : 'joanasilva@email.com'
                                }
                                sx={(theme) => ({
                                    marginBottom: theme.spacing.md,
                                })}
                                name="email"
                                {...form.getInputProps('email')}
                            />
                        </Popover.Target>
                        <Popover.Dropdown>
                            <div className="popoverDropdown">
                                <IconAlertCircle color="#ff6b6b" />
                                <Space w="xs" />
                                <div className="popoverText">
                                    Este email já está registado.
                                </div>
                            </div>
                        </Popover.Dropdown>
                    </Popover>
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
                    <Checkbox
                        label="I agree to sell my privacy"
                        checked={isDoctor}
                        onChange={() => setIsDoctor(!isDoctor)}
                    />
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
                        onClick={(e) => submit(e)}
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
