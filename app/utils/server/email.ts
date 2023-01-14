import nodemailer from 'nodemailer';

export const getTransporter = () => {
    const host = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT;
    const user = process.env.MAIL_AUTH_USER;
    const pass = process.env.MAIL_AUTH_PASS;

    return nodemailer.createTransport({
        /**
         * For some reason nodemailer says property host doesn't exist, but it obviously can't send an email without one
         */
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
}