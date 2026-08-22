const prisma = require("../utils/prisma");

const {
    sendDoctorLeaveNotification
} = require("../services/notificationService");

const {
    deleteCalendarEvent
} = require("../services/googleCalendarService");
// ======================================================
// MARK DOCTOR ON LEAVE
// ======================================================

const createDoctorLeave = async (req, res) => {
    try {
        const { doctorId, leaveDate, reason } = req.body;

        if (!doctorId || !leaveDate) {
            return res.status(400).json({
                message: "Doctor ID and leave date are required"
            });
        }

        const selectedDate = new Date(`${leaveDate}T00:00:00`);

        if (Number.isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid leave date"
            });
        }

        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Check doctor exists
        const doctor = await prisma.doctor.findUnique({
    where: {
        id: doctorId
    },
    include: {
        user: {
            select: {
                name: true,
                email: true
            }
        }
    }
});

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // Check whether leave already exists
        const existingLeave = await prisma.doctorLeave.findFirst({
            where: {
                doctorId,
                leaveDate: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        if (existingLeave) {
            return res.status(409).json({
                message: "Doctor is already marked on leave for this date"
            });
        }

        // Use transaction so leave + affected appointment
        // updates happen together.
        const result = await prisma.$transaction(async (tx) => {

            // Create leave record
            const leave = await tx.doctorLeave.create({
                data: {
                    doctorId,
                    leaveDate: dayStart,
                    reason: reason || null
                }
            });

            // Find affected appointments
            const affectedAppointments =
    await tx.appointment.findMany({
        where: {
            doctorId,
            startTime: {
                gte: dayStart,
                lte: dayEnd
            },
            status: "CONFIRMED"
        },
        include: {
            patient: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },

            calendarEvents: true
        }
    });

            // Cancel affected appointments
            if (affectedAppointments.length > 0) {
                await tx.appointment.updateMany({
                    where: {
                        id: {
                            in: affectedAppointments.map(
                                (appointment) => appointment.id
                            )
                        }
                    },
                    data: {
                        status: "CANCELLED_BY_DOCTOR"
                    }
                });
            }

            return {
                leave,
                affectedAppointments
            };
        });

        // ======================================================
// REMOVE AFFECTED APPOINTMENTS FROM GOOGLE CALENDAR
// ======================================================

for (const appointment of result.affectedAppointments) {

    if (!appointment.calendarEvents ||
        appointment.calendarEvents.length === 0) {
        continue;
    }

    for (const calendarEvent of appointment.calendarEvents) {

        try {

            const calendarAccount =
                await prisma.googleCalendarAccount.findUnique({
                    where: {
                        userId: calendarEvent.userId
                    }
                });

            if (!calendarAccount) {

                console.log(
                    `No Google Calendar account found for user ${calendarEvent.userId}`
                );

                continue;
            }

            const tokens = {
                access_token:
                    calendarAccount.accessToken,

                refresh_token:
                    calendarAccount.refreshToken,

                expiry_date:
                    calendarAccount.expiryDate
                        ? Number(calendarAccount.expiryDate)
                        : undefined
            };

            await deleteCalendarEvent({
                tokens,
                googleEventId:
                    calendarEvent.googleEventId
            });

            console.log(
                `Google Calendar event ${calendarEvent.googleEventId} deleted`
            );

            // Remove our local calendar-event record
            await prisma.calendarEvent.delete({
                where: {
                    id: calendarEvent.id
                }
            });

        } catch (calendarError) {

            console.error(
                `Failed to delete Google Calendar event ${calendarEvent.googleEventId}:`,
                calendarError.message
            );

        }
    }
}


// ======================================================
// SEND EMAILS TO AFFECTED PATIENTS
// ======================================================

for (const appointment of result.affectedAppointments) {

    try {

        await sendDoctorLeaveNotification({
            patientEmail:
                appointment.patient.user.email,

            patientName:
                appointment.patient.user.name,

            doctorName:
                doctor.user.name,

            startTime:
                appointment.startTime.toISOString(),

            reason:
                reason || "Doctor unavailable"
        });

    } catch (emailError) {

        // Email failure must NOT undo
        // the leave operation or appointment cancellation.

        console.error(
            `Leave notification failed for appointment ${appointment.id}:`,
            emailError.message
        );
    }
}

return res.status(201).json({
    message: "Doctor leave created successfully",

    leave: result.leave,

    affectedAppointments:
        result.affectedAppointments.map(
            (appointment) => ({
                appointmentId: appointment.id,

                patientName:
                    appointment.patient.user.name,

                patientEmail:
                    appointment.patient.user.email,

                startTime:
                    appointment.startTime,

                endTime:
                    appointment.endTime
            })
        ),

    notificationRequired:
        result.affectedAppointments.length > 0
});

    } catch (error) {

        console.error(
            "Create doctor leave error:",
            error
        );

        return res.status(500).json({
            message: "Unable to mark doctor on leave"
        });
    }
};


// ======================================================
// GET DOCTOR LEAVES
// ======================================================

const getDoctorLeaves = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const leaves = await prisma.doctorLeave.findMany({
            where: {
                doctorId
            },
            orderBy: {
                leaveDate: "desc"
            }
        });

        return res.status(200).json({
            leaves
        });

    } catch (error) {

        console.error(
            "Get doctor leaves error:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch doctor leaves"
        });
    }
};


module.exports = {
    createDoctorLeave,
    getDoctorLeaves
};