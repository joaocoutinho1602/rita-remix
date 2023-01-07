import type { ActionFunction } from '@remix-run/node';

import nodemailer from 'nodemailer';

export const action: ActionFunction = async ({ request }) => {
    const body: {
        name: string;
        email: string;
        phone: number;
        description: string;
    } = await request.json();

    const { name, email, phone, description } = body;

    const host = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT;
    const user = process.env.MAIL_AUTH_USER;
    const pass = process.env.MAIL_AUTH_PASS;
    const to = process.env.MAIL_TO;

    const transporter = nodemailer.createTransport({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        host,
        port,
        secure: false,
        auth: {
            user,
            pass,
        },
    });

    const mailOptions = {
        from: '"MeiraBotCliente" <meirabotcliente@outlook.com>',
        to,
        subject: 'Novo cliente!',
        text: `this is text\nnome - ${name}\nemail - ${email}\ntelefone - ${phone}\nmotivo - ${description}`,
        html: `<p>Nome - ${name}<br>Email - ${email}<br>Telefone - ${phone}<br>Motivo - ${description}</p>`,
    };

    return transporter
        .sendMail(mailOptions)
        .then((response) => {
            return { code: 200, message: 'OK' };
        })
        .catch((error) => {
            console.log(
                `🚀 ~ file: /api/email.ts ~ nodemailer error\n\nname -> ${name}\nemail -> ${email}\nphone -> ${phone}\n\nerror -> `,
                error
            );
            return new Response(error, { status: 500 });
        });
};