const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

const createAdmin = async () => {
    try {
        const email = "admin@healthcare.com";
        const password = "Admin@123";

        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log("Admin already exists.");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const admin = await prisma.user.create({
            data: {
                name: "System Admin",
                email,
                passwordHash,
                role: "ADMIN"
            }
        });

        console.log("Admin created successfully.");
        console.log("Email:", admin.email);
        console.log("Password:", password);
    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();