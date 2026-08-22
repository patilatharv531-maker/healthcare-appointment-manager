const prisma = require("../utils/prisma");
const { sendEmail } = require("../services/emailService");

// ======================================================
// PROCESS EMAIL JOBS
// ======================================================

const processEmailJobs = async () => {

    const jobs = await prisma.emailJob.findMany({
        where: {
            status: "PENDING",
            nextAttemptAt: {
                lte: new Date()
            }
        },
        orderBy: {
            createdAt: "asc"
        },
        take: 10
    });

    for (const job of jobs) {

        console.log(
            `Processing email job ${job.id}`
        );

        const result = await sendEmail({
            to: job.recipient,
            subject: job.subject,
            text: job.text,
            html: job.html
        });

        // ==================================================
        // EMAIL SENT SUCCESSFULLY
        // ==================================================

        if (result.success) {

            await prisma.emailJob.update({
                where: {
                    id: job.id
                },
                data: {
                    status: "SENT",
                    attempts: {
                        increment: 1
                    },
                    lastError: null
                }
            });

            // ----------------------------------------------
            // If this email belongs to a medication reminder,
            // mark that reminder as SENT.
            // ----------------------------------------------

            if (job.reminderId) {

                await prisma.medicationReminder.update({
                    where: {
                        id: job.reminderId
                    },
                    data: {
                        status: "SENT"
                    }
                });

                console.log(
                    `Medication reminder ${job.reminderId} marked as SENT`
                );
            }

            console.log(
                `Email job ${job.id} completed`
            );

        }

        // ==================================================
        // EMAIL FAILED
        // ==================================================

        else {

            const nextAttempts =
                job.attempts + 1;

            // ----------------------------------------------
            // Maximum attempts reached
            // ----------------------------------------------

            if (nextAttempts >= job.maxAttempts) {

                await prisma.emailJob.update({
                    where: {
                        id: job.id
                    },
                    data: {
                        status: "FAILED",
                        attempts: nextAttempts,
                        lastError: result.error
                    }
                });

                // ------------------------------------------
                // If this email belongs to a medication
                // reminder, mark reminder as FAILED.
                // ------------------------------------------

                if (job.reminderId) {

                    await prisma.medicationReminder.update({
                        where: {
                            id: job.reminderId
                        },
                        data: {
                            status: "FAILED"
                        }
                    });

                    console.log(
                        `Medication reminder ${job.reminderId} marked as FAILED`
                    );
                }

                console.error(
                    `Email job ${job.id} permanently failed`
                );

            }

            // ----------------------------------------------
            // Retry later
            // ----------------------------------------------

            else {

                // Exponential backoff:
                //
                // Attempt 1 → 1 minute
                // Attempt 2 → 2 minutes
                // Attempt 3 → stop

                const delayMinutes =
                    Math.pow(2, nextAttempts - 1);

                const nextAttemptAt = new Date(
                    Date.now() +
                    delayMinutes * 60 * 1000
                );

                await prisma.emailJob.update({
                    where: {
                        id: job.id
                    },
                    data: {
                        attempts: nextAttempts,
                        nextAttemptAt,
                        lastError: result.error
                    }
                });

                console.log(
                    `Email job ${job.id} scheduled for retry`
                );
            }
        }
    }
};


// ======================================================
// RUN EVERY 30 SECONDS
// ======================================================

const startEmailWorker = () => {

    console.log(
        "Email background worker started"
    );

    processEmailJobs();

    setInterval(
        processEmailJobs,
        30 * 1000
    );
};


module.exports = {
    processEmailJobs,
    startEmailWorker
};