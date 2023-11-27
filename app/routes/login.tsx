import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';

import { useLocalStorage } from '@mantine/hooks';

import {
    Button,
    Checkbox,
    Loader,
    Popover,
    Space,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { cleanNotifications, showNotification } from '@mantine/notifications';
import { IconAlertCircle, IconX } from '@tabler/icons';

import type { CustomFormEvent } from '~/utils/client/forms';
import { errorsInForm, handleError } from '~/utils/client/forms';
import { ErrorCodes, LoginErrors, SuccessCodes } from '~/utils/common';

import styles from '~/styles/login.css';
import { getSession, SessionData } from '~/utils/server';

export function links() {
    return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
    const session = await getSession(request.headers.get('Cookie'));
    const email = session.get(SessionData.EMAIL);

    if (email?.length) {
        return redirect('/office');
    }

    const url = new URL(request.url);

    return json({ email: url.searchParams.get('email') || '' });
};

export default function Login() {
    const { email } = useLoaderData();

    const [keepLoggedIn, setKeepLoggedIn] = useState(true);
    const [verifyingKeptSession, setVerifyingKeptSession] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const [userEmailLocalStorage, setUserEmailLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInUserEmail',
    });
    const [passwordLocalStorage, setPasswordLocalStorage] = useLocalStorage({
        key: 'officeKeepLoggedInPassword',
    });

    const navigate = useNavigate();

    useEffect(() => {
        cleanNotifications();
    }, []);

    useEffect(() => {
        /**
         * This useEffect handles the login of a user that had already logged into this device once and chose to keep their user logged in
         */
        if (
            keepLoggedIn &&
            userEmailLocalStorage?.length &&
            passwordLocalStorage?.length
        ) {
            setVerifyingKeptSession(true);

            fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: userEmailLocalStorage,
                    password: passwordLocalStorage,
                    fromLocalStorage: true,
                }),
            })
                .then((response) => {
                    switch (response.status) {
                        case ErrorCodes.CUSTOM_ERROR: {
                            throw response.statusText;
                        }
                        case SuccessCodes.OK: {
                            flushSync(() => setRedirecting(true));
                            const url = new URL(response.url);
                            navigate(url.pathname);
                        }
                    }
                })
                .catch((message) => {
                    switch (message) {
                        /**
                         * If the email in local storage isn't registered, or if the hashed password in local storage was wrong, we reset the data in local storage and the user is required to log in as usual
                         */
                        case LoginErrors.EMAIL_NOT_REGISTERED:
                        case LoginErrors.WRONG_HASH: {
                            setUserEmailLocalStorage('');
                            setPasswordLocalStorage('');
                            break;
                        }
                    }
                })
                .finally(() => {
                    setVerifyingKeptSession(false);
                });
        }
    }, [
        userEmailLocalStorage,
        passwordLocalStorage,
        navigate,
        setUserEmailLocalStorage,
        setPasswordLocalStorage,
        keepLoggedIn,
    ]);

    const form = useForm({
        initialValues: {
            email: email || '',
            password: '',
        },
        validate: ({ email, password }) => ({
            email:
                email.length > 0 &&
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
                    ? null
                    : 'Email inválido',
            password: password.length >= 9 ? null : 'Mínimo de 9 caracteres',
        }),
    });

    async function submit(e: CustomFormEvent) {
        if (errorsInForm(e, form)) {
            return;
        }

        setError('');
        setSending(true);

        const { email, password } = form.values;

        await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, keepLoggedIn }),
        })
            .then(async (response) => {
                setSending(false);
                handleError(response);

                flushSync(() => setRedirecting(true));

                const url = new URL(response.url);

                /**
                 * If the user wants to stay logged in, we save their email and a hash of their password into local storage
                 */
                if (keepLoggedIn) {
                    const hashedPassword = url.searchParams.get('password');

                    setUserEmailLocalStorage(email);
                    setPasswordLocalStorage(hashedPassword as string);
                }

                /**
                 * Redirect the user to the home page
                 */
                navigate(url.pathname);
            })
            .catch((message) => {
                switch (message) {
                    case LoginErrors.EMAIL_NOT_REGISTERED: {
                        showNotification({
                            title: 'Este email não está registado',
                            message: 'Clique aqui para se registar',
                            onClick: () =>
                                navigate(`/signup?email=${form.values.email}`),
                            autoClose: false,
                            styles: { root: { marginTop: '50px' } },
                        });
                        break;
                    }
                    case LoginErrors.WRONG_PASSWORD: {
                        showNotification({
                            message: 'A password está errada',
                            color: 'red',
                            icon: <IconX />,
                            disallowClose: true,
                            styles: { root: { marginTop: '50px' } },
                        });
                        break;
                    }
                    default: {
                        showNotification({
                            title: 'Algo de errado aconteceu',
                            message: 'Já estamos a tratar do assunto',
                            color: 'red',
                            icon: <IconX />,
                            autoClose: false,
                            styles: { root: { marginTop: '50px' } },
                        });
                    }
                }
            });
    }

    return (
        <div className="container">
            {verifyingKeptSession || redirecting ? (
                <Loader />
            ) : (
                <div className="formContainer">
                    <h1>MEDICI</h1>
                    <form onSubmit={(e) => submit(e)} className="form">
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
                        <Popover
                            opened={error === LoginErrors.WRONG_PASSWORD}
                            withArrow
                            transition={'fade'}
                            transitionDuration={200}
                            position="right"
                        >
                            <Popover.Target>
                                <TextInput
                                    type="password"
                                    label="Password"
                                    sx={(theme) => ({
                                        marginBottom: theme.spacing.md,
                                    })}
                                    name="password"
                                    {...form.getInputProps('password')}
                                />
                            </Popover.Target>
                            <Popover.Dropdown>
                                <div className="popoverDropdown">
                                    <IconAlertCircle color="#ff6b6b" />
                                    <Space w="xs" />
                                    <div>Esta password está errada.</div>
                                </div>
                            </Popover.Dropdown>
                        </Popover>
                        <Checkbox
                            label="Manter-me autenticado neste dispositivo"
                            checked={keepLoggedIn}
                            onChange={(e) =>
                                setKeepLoggedIn(e.currentTarget.checked)
                            }
                        />
                        <Button
                            loading={sending}
                            radius="md"
                            size="md"
                            style={classes.sendButton}
                            onClick={submit}
                            type="submit"
                        >
                            Enviar
                        </Button>
                        <Space h="xs" />
                        <Link to="/signup">Criar conta</Link>
                    </form>
                </div>
            )}
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
