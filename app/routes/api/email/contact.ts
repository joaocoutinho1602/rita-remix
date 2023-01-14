import type { ActionFunction } from '@remix-run/node';
import { getTransporter } from '~/utils/server/email';

export const action: ActionFunction = async ({ request }) => {
    const body: {
        name: string;
        email: string;
        phone: number;
        description: string;
    } = await request.json();

    const { name, email, phone, description } = body;

    const to = process.env.MAIL_TO;

    const mailOptions = {
        from: '"MeiraBotCliente" <meirabotcliente@outlook.com>',
        to,
        subject: 'Novo cliente!',
        text: `this is text\nnome - ${name}\nemail - ${email}\ntelefone - ${phone}\nmotivo - ${description}`,
        html: `<p>Nome - ${name}<br>Email - ${email}<br>Telefone - ${phone}<br>Motivo - ${description}</p>`,
    };

    return getTransporter()
        .sendMail(mailOptions)
        .then((response) => {
            return { code: 200, message: 'OK' };
        })
        .catch((error) => {
            console.log(
                `🚀 ~ file: /api/email/contact.ts ~ nodemailer error\n\nname -> ${name}\nemail -> ${email}\nphone -> ${phone}\n\nerror -> `,
                error
            );
            return new Response(error, { status: 500 });
        });
};
