const prisma = require("../utils/prisma");
const { sendEmail } = require("./emailService");

// ======================================================
// CREATE EMAIL JOB
// ======================================================

const createEmailJob = async ({
    to,
    subject,
    text,
    html
}) => {

    const job = await prisma.emailJob.create({
        data: {
            recipient: to,
            subject,
            text: text || null,
            html: html || null,
            status: "PENDING",
            attempts: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date()
        }
    });

    return job;
};


// ======================================================
// SEND EMAIL OR QUEUE FOR RETRY
// ======================================================

const sendEmailWithRetry = async ({
    to,
    subject,
    text,
    html
}) => {

    const result = await sendEmail({
        to,
        subject,
        text,
        html
    });

    if (result.success) {
        return {
            success: true,
            queued: false
        };
    }

    console.log(
        "Email failed. Creating retry job."
    );

    const job = await createEmailJob({
        to,
        subject,
        text,
        html
    });

    return {
        success: false,
        queued: true,
        jobId: job.id
    };
};


module.exports = {
    createEmailJob,
    sendEmailWithRetry
};