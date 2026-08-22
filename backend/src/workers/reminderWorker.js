const prisma = require("../utils/prisma");

const processMedicationReminders = async () => {

    try {

        const now = new Date();

        const reminders =
            await prisma.medicationReminder.findMany({

                where: {
                    status: "PENDING",

                    reminderTime: {
                        lte: now
                    }
                },

                include: {
                    prescription: true,

                    patient: {
                        include: {
                            user: true
                        }
                    }
                },

                take: 20
            });


        if (reminders.length === 0) {
            return;
        }


        console.log(
            `Found ${reminders.length} medication reminder(s)`
        );


        for (const reminder of reminders) {

            try {

                // ------------------------------------------
                // Claim reminder
                // ------------------------------------------

                const claimed =
                    await prisma.medicationReminder.updateMany({

                        where: {
                            id: reminder.id,

                            status: "PENDING"
                        },

                        data: {
                            status: "PROCESSING"
                        }
                    });


                // Another worker may have already
                // processed this reminder.
                if (claimed.count === 0) {

                    console.log(
                        `Reminder ${reminder.id} already being processed`
                    );

                    continue;
                }


                const prescription =
                    reminder.prescription;

                const patient =
                    reminder.patient;


                const email =
                    patient.user.email;


                const subject =
                    `Medication Reminder: ${prescription.medicineName}`;


                const text = `
Hello ${patient.user.name},

This is a reminder to take your prescribed medication.

Medicine: ${prescription.medicineName}
Dosage: ${prescription.dosage}
Frequency: ${prescription.frequency}
Duration: ${prescription.duration}

Please follow the instructions provided by your doctor.

This is an automated medication reminder.
`;


                // ------------------------------------------
                // Create email job
                // ------------------------------------------

                const emailJob =
                    await prisma.emailJob.create({

                        data: {

                            recipient:
                                email,

                            subject,

                            text,

                            html: null,

                            attempts: 0,

                            maxAttempts: 3,

                            status: "PENDING",

                            nextAttemptAt:
                                new Date(),

                            reminderId:
                                reminder.id
                        }
                    });


                console.log(
                    `Medication reminder ${reminder.id} created email job ${emailJob.id}`
                );


                // IMPORTANT:
                //
                // We do NOT mark the reminder as SENT here.
                //
                // emailWorker will mark it SENT
                // after the email is actually sent.


            } catch (error) {

                console.error(
                    `Failed processing reminder ${reminder.id}:`,
                    error.message
                );


                await prisma.medicationReminder.update({

                    where: {
                        id: reminder.id
                    },

                    data: {
                        status: "FAILED"
                    }
                });
            }
        }


    } catch (error) {

        console.error(
            "Medication reminder worker error:",
            error
        );
    }
};


// ==================================================
// RUN EVERY 30 SECONDS
// ==================================================

setInterval(
    processMedicationReminders,
    30 * 1000
);


console.log(
    "Medication reminder worker started"
);


// Run once immediately
processMedicationReminders();