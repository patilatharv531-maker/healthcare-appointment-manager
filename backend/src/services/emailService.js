const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async ({
    to,
    subject,
    text,
    html
}) => {

    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD
    ) {
        return {
            success: false,
            error: "Email credentials are not configured"
        };
    }

    try {

        const info = await transporter.sendMail({
            from:
                process.env.EMAIL_FROM ||
                process.env.EMAIL_USER,

            to,
            subject,
            text,
            html
        });

        console.log(
            `Email sent successfully: ${info.messageId}`
        );

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {

        console.error(
            "Email sending failed:",
            error.message
        );

        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendEmail
};