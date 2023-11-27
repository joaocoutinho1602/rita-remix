import type { ActionFunction } from '@remix-run/node';

import {
    GenericErrors,
    logError,
    getPasswordEmail,
    getURL,
} from '~/utils/common';
import { customError, getTransporter } from '~/utils/server';

export const action: ActionFunction = async ({ request }) => {
    const body: {
        email: string;
        password: string;
        firstName: number;
        lastName: string;
    } = await request.json();

    const { email, password, firstName, lastName } = body;

    const actualEmail = getPasswordEmail(email);

    const mailOptions = {
        from: '"MeiraBotCliente" <meirabotcliente@outlook.com>',
        to: actualEmail,
        subject: 'Obrigada pelo seu registo na Medici',
        text: `Olá ${firstName} ${lastName}, obrigada pelo seu registo na Medici.\n\nPara poder começar a usar os nossos serviços, pode entrar na plataforma em ${getURL()}/login. Os seus dados são os seguintes:\n\nEmail: ${email}\nPassword: ${password}\n\nEstamos ao seu dispor para tudo o que precisar de nós\n\nA equipa Medici`,
        html: `<p>Olá ${firstName} ${lastName}, obrigada pelo seu registo na Medici.</p><p>Para poder começar a usar os nossos serviços, pode entrar na plataforma em ${getURL()}/login. Os seus dados são os seguintes:</p><p>Email: ${email}\nPassword: ${password}</p><p>Estamos ao seu dispor para tudo o que precisar de nós</p><p>A equipa Medici</p>`,
    };

    return getTransporter()
        .sendMail(mailOptions)
        .then(() => {
            return 'OK';
        })
        .catch((error) => {
            logError({
                filePath: '/api/email/password',
                message: `nodemailer error\n\nemail -> ${email}\npassword -> ${password}\nfirstName -> ${firstName}\nlastName -> ${lastName}`,
                error,
            });
            return customError(GenericErrors.NODEMAILER_ERROR);
        });
};
