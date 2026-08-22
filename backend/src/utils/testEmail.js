require("dotenv").config();

const {
    sendEmail
} = require("../services/emailService");

const test = async () => {

    const result = await sendEmail({
        to: process.env.EMAIL_USER,

        subject: "Healthcare Appointment Manager Test",

        text: "This is a test email from the Healthcare Appointment Manager."
    });

    console.log(result);
};

test();