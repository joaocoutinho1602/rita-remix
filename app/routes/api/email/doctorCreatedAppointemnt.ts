import type { ActionFunction } from '@remix-run/node';
import { getPasswordEmail, getURL } from '~/utils/common/environment';
import { getTransporter } from '~/utils/server/email';

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
        subject: 'A sua consulta foi agendada na Medici',
        text: `Olá ${firstName} ${lastName},\n\nobrigada pelo seu registo na Medici.\n\nPara poder começar a usar os nossos serviços, pode entrar na plataforma em ${getURL()}/login. Os seus dados são os seguintes:\n\nEmail: ${email}\nPassword: ${password}\n\nEstamos ao seu dispor para tudo o que precisar de nós\n\nA equipa Medici`,
        html: `<p>Olá ${firstName} ${lastName}, obrigada pelo seu registo na Medici.<br/>Para poder começar a usar os nossos serviços, pode entrar na plataforma em ${getURL()}/login. Os seus dados são os seguintes:<br/>Email: ${email}\nPassword: ${password}<br/>Estamos ao seu dispor para tudo o que precisar de nós<br/>A equipa Medici</p>`,
    };

    return getTransporter()
        .sendMail(mailOptions)
        .then((response) => {
            return { code: 200, message: 'OK' };
        })
        .catch((error) => {
            console.log(
                `🚀 ~ file: /api/email/doctorCreatedAppointment.ts ~ nodemailer error\n\nemail -> ${email}\npassword -> ${password}\nfirstName -> ${firstName}\nlastName -> ${lastName}\n\nerror -> `,
                error
            );
            return new Response(error, { status: 500 });
        });
};
