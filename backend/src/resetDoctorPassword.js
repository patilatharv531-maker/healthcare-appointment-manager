require("dotenv").config();

const bcrypt = require("bcryptjs");
const prisma = require("./utils/prisma");

const resetPassword = async () => {
    try {

        const patient = await prisma.user.findFirst({
            where: {
                role: "PATIENT"
            }
        });

        if (!patient) {
            console.log("No patient user found.");
            return;
        }

        const newPassword = "Patient@123";

        const hashedPassword =
            await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: {
                id: patient.id
            },
            data: {
                passwordHash: hashedPassword
            }
        });

        console.log("================================");
        console.log("Patient password reset successfully");
        console.log("Email:", patient.email);
        console.log("Password:", newPassword);
        console.log("================================");

    } catch (error) {

        console.error("Password reset failed:");
        console.error(error);

    } finally {

        await prisma.$disconnect();

    }
};

resetPassword();