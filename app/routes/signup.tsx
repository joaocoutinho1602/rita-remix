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

    async function submit(e?: React.FormEvent<HTMLFormElement>) {
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
                        onClick={() => submit()}
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

// import { useState } from 'react';

// import type { ActionArgs, LoaderArgs } from '@remix-run/node';
// import { json, redirect } from '@remix-run/node';
// import {
//     Link,
//     useActionData,
//     useLoaderData,
//     useTransition,
// } from '@remix-run/react';

// import { ValidatedForm, validationError } from 'remix-validated-form';
// import { withZod } from '@remix-validated-form/with-zod';
// import { z } from 'zod';
// import bcryptjs from 'bcryptjs';

// import {
//     TextInput,
//     Select,
//     Button,
//     Checkbox,
//     Space,
// } from '@mantine/core';
// import { useForm, zodResolver } from '@mantine/form';

// import {
//     commitSession,
//     DoctorSpecialty,
//     GenericErrors,
//     getSession,
//     logError,
//     SignupErrors,
// } from '~/utils/common';
// import { db } from '~/utils/server';

// import styles from '~/styles/signup.css';

// import { TextInputWithPopover } from '~/components';

// export function links() {
//     return [{ rel: 'stylesheet', href: styles }];
// }

// export async function loader({ request }: LoaderArgs) {
//     const specialties = await db.doctorSpecialty.findMany({
//         select: { id: true, name: true },
//     });

//     const dropdownEntries = specialties
//         .map(({ id, name }) => ({
//             value: id,
//             /**
//              *? For some reason Typescript thinks is can't match strings to enum entries, but it can and it does
//              */
//             //@ts-ignore
//             label: DoctorSpecialty[name] || '',
//         }))
//         .filter(({ label }) => label.length > 0);

//     const url = new URL(request.url);

//     return json({
//         dropdownEntries,
//         email: url.searchParams.get('email') || '',
//     });
// }

// export async function action({ request }: ActionArgs) {
//     try {
//         const sessionPromise = getSession(request.headers.get('Cookie'));
//         const fieldValuesPromise = validator.validate(await request.formData());

//         let [session, fieldValues] = await Promise.all([
//             sessionPromise,
//             fieldValuesPromise,
//         ]);

//         if (fieldValues.error) {
//             return validationError(fieldValues.error);
//         }

//         const {
//             firstName,
//             lastName,
//             email,
//             password,
//             doctorSpecialtyId,
//             isDoctor,
//         } = fieldValues.data;

//         const registeredUser = await db.user
//             .findUnique({
//                 where: { email },
//                 select: { email: true },
//             })
//             .catch((error) => {
//                 logError({
//                     filePath: '/signup.tsx',
//                     message: `prisma error ~ SELECT email FROM user WHERE email=${email}`,
//                     error,
//                 });

//                 throw GenericErrors.PRISMA_ERROR;
//             });

//         if (registeredUser?.email) {
//             throw SignupErrors.EMAIL_ALREADY_REGISTERED;
//         }

//         const createdUser = await db.user
//             .create({
//                 data: { firstName, lastName, email, password },
//             })
//             .catch((error) => {
//                 logError({
//                     filePath: '/signup.tsx',
//                     message: `prisma error ~ INSERT INTO User (firstName, lastName, email, password) VALUES (${firstName}, ${lastName}, ${email}, ${password})`,
//                     error,
//                 });

//                 throw SignupErrors.ERROR_CREATING_USER;
//             });

//         if (isDoctor) {
//             await db.doctor
//                 .create({
//                     data: { userEmail: email, doctorSpecialtyId },
//                 })
//                 .catch((error) => {
//                     logError({
//                         filePath: '/signup.tsx',
//                         message: `prisma error ~ INSERT INTO Doctor (doctorSpecialtyId, userEmail) VALUES (${doctorSpecialtyId}, ${email})`,
//                         error,
//                     });

//                     throw SignupErrors.ERROR_CREATING_DOCTOR;
//                 });
//         }

//         session.set('userEmail', createdUser.email);

//         const url = `/office?password=${bcryptjs.hashSync(
//             createdUser.password,
//             10
//         )}`;

//         return redirect(url, {
//             headers: { 'Set-Cookie': await commitSession(session) },
//         });
//     } catch (error) {
//         switch (error) {
//             case SignupErrors.EMAIL_ALREADY_REGISTERED: {
//                 return json({ error: SignupErrors.EMAIL_ALREADY_REGISTERED });
//             }
//             case SignupErrors.ERROR_CREATING_USER: {
//                 return json({ error: SignupErrors.ERROR_CREATING_USER });
//             }
//             case SignupErrors.ERROR_CREATING_DOCTOR: {
//                 return json({ error: SignupErrors.ERROR_CREATING_DOCTOR });
//             }
//             case GenericErrors.PRISMA_ERROR: {
//                 return json({ error: GenericErrors.PRISMA_ERROR });
//             }
//             default: {
//                 logError({
//                     filePath: '/signup.tsx',
//                     message: 'loader error',
//                     error,
//                 });

//                 return json({ error: GenericErrors.UNKNOWN_ERROR });
//             }
//         }
//     }
// }

// const zodSchema = z
//     .object({
//         firstName: z.string().min(1, { message: 'Insira o seu nome' }),
//         lastName: z.string().min(1, { message: 'Insira o seu nome' }),
//         email: z
//             .string()
//             .min(1, { message: 'Email é obrigatório' })
//             .email('Email inválido'),
//         password: z.string().min(9, { message: 'Mínimo de 9 caracteres' }),
//         repeatPassword: z
//             .string()
//             .min(9, { message: 'Mínimo de 9 caracteres' }),
//         isDoctor: z.boolean().default(false),
//         doctorSpecialtyId: z.string().default(''),
//     })
//     .refine(({ password, repeatPassword }) => password === repeatPassword, {
//         path: ['repeatPassword'],
//         message: 'As passwords têm de ser iguais',
//     })
//     .refine(
//         ({ isDoctor, doctorSpecialtyId }) =>
//             !isDoctor || (isDoctor && doctorSpecialtyId.length > 0),
//         {
//             message: 'Tem de escolher uma especialidade',
//             path: ['doctorSpecialtyId'],
//         }
//     );

// const validator = withZod(zodSchema);

// export default function Signup() {
//     const { dropdownEntries, email } = useLoaderData();
//     const actionData = useActionData();
//     const transition = useTransition();

//     const submitting =
//         transition.state === 'submitting' &&
//         transition.submission.formData.get('signupActions') === 'signup';

//     const [isDoctor, setIsDoctor] = useState('false');
//     console.log('🚀 ~ file: signup.tsx ~ line 211 ~ isDoctor', isDoctor);

//     const form = useForm({
//         initialValues: {
//             firstName: '',
//             lastName: '',
//             email: email || '',
//             password: '',
//             repeatPassword: '',
//             doctorSpecialtyId: '',
//         },
//         validate: zodResolver(zodSchema),
//     });
//     console.log('🚀 ~ file: signup.tsx ~ line 230 ~ form', form)

//     return (
//         <div className="container">
//             <div className="formContainer">
//                 <h1>MEDICI</h1>
//                 <h3>Registo</h3>
//                 <ValidatedForm
//                     validator={validator}
//                     method="post"
//                     className="form"
//                 >
//                     <TextInput
//                         name="firstName"
//                         label="Primeiro nome"
//                         type="text"
//                         sx={(theme) => ({
//                             marginBottom: theme.spacing.md,
//                         })}
//                     />
//                     <TextInput
//                         name="lastName"
//                         label="Apelido"
//                         type="text"
//                         sx={(theme) => ({
//                             marginBottom: theme.spacing.md,
//                         })}
//                     />
//                     <TextInputWithPopover
//                         name="email"
//                         label="Email"
//                         placeholder={
//                             form.errors.email ? '' : 'joanasilva@email.com'
//                         }
//                         type="text"
//                         opened={
//                             actionData?.error ===
//                             SignupErrors.EMAIL_ALREADY_REGISTERED
//                         }
//                         redirectTo={`/login?email=${form.values.email}`}
//                         popOverText={[
//                             'Este email já está registado.',
//                             'Clique aqui para entrar!',
//                         ]}
//                     />
//                     <TextInput
//                         name="password"
//                         label="Password"
//                         type="password"
//                         sx={(theme) => ({
//                             marginBottom: theme.spacing.md,
//                         })}
//                     />
//                     <TextInput
//                         name="repeatPassword"
//                         label="Repetir password"
//                         type="password"
//                         sx={(theme) => ({
//                             marginBottom: theme.spacing.md,
//                         })}
//                     />
//                     <Checkbox
//                         value={isDoctor}
//                         label="Sou prestador de cuidados médicos"
//                         checked={isDoctor === 'true'}
//                         onChange={() =>
//                             setIsDoctor(isDoctor === 'false' ? 'true' : 'false')
//                         }
//                     />
//                     {isDoctor === 'true' ? (
//                         <div>
//                             <br />
//                             <Select
//                                 label="Especialidade"
//                                 data={dropdownEntries}
//                             />
//                         </div>
//                     ) : null}
//                     <Button
//                         type="submit"
//                         name="signupActions"
//                         value="signup"
//                         loading={submitting}
//                         radius="md"
//                         size="md"
//                         style={classes.sendButton}
//                     >
//                         Enviar
//                     </Button>
//                     <Space h="xs" />
//                     <Link to="/login">Já estou registado</Link>
//                 </ValidatedForm>
//             </div>
//         </div>
//     );
// }
