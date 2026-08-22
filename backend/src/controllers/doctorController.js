const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");

const createDoctor = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            specialization,
            workingStart,
            workingEnd,
            slotDuration
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !specialization ||
            !workingStart ||
            !workingEnd
        ) {
            return res.status(400).json({
                message: "All required doctor details must be provided"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Doctor password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const doctorUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: "DOCTOR",
                doctor: {
                    create: {
                        specialization: specialization.trim(),
                        workingStart,
                        workingEnd,
                        slotDuration: slotDuration || 30
                    }
                }
            },
            include: {
                doctor: true
            }
        });

        return res.status(201).json({
            message: "Doctor created successfully",
            doctor: {
                id: doctorUser.doctor.id,
                userId: doctorUser.id,
                name: doctorUser.name,
                email: doctorUser.email,
                specialization: doctorUser.doctor.specialization,
                workingStart: doctorUser.doctor.workingStart,
                workingEnd: doctorUser.doctor.workingEnd,
                slotDuration: doctorUser.doctor.slotDuration
            }
        });
    } catch (error) {
        console.error("Create doctor error:", error);

        return res.status(500).json({
            message: "Unable to create doctor"
        });
    }
};

const getDoctors = async (req, res) => {
    try {
        const doctors = await prisma.doctor.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            doctors
        });
    } catch (error) {
        console.error("Get doctors error:", error);

        return res.status(500).json({
            message: "Unable to fetch doctors"
        });
    }
};

const updateDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const {
            name,
            specialization,
            workingStart,
            workingEnd,
            slotDuration
        } = req.body;

        if (!doctorId) {
            return res.status(400).json({
                message: "Doctor ID is required"
            });
        }

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            },
            include: {
                user: true
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // ----------------------------------------------
        // Update Doctor + User
        // ----------------------------------------------

        const updatedDoctor =
            await prisma.doctor.update({
                where: {
                    id: doctorId
                },
                data: {
                    specialization:
                        specialization !== undefined
                            ? specialization.trim()
                            : undefined,

                    workingStart:
                        workingStart !== undefined
                            ? workingStart
                            : undefined,

                    workingEnd:
                        workingEnd !== undefined
                            ? workingEnd
                            : undefined,

                    slotDuration:
                        slotDuration !== undefined
                            ? Number(slotDuration)
                            : undefined,

                    user: {
                        update: {
                            name:
                                name !== undefined
                                    ? name.trim()
                                    : undefined
                        }
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });

        return res.status(200).json({
            message: "Doctor updated successfully",
            doctor: updatedDoctor
        });

    } catch (error) {

        console.error(
            "Update doctor error:",
            error
        );

        return res.status(500).json({
            message: "Unable to update doctor"
        });
    }
};

module.exports = {
    createDoctor,
    getDoctors,
    updateDoctor
};