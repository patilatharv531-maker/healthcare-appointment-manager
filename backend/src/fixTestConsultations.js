require("dotenv").config();

const prisma = require("./utils/prisma");

const fixTestConsultations = async () => {
    try {

        // ==========================================
        // HEADACHE APPOINTMENT
        // ==========================================

        await prisma.appointment.update({
            where: {
                id: "cmt1ilbb10002twk4dafj9itb"
            },
            data: {
                consultationNotes:
                    "Patient reports a mild headache. Advised adequate hydration, rest, and monitoring of symptoms."
            }
        });


        // ==========================================
        // CHEST DISCOMFORT APPOINTMENT
        // ==========================================

        await prisma.appointment.update({
            where: {
                id: "cmt1ghrra0001twn484z9qi13"
            },
            data: {
                consultationNotes:
                    "Patient reports mild chest discomfort and occasional dizziness. Advised rest, hydration, and monitoring of symptoms."
            }
        });


        console.log(
            "======================================"
        );

        console.log(
            "Test consultation data corrected successfully."
        );

        console.log(
            "======================================"
        );

    } catch (error) {

        console.error(
            "Failed to fix consultation data:"
        );

        console.error(error);

    } finally {

        await prisma.$disconnect();

    }
};

fixTestConsultations();