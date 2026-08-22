const prisma = require("../utils/prisma");
const {
    sendBookingConfirmation,
    sendDoctorBookingNotification
} = require("../services/notificationService");

const {
    generatePreVisitSummary,
    generatePostVisitSummary
} = require("../services/llmService");

const {
    createMedicationReminders
} = require("../services/reminderService");

const {
    createCalendarEvent,
    deleteCalendarEvent,
    updateCalendarEvent
} = require("../services/googleCalendarService");

// ======================================================
// 1. GET AVAILABLE SLOTS
// ======================================================

const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        // Find doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // Selected date
        const selectedDate = new Date(`${date}T00:00:00`);

        if (Number.isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date"
            });
        }

        // Start and end of selected day
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        // ==================================================
        // CHECK DOCTOR LEAVE
        // ==================================================

        const doctorLeave = await prisma.doctorLeave.findFirst({
            where: {
                doctorId,
                leaveDate: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        if (doctorLeave) {
            return res.status(200).json({
                date,
                doctorId,
                available: false,
                message: "Doctor is on leave",
                slots: []
            });
        }

        // ==================================================
        // GET EXISTING APPOINTMENTS
        // ==================================================

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                startTime: {
                    gte: dayStart,
                    lte: dayEnd
                },
                status: {
                    in: [
                        "CONFIRMED",
                        "COMPLETED",
                        "RESCHEDULED"
                    ]
                }
            },
            select: {
                startTime: true,
                endTime: true
            }
        });

        // ==================================================
        // GET ACTIVE SLOT HOLDS
        // ==================================================

        const slotHolds = await prisma.slotHold.findMany({
            where: {
                doctorId,
                startTime: {
                    gte: dayStart,
                    lte: dayEnd
                },
                expiresAt: {
                    gt: new Date()
                }
            },
            select: {
                startTime: true,
                endTime: true
            }
        });

        // ==================================================
        // GENERATE SLOTS
        // ==================================================

        const slots = [];

        const [startHour, startMinute] =
            doctor.workingStart.split(":").map(Number);

        const [endHour, endMinute] =
            doctor.workingEnd.split(":").map(Number);

        const currentSlot = new Date(selectedDate);

        currentSlot.setHours(
            startHour,
            startMinute,
            0,
            0
        );

        const workingEnd = new Date(selectedDate);

        workingEnd.setHours(
            endHour,
            endMinute,
            0,
            0
        );

        while (currentSlot < workingEnd) {

            const slotStart = new Date(currentSlot);

            const slotEnd = new Date(currentSlot);

            slotEnd.setMinutes(
                slotEnd.getMinutes() + doctor.slotDuration
            );

            // Don't create a slot outside working hours
            if (slotEnd > workingEnd) {
                break;
            }

            // Check whether appointment already exists
            const appointmentConflict = appointments.some(
                (appointment) =>
                    new Date(appointment.startTime).getTime() ===
                    slotStart.getTime()
            );

            // Check whether another patient currently holds it
            const holdConflict = slotHolds.some(
                (hold) =>
                    new Date(hold.startTime).getTime() ===
                    slotStart.getTime()
            );

            slots.push({
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
                available:
                    !appointmentConflict &&
                    !holdConflict
            });

            // Move to next slot
            currentSlot.setMinutes(
                currentSlot.getMinutes() +
                doctor.slotDuration
            );
        }

        console.log("========== SLOT DEBUG ==========");
console.log("Doctor ID:", doctorId);
console.log("Date:", date);
console.log("Working Start:", doctor.workingStart);
console.log("Working End:", doctor.workingEnd);
console.log("Slot Duration:", doctor.slotDuration);
console.log("Generated Slots:", slots);
console.log("================================");

        return res.status(200).json({
            date,
            doctorId,
            available: true,
            slots
        });

    } catch (error) {

        console.error(
            "Get available slots error:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch available slots"
        });
    }
};


// ======================================================
// 2. HOLD A SLOT
// ======================================================

const holdSlot = async (req, res) => {
    try {

        const {
            doctorId,
            startTime,
            endTime
        } = req.body;

        // Validate request
        if (!doctorId || !startTime || !endTime) {
            return res.status(400).json({
                message:
                    "Doctor, start time and end time are required"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date/time"
            });
        }

        if (start >= end) {
            return res.status(400).json({
                message: "Invalid appointment time"
            });
        }

        // ==================================================
        // CHECK DOCTOR
        // ==================================================

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found"
            });
        }

        // ==================================================
        // CHECK DOCTOR LEAVE
        // ==================================================

        const dayStart = new Date(start);

        dayStart.setHours(
            0,
            0,
            0,
            0
        );

        const dayEnd = new Date(start);

        dayEnd.setHours(
            23,
            59,
            59,
            999
        );

        const leave = await prisma.doctorLeave.findFirst({
            where: {
                doctorId,
                leaveDate: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        if (leave) {
            return res.status(409).json({
                message:
                    "Doctor is on leave on this date"
            });
        }

        // ==================================================
        // REMOVE EXPIRED HOLDS
        // ==================================================

        await prisma.slotHold.deleteMany({
            where: {
                expiresAt: {
                    lte: new Date()
                }
            }
        });

        // ==================================================
        // CHECK EXISTING APPOINTMENT
        // ==================================================

        const existingAppointment =
            await prisma.appointment.findFirst({
                where: {
                    doctorId,
                    startTime: start,
                    status: {
                        in: [
                            "CONFIRMED",
                            "COMPLETED",
                            "RESCHEDULED"
                        ]
                    }
                }
            });

        if (existingAppointment) {
            return res.status(409).json({
                message:
                    "This slot has already been booked"
            });
        }

        // ==================================================
        // FIND PATIENT PROFILE
        // ==================================================

        // JWT contains USER ID.
        // SlotHold requires PATIENT ID.
        //
        // So we find the Patient record belonging
        // to the currently logged-in user.

        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message:
                    "Patient profile not found"
            });
        }

        // ==================================================
        // CREATE 5-MINUTE SLOT HOLD
        // ==================================================

        try {

            const expiresAt = new Date(
                Date.now() +
                5 * 60 * 1000
            );

            const hold = await prisma.slotHold.create({
                data: {
                    doctorId,
                    patientId: patient.id,
                    startTime: start,
                    endTime: end,
                    expiresAt
                }
            });

            return res.status(201).json({
                message:
                    "Slot held successfully for 5 minutes",

                hold: {
                    id: hold.id,
                    doctorId: hold.doctorId,
                    patientId: hold.patientId,
                    startTime: hold.startTime,
                    endTime: hold.endTime,
                    expiresAt: hold.expiresAt
                }
            });

        } catch (error) {

            // Prisma P2002 means our unique constraint
            // prevented another patient from holding
            // the same doctor's slot.

            if (error.code === "P2002") {
                return res.status(409).json({
                    message:
                        "This slot is currently being held by another patient"
                });
            }

            throw error;
        }

    } catch (error) {

        console.error(
            "Hold slot error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to hold slot"
        });
    }
};

// ======================================================
// 3. CONFIRM APPOINTMENT
// ======================================================

const confirmAppointment = async (req, res) => {    
    try {
        const { holdId, symptoms } = req.body;

        if (!holdId) {
            return res.status(400).json({
                message: "Hold ID is required"
            });
        }

        // Find patient belonging to logged-in user
        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        const appointment = await prisma.$transaction(async (tx) => {

            // Find the hold
            const hold = await tx.slotHold.findUnique({
                where: {
                    id: holdId
                }
            });

            if (!hold) {
                throw new Error("HOLD_NOT_FOUND");
            }

            // Make sure this hold belongs to this patient
            if (hold.patientId !== patient.id) {
                throw new Error("HOLD_NOT_OWNED");
            }

            // Check whether hold expired
            if (new Date() > hold.expiresAt) {
                await tx.slotHold.delete({
                    where: {
                        id: hold.id
                    }
                });

                throw new Error("HOLD_EXPIRED");
            }

            // Check doctor leave again
            // This is important because the doctor could
            // have been marked on leave after the hold.
            const dayStart = new Date(hold.startTime);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(hold.startTime);
            dayEnd.setHours(23, 59, 59, 999);

            const leave = await tx.doctorLeave.findFirst({
                where: {
                    doctorId: hold.doctorId,
                    leaveDate: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            if (leave) {
                await tx.slotHold.delete({
                    where: {
                        id: hold.id
                    }
                });

                throw new Error("DOCTOR_ON_LEAVE");
            }

            // Check if another appointment already exists
            const existingAppointment =
                await tx.appointment.findFirst({
                    where: {
                        doctorId: hold.doctorId,
                        startTime: hold.startTime,
                        status: {
                            in: [
                                "CONFIRMED",
                                "COMPLETED",
                                "RESCHEDULED"
                            ]
                        }
                    }
                });

            if (existingAppointment) {
                throw new Error("SLOT_ALREADY_BOOKED");
            }

            // Create appointment
            const newAppointment =
                await tx.appointment.create({
                    data: {
                        doctorId: hold.doctorId,
                        patientId: hold.patientId,
                        startTime: hold.startTime,
                        endTime: hold.endTime,
                        status: "CONFIRMED",
                        symptoms: symptoms || null,
                        aiStatus: "PENDING"
                    }
                });

            // Delete the hold after successful booking
            await tx.slotHold.delete({
                where: {
                    id: hold.id
                }
            });

            return newAppointment;
        });

        // ======================================================
// GENERATE PRE-VISIT AI SUMMARY
// ======================================================

try {
    console.log("STARTING AI SUMMARY FOR:", appointment.id);
    const aiResult =
        await generatePreVisitSummary(
            appointment.symptoms
        );
        console.log("AI RESULT:", aiResult);

    if (aiResult.success) {

        await prisma.appointment.update({
            where: {
                id: appointment.id
            },
            data: {
                aiSummary: aiResult.summary,
                aiStatus: "COMPLETED"
            }
        });

        appointment.aiSummary =
            aiResult.summary;

        appointment.aiStatus =
            "COMPLETED";

    } else {

        await prisma.appointment.update({
            where: {
                id: appointment.id
            },
            data: {
                aiStatus: "FAILED"
            }
        });

        appointment.aiStatus =
            "FAILED";

        console.warn(
            "AI summary unavailable:",
            aiResult.error
        );
    }

} catch (aiError) {

    console.error(
        "Unexpected AI error:",
        aiError.message
    );

    await prisma.appointment.update({
        where: {
            id: appointment.id
        },
        data: {
            aiStatus: "FAILED"
        }
    });

    appointment.aiStatus =
        "FAILED";
}

// ======================================================
// CREATE GOOGLE CALENDAR EVENTS
// ======================================================

try {

    const appointmentDetails =
        await prisma.appointment.findUnique({
            where: {
                id: appointment.id
            },
            include: {
                doctor: {
                    include: {
                        user: true
                    }
                },
                patient: {
                    include: {
                        user: true
                    }
                }
            }
        });

    if (appointmentDetails) {

        const patientUserId =
            appointmentDetails.patient.user.id;

        const doctorUserId =
            appointmentDetails.doctor.user.id;

        // ----------------------------------------------
        // Get Google Calendar accounts
        // ----------------------------------------------

        const googleAccounts =
            await prisma.googleCalendarAccount.findMany({
                where: {
                    userId: {
                        in: [
                            patientUserId,
                            doctorUserId
                        ]
                    }
                }
            });

        const patientGoogleAccount =
            googleAccounts.find(
                account =>
                    account.userId === patientUserId
            );

        const doctorGoogleAccount =
            googleAccounts.find(
                account =>
                    account.userId === doctorUserId
            );


        // ----------------------------------------------
        // Common event information
        // ----------------------------------------------

        const doctorName =
            appointmentDetails.doctor.user.name;

        const patientName =
            appointmentDetails.patient.user.name;

        const startTime =
            appointmentDetails.startTime;

        const endTime =
            appointmentDetails.endTime;


        // ==============================================
        // PATIENT GOOGLE CALENDAR
        // ==============================================

        if (patientGoogleAccount) {

            const patientEvent =
                await createCalendarEvent({

                    tokens: {
                        access_token:
                            patientGoogleAccount.accessToken,

                        refresh_token:
                            patientGoogleAccount.refreshToken,

                        expiry_date:
                            patientGoogleAccount.expiryDate
                                ? Number(
                                    patientGoogleAccount.expiryDate
                                )
                                : undefined
                    },

                    summary:
                        `Doctor Appointment - Dr. ${doctorName}`,

                    description:
                        `Healthcare appointment

Doctor: Dr. ${doctorName}
Patient: ${patientName}

Symptoms:
${appointmentDetails.symptoms || "Not provided"}`,

                    startTime,

                    endTime,

                    attendeeEmail:
                        appointmentDetails.doctor.user.email
                });


            await prisma.calendarEvent.create({
                data: {
                    appointmentId:
                        appointment.id,

                    userId:
                        patientUserId,

                    googleEventId:
                        patientEvent.id
                }
            });

            console.log(
                "Patient Google Calendar event created:",
                patientEvent.id
            );
        }


        // ==============================================
        // DOCTOR GOOGLE CALENDAR
        // ==============================================

        if (doctorGoogleAccount) {

            const doctorEvent =
                await createCalendarEvent({

                    tokens: {
                        access_token:
                            doctorGoogleAccount.accessToken,

                        refresh_token:
                            doctorGoogleAccount.refreshToken,

                        expiry_date:
                            doctorGoogleAccount.expiryDate
                                ? Number(
                                    doctorGoogleAccount.expiryDate
                                )
                                : undefined
                    },

                    summary:
                        `Patient Appointment - ${patientName}`,

                    description:
                        `Healthcare appointment

Patient: ${patientName}
Doctor: Dr. ${doctorName}

Symptoms:
${appointmentDetails.symptoms || "Not provided"}`,

                    startTime,

                    endTime,

                    attendeeEmail:
                        appointmentDetails.patient.user.email
                });


            await prisma.calendarEvent.create({
                data: {
                    appointmentId:
                        appointment.id,

                    userId:
                        doctorUserId,

                    googleEventId:
                        doctorEvent.id
                }
            });

            console.log(
                "Doctor Google Calendar event created:",
                doctorEvent.id
            );
        }
    }

} catch (calendarError) {

    // Calendar failure must NOT cancel
    // an already successful appointment.

    console.error(
        "Google Calendar event creation failed:",
        calendarError.message
    );
}
        // Send booking confirmation email
try {
    const appointmentDetails =
        await prisma.appointment.findUnique({
            where: {
                id: appointment.id
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                patient: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

    if (appointmentDetails) {

        await sendBookingConfirmation({
            patientEmail:
                appointmentDetails.patient.user.email,

            patientName:
                appointmentDetails.patient.user.name,

            doctorName:
                appointmentDetails.doctor.user.name,

            startTime:
                appointmentDetails.startTime.toISOString(),

            endTime:
                appointmentDetails.endTime.toISOString()
        });
        await sendDoctorBookingNotification({
    doctorEmail:
        appointmentDetails.doctor.user.email,

    doctorName:
        appointmentDetails.doctor.user.name,

    patientName:
        appointmentDetails.patient.user.name,

    startTime:
        appointmentDetails.startTime.toISOString(),

    endTime:
        appointmentDetails.endTime.toISOString()
});
    }

} catch (emailError) {

    // Email failure must NOT cancel
    // an already successful appointment.
    console.error(
        "Booking email failed:",
        emailError.message
    );
}

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        });

    } catch (error) {

        if (error.message === "HOLD_NOT_FOUND") {
            return res.status(404).json({
                message: "Slot hold not found or already used"
            });
        }

        if (error.message === "HOLD_NOT_OWNED") {
            return res.status(403).json({
                message: "You cannot confirm another patient's slot"
            });
        }

        if (error.message === "HOLD_EXPIRED") {
            return res.status(409).json({
                message: "Your slot hold has expired"
            });
        }

        if (error.message === "DOCTOR_ON_LEAVE") {
            return res.status(409).json({
                message: "Doctor is on leave on this date"
            });
        }

        if (error.message === "SLOT_ALREADY_BOOKED") {
            return res.status(409).json({
                message: "This slot has already been booked"
            });
        }

        console.error(
            "Confirm appointment error:",
            error
        );

        return res.status(500).json({
            message: "Unable to confirm appointment"
        });
    }
};

// ======================================================
// 4. CANCEL APPOINTMENT
// ======================================================

const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            return res.status(400).json({
                message: "Appointment ID is required"
            });
        }

        // Find patient belonging to logged-in user
        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Make sure patient owns the appointment
        if (appointment.patientId !== patient.id) {
            return res.status(403).json({
                message: "You cannot cancel this appointment"
            });
        }

        if (
            appointment.status === "CANCELLED" ||
            appointment.status === "CANCELLED_BY_DOCTOR"
        ) {
            return res.status(409).json({
                message: "Appointment is already cancelled"
            });
        }

        if (appointment.status === "COMPLETED") {
            return res.status(409).json({
                message: "Completed appointments cannot be cancelled"
            });
        }

        // ----------------------------------------------
        // Cancel appointment
        // ----------------------------------------------

        const cancelledAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: "CANCELLED"
                }
            });

            // ----------------------------------------------
// Delete Google Calendar events
// ----------------------------------------------

try {

    const appointmentDetails =
        await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            },
            include: {
                patient: {
                    include: {
                        user: true
                    }
                },
                doctor: {
                    include: {
                        user: true
                    }
                },
                calendarEvents: true
            }
        });

    if (appointmentDetails) {

        for (const calendarEvent of appointmentDetails.calendarEvents) {

            try {

                const googleAccount =
                    await prisma.googleCalendarAccount.findUnique({
                        where: {
                            userId: calendarEvent.userId
                        }
                    });

                if (!googleAccount) {
                    console.log(
                        `No Google Calendar account found for user ${calendarEvent.userId}`
                    );

                    continue;
                }

                await deleteCalendarEvent({

                    tokens: {
                        access_token:
                            googleAccount.accessToken,

                        refresh_token:
                            googleAccount.refreshToken,

                        expiry_date:
                            googleAccount.expiryDate
                                ? Number(
                                    googleAccount.expiryDate
                                )
                                : undefined
                    },

                    googleEventId:
                        calendarEvent.googleEventId
                });

                console.log(
                    `Google Calendar event deleted: ${calendarEvent.googleEventId}`
                );

                // Remove our DB record
                await prisma.calendarEvent.delete({
                    where: {
                        id: calendarEvent.id
                    }
                });

            } catch (calendarEventError) {

                console.error(
                    `Failed to delete Google Calendar event ${calendarEvent.googleEventId}:`,
                    calendarEventError.message
                );
            }
        }
    }

} catch (calendarError) {

    // Calendar failure should NOT undo cancellation
    console.error(
        "Google Calendar cancellation error:",
        calendarError.message
    );
}

        // ----------------------------------------------
        // Queue cancellation email
        // ----------------------------------------------

        try {

            const appointmentDetails =
                await prisma.appointment.findUnique({
                    where: {
                        id: appointmentId
                    },
                    include: {
                        patient: {
                            include: {
                                user: true
                            }
                        },
                        doctor: {
                            include: {
                                user: true
                            }
                        }
                    }
                });

            if (appointmentDetails) {

                const patientEmail =
                    appointmentDetails.patient.user.email;

                const patientName =
                    appointmentDetails.patient.user.name;

                const doctorName =
                    appointmentDetails.doctor.user.name;

                await prisma.emailJob.create({
                    data: {
                        recipient: patientEmail,

                        subject:
                            "Appointment Cancelled",

                        text: `
Hello ${patientName},

Your healthcare appointment has been cancelled successfully.

Doctor: Dr. ${doctorName}

Appointment time:
Start: ${appointment.startTime.toISOString()}
End: ${appointment.endTime.toISOString()}

If you still need medical assistance, please book another appointment.

Thank you.
`,

                        html: null,

                        attempts: 0,

                        maxAttempts: 3,

                        status: "PENDING",

                        nextAttemptAt: new Date()
                    }
                });

                console.log(
                    `Cancellation email queued for ${patientEmail}`
                );
            }

        } catch (emailError) {

            // Email failure should not undo cancellation
            console.error(
                "Failed to queue cancellation email:",
                emailError
            );
        }

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment: cancelledAppointment
        });

    } catch (error) {

        console.error(
            "Cancel appointment error:",
            error
        );

        return res.status(500).json({
            message: "Unable to cancel appointment"
        });
    }
};

// ======================================================
// 5. RESCHEDULE APPOINTMENT
// ======================================================

const rescheduleAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { newStartTime, newEndTime } = req.body;

        if (!appointmentId || !newStartTime || !newEndTime) {
            return res.status(400).json({
                message: "Appointment ID, new start time and new end time are required"
            });
        }

        const newStart = new Date(newStartTime);
        const newEnd = new Date(newEndTime);

        if (
            Number.isNaN(newStart.getTime()) ||
            Number.isNaN(newEnd.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date/time"
            });
        }

        if (newStart >= newEnd) {
            return res.status(400).json({
                message: "Invalid appointment time"
            });
        }

        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            // Find original appointment
            const oldAppointment = await tx.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

            if (!oldAppointment) {
                throw new Error("APPOINTMENT_NOT_FOUND");
            }

            // Make sure this appointment belongs to the patient
            if (oldAppointment.patientId !== patient.id) {
                throw new Error("NOT_APPOINTMENT_OWNER");
            }

            // Only confirmed appointments can be rescheduled
            if (oldAppointment.status !== "CONFIRMED") {
                throw new Error("INVALID_APPOINTMENT_STATUS");
            }

            // Check doctor leave for new date
            const dayStart = new Date(newStart);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(newStart);
            dayEnd.setHours(23, 59, 59, 999);

            const leave = await tx.doctorLeave.findFirst({
                where: {
                    doctorId: oldAppointment.doctorId,
                    leaveDate: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            });

            if (leave) {
                throw new Error("DOCTOR_ON_LEAVE");
            }

            // Check whether the new slot is already booked
            const existingAppointment =
                await tx.appointment.findFirst({
                    where: {
                        doctorId: oldAppointment.doctorId,
                        startTime: newStart,
                        status: {
                            in: [
                                "CONFIRMED",
                                "COMPLETED",
                                "RESCHEDULED"
                            ]
                        }
                    }
                });

            if (existingAppointment) {
                throw new Error("NEW_SLOT_BOOKED");
            }

            // Check whether another patient is holding the new slot
            const existingHold = await tx.slotHold.findFirst({
                where: {
                    doctorId: oldAppointment.doctorId,
                    startTime: newStart,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });

            if (existingHold) {
                throw new Error("NEW_SLOT_HELD");
            }

            // Create the new appointment
            const newAppointment = await tx.appointment.create({
                data: {
                    doctorId: oldAppointment.doctorId,
                    patientId: oldAppointment.patientId,
                    startTime: newStart,
                    endTime: newEnd,
                    status: "CONFIRMED",
                    symptoms: oldAppointment.symptoms,
                    aiSummary: oldAppointment.aiSummary,
                    aiStatus: oldAppointment.aiStatus
                }
            });

            // Mark old appointment as rescheduled
            const updatedOldAppointment =
                await tx.appointment.update({
                    where: {
                        id: oldAppointment.id
                    },
                    data: {
                        status: "RESCHEDULED"
                    }
                });

            return {
                oldAppointment: updatedOldAppointment,
                newAppointment
            };
        });

        // ==================================================
// UPDATE GOOGLE CALENDAR EVENTS
// ==================================================

try {

    const oldCalendarEvents =
        await prisma.calendarEvent.findMany({
            where: {
                appointmentId:
                    result.oldAppointment.id
            }
        });

    const appointmentDetails =
        await prisma.appointment.findUnique({
            where: {
                id: result.newAppointment.id
            },
            include: {
                patient: {
                    include: {
                        user: true
                    }
                },
                doctor: {
                    include: {
                        user: true
                    }
                }
            }
        });

    if (appointmentDetails) {

        const patientName =
            appointmentDetails.patient.user.name;

        const doctorName =
            appointmentDetails.doctor.user.name;

        const patientUserId =
            appointmentDetails.patient.user.id;

        const doctorUserId =
            appointmentDetails.doctor.user.id;

        for (const calendarEvent of oldCalendarEvents) {

            try {

                const googleAccount =
                    await prisma.googleCalendarAccount.findUnique({
                        where: {
                            userId:
                                calendarEvent.userId
                        }
                    });

                if (!googleAccount) {

                    console.log(
                        `No Google Calendar account found for user ${calendarEvent.userId}`
                    );

                    continue;
                }

                const isPatient =
                    calendarEvent.userId === patientUserId;

                const isDoctor =
                    calendarEvent.userId === doctorUserId;

                let summary;
                let description;
                let attendeeEmail;

                if (isPatient) {

                    summary =
                        `Doctor Appointment - Dr. ${doctorName}`;

                    description =
                        `Healthcare appointment

Doctor: Dr. ${doctorName}
Patient: ${patientName}

Symptoms:
${appointmentDetails.symptoms || "Not provided"}`;

                    attendeeEmail =
                        appointmentDetails.doctor.user.email;

                } else if (isDoctor) {

                    summary =
                        `Patient Appointment - ${patientName}`;

                    description =
                        `Healthcare appointment

Patient: ${patientName}
Doctor: Dr. ${doctorName}

Symptoms:
${appointmentDetails.symptoms || "Not provided"}`;

                    attendeeEmail =
                        appointmentDetails.patient.user.email;

                } else {

                    continue;
                }

                // ------------------------------------------
                // Update Google Calendar event
                // ------------------------------------------

                await updateCalendarEvent({

                    tokens: {
                        access_token:
                            googleAccount.accessToken,

                        refresh_token:
                            googleAccount.refreshToken,

                        expiry_date:
                            googleAccount.expiryDate
                                ? Number(
                                    googleAccount.expiryDate
                                )
                                : undefined
                    },

                    googleEventId:
                        calendarEvent.googleEventId,

                    summary,

                    description,

                    startTime:
                        result.newAppointment.startTime,

                    endTime:
                        result.newAppointment.endTime,

                    attendeeEmail
                });

                console.log(
                    `Google Calendar event updated: ${calendarEvent.googleEventId}`
                );

                // ------------------------------------------
                // Move CalendarEvent to new appointment
                // ------------------------------------------

                await prisma.calendarEvent.update({
                    where: {
                        id: calendarEvent.id
                    },
                    data: {
                        appointmentId:
                            result.newAppointment.id
                    }
                });

            } catch (calendarEventError) {

                console.error(
                    `Failed to update Google Calendar event ${calendarEvent.googleEventId}:`,
                    calendarEventError.message
                );
            }
        }
    }

} catch (calendarError) {

    // Google Calendar failure must NOT undo
    // an already successful reschedule.

    console.error(
        "Google Calendar reschedule error:",
        calendarError.message
    );
}

        // ==================================================
        // SEND RESCHEDULE EMAIL
        // ==================================================

        try {

            const appointmentDetails =
                await prisma.appointment.findUnique({
                    where: {
                        id: result.newAppointment.id
                    },
                    include: {
                        patient: {
                            include: {
                                user: true
                            }
                        },
                        doctor: {
                            include: {
                                user: true
                            }
                        }
                    }
                });

            if (appointmentDetails) {

                const patientEmail =
                    appointmentDetails.patient.user.email;

                const patientName =
                    appointmentDetails.patient.user.name;

                const doctorName =
                    appointmentDetails.doctor.user.name;

                await prisma.emailJob.create({
                    data: {
                        recipient: patientEmail,

                        subject:
                            "Appointment Rescheduled Successfully",

                        text: `
Hello ${patientName},

Your healthcare appointment has been successfully rescheduled.

Doctor: Dr. ${doctorName}

New appointment time:
Start: ${newStart.toISOString()}
End: ${newEnd.toISOString()}

Your previous appointment has been marked as RESCHEDULED.

Please make sure to be available at the new appointment time.

Thank you.
`,

                        html: null,

                        attempts: 0,

                        maxAttempts: 3,

                        status: "PENDING",

                        nextAttemptAt: new Date()
                    }
                });

                console.log(
                    `Reschedule email queued for ${patientEmail}`
                );
            }

        } catch (emailError) {

            // Email failure should NOT undo a successful reschedule
            console.error(
                "Failed to queue reschedule email:",
                emailError
            );
        }

        return res.status(200).json({
            message: "Appointment rescheduled successfully",
            oldAppointment: result.oldAppointment,
            newAppointment: result.newAppointment
        });

    } catch (error) {

        if (error.message === "APPOINTMENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        if (error.message === "NOT_APPOINTMENT_OWNER") {
            return res.status(403).json({
                message: "You cannot reschedule this appointment"
            });
        }

        if (error.message === "INVALID_APPOINTMENT_STATUS") {
            return res.status(409).json({
                message: "Only confirmed appointments can be rescheduled"
            });
        }

        if (error.message === "DOCTOR_ON_LEAVE") {
            return res.status(409).json({
                message: "Doctor is on leave on the selected date"
            });
        }

        if (error.message === "NEW_SLOT_BOOKED") {
            return res.status(409).json({
                message: "The new slot has already been booked"
            });
        }

        if (error.message === "NEW_SLOT_HELD") {
            return res.status(409).json({
                message: "The new slot is currently being held by another patient"
            });
        }

        console.error(
            "Reschedule appointment error:",
            error
        );

        return res.status(500).json({
            message: "Unable to reschedule appointment"
        });
    }
};

// ======================================================
// 6. GET MY APPOINTMENTS
// ======================================================

const getMyAppointments = async (req, res) => {
    try {
        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: patient.id
            },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startTime: "desc"
            }
        });

        return res.status(200).json({
            appointments
        });

    } catch (error) {
        console.error(
            "Get my appointments error:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch appointments"
        });
    }
};

const getMyDoctorAppointments = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id
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
                }
            },
            orderBy: {
                startTime: "asc"
            }
        });

        return res.status(200).json({
            appointments: appointments.map((appointment) => ({
                id: appointment.id,

                patient: {
                    name: appointment.patient.user.name,
                    email: appointment.patient.user.email
                },

                startTime: appointment.startTime,
                endTime: appointment.endTime,

                symptoms: appointment.symptoms,

                status: appointment.status
            }))
        });

    } catch (error) {

        console.error(
            "Get doctor appointments error:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch doctor appointments"
        });
    }
};

// ======================================================
// DOCTOR VIEW APPOINTMENT + AI SUMMARY
// ======================================================

const getDoctorAppointmentDetails = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
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
                    prescription: true
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Security check:
        // Doctor can only access their own appointments.
        if (appointment.doctorId !== doctor.id) {
            return res.status(403).json({
                message: "You cannot access this appointment"
            });
        }

        return res.status(200).json({
            appointment: {
                id: appointment.id,

                patient: {
                    name: appointment.patient.user.name,
                    email: appointment.patient.user.email
                },

                startTime: appointment.startTime,
                endTime: appointment.endTime,

                symptoms: appointment.symptoms,

                aiStatus: appointment.aiStatus,

                aiSummary:
                    appointment.aiSummary
                        ? appointment.aiSummary
                        : "AI summary is currently unavailable. Please review the patient's symptoms directly.",

                consultationNotes:
                    appointment.consultationNotes,

                postVisitSummary:
                    appointment.postVisitSummary,

                prescription:
                    appointment.prescription,

                status: appointment.status
            }
        });

    } catch (error) {

        console.error(
            "Get doctor appointment details error:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch appointment details"
        });
    }
};

// ======================================================
// DOCTOR SUBMITS CONSULTATION
// ======================================================

const submitConsultation = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const {
            consultationNotes,
            prescription
        } = req.body;

        if (!consultationNotes) {
            return res.status(400).json({
                message: "Consultation notes are required"
            });
        }

        // Find doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        // Find appointment
        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Make sure this appointment belongs to this doctor
        if (appointment.doctorId !== doctor.id) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        // Only confirmed appointments can be consulted
        if (appointment.status !== "CONFIRMED") {
            return res.status(400).json({
                message:
                    "Consultation can only be submitted for a confirmed appointment"
            });
        }

        // Save consultation notes
        // ----------------------------------------------
// Save consultation notes
// ----------------------------------------------

const updatedAppointment =
    await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            consultationNotes
        }
    });


// ----------------------------------------------
// Save prescription if provided
// ----------------------------------------------

if (prescription) {

    const {
        medicineName,
        dosage,
        frequency,
        duration,
        startDate
    } = prescription;

    if (
        !medicineName ||
        !dosage ||
        !frequency ||
        !duration ||
        !startDate
    ) {
        return res.status(400).json({
            message:
                "Complete prescription details are required"
        });
    }

    const savedPrescription =
    await prisma.prescription.upsert({

        where: {
            appointmentId
        },

        update: {
            medicineName,
            dosage,
            frequency,
            duration,
            startDate: new Date(startDate)
        },

        create: {
            appointmentId,
            medicineName,
            dosage,
            frequency,
            duration,
            startDate: new Date(startDate)
        }
    });
    // ----------------------------------------------
// Create medication reminders
// ----------------------------------------------

await createMedicationReminders({
    prescriptionId: savedPrescription.id,
    patientId: appointment.patientId,
    frequency,
    duration,
    startDate: new Date(startDate)
});
}

        return res.status(200).json({
            message:
                "Consultation submitted successfully",

            appointment:
                updatedAppointment
        });

    } catch (error) {

        console.error(
            "Submit consultation error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to submit consultation"
        });
    }
};


// ======================================================
// DOCTOR COMPLETES APPOINTMENT
// ======================================================

const completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // Find doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        // Find appointment
        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                },
                include: {
                    prescription: true
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Security check
        if (appointment.doctorId !== doctor.id) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        // Only confirmed appointments can be completed
        if (appointment.status !== "CONFIRMED") {
            return res.status(409).json({
                message:
                    "Only confirmed appointments can be completed"
            });
        }

        // Consultation notes are required
        if (!appointment.consultationNotes) {
            return res.status(400).json({
                message:
                    "Please submit consultation notes before completing the appointment"
            });
        }

        // ----------------------------------------------
        // Mark appointment as COMPLETED
        // ----------------------------------------------

        const completedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: "COMPLETED"
                }
            });

        // ----------------------------------------------
        // Generate post-visit AI summary
        // ----------------------------------------------

        let aiStatus = "PENDING";
        let postVisitSummary = null;

        try {

            let clinicalInformation =
                `Consultation Notes:
${appointment.consultationNotes}
`;

            if (appointment.prescription) {

                clinicalInformation += `
Prescription:
Medicine: ${appointment.prescription.medicineName}
Dosage: ${appointment.prescription.dosage}
Frequency: ${appointment.prescription.frequency}
Duration: ${appointment.prescription.duration}
Start Date: ${appointment.prescription.startDate}
`;
            }

            const aiResult =
                await generatePostVisitSummary(
                    clinicalInformation
                );

            if (aiResult.success) {

                postVisitSummary =
                    aiResult.summary;

                aiStatus = "COMPLETED";

            } else {

                aiStatus = "FAILED";

                console.error(
                    "Post-visit AI generation failed:",
                    aiResult.error
                );
            }

        } catch (aiError) {

            aiStatus = "FAILED";

            console.error(
                "Post-visit AI error:",
                aiError
            );
        }

        // ----------------------------------------------
        // Save AI result/status
        // ----------------------------------------------

        const finalAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    postVisitSummary,
                    aiStatus
                }
            });

        return res.status(200).json({
            message:
                "Appointment completed successfully",

            appointment:
                finalAppointment,

            aiStatus
        });

    } catch (error) {

        console.error(
            "Complete appointment error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to complete appointment"
        });
    }
};
// ======================================================
// GENERATE POST-VISIT SUMMARY
// ======================================================

const generateAppointmentPostVisitSummary = async (req, res) => {
    try {

        const { appointmentId } = req.params;

        // Find doctor
        const doctor = await prisma.doctor.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        // Find appointment and prescription
        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                },
                include: {
                    prescription: true
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Security check
        if (appointment.doctorId !== doctor.id) {
            return res.status(403).json({
                message:
                    "You cannot modify this appointment"
            });
        }

        // Consultation notes are required
        if (!appointment.consultationNotes) {
            return res.status(400).json({
                message:
                    "Consultation notes are required before generating the summary"
            });
        }

        // ----------------------------------------------
        // Prepare information for the LLM
        // ----------------------------------------------

        let clinicalInformation =
            `Consultation Notes:
${appointment.consultationNotes}
`;

        if (appointment.prescription) {

            clinicalInformation += `
Prescription:
Medicine: ${appointment.prescription.medicineName}
Dosage: ${appointment.prescription.dosage}
Frequency: ${appointment.prescription.frequency}
Duration: ${appointment.prescription.duration}
Start Date: ${appointment.prescription.startDate}
`;
        }

        // ----------------------------------------------
        // Generate AI summary
        // ----------------------------------------------

        const aiResult =
            await generatePostVisitSummary(
                clinicalInformation
            );

        // ----------------------------------------------
        // AI failed
        // ----------------------------------------------

        if (!aiResult.success) {

            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    postVisitSummary: null
                }
            });

            return res.status(200).json({
                message:
                    "Consultation saved, but AI summary is currently unavailable",

                aiStatus: "FAILED",

                error: aiResult.error
            });
        }

        // ----------------------------------------------
        // AI succeeded
        // ----------------------------------------------

        const updatedAppointment =
            await prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    postVisitSummary:
                        aiResult.summary
                }
            });

        return res.status(200).json({
            message:
                "Post-visit summary generated successfully",

            aiStatus: "COMPLETED",

            postVisitSummary:
                updatedAppointment.postVisitSummary
        });

    } catch (error) {

        console.error(
            "Post-visit summary error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to generate post-visit summary"
        });
    }
};

// ======================================================
// PATIENT VIEW POST-VISIT SUMMARY
// ======================================================

const getPatientPostVisitSummary = async (req, res) => {
    try {

        const { appointmentId } = req.params;

        // Find patient
        const patient = await prisma.patient.findUnique({
            where: {
                userId: req.user.userId
            }
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient profile not found"
            });
        }

        // Find appointment
        const appointment =
            await prisma.appointment.findUnique({
                where: {
                    id: appointmentId
                },
                include: {
                    doctor: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    prescription: true
                }
            });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Security check
        if (appointment.patientId !== patient.id) {
            return res.status(403).json({
                message:
                    "You cannot access this appointment"
            });
        }

        return res.status(200).json({
    appointment: {
        id: appointment.id,

        doctor: {
            name: appointment.doctor.user.name,
            specialization:
                appointment.doctor.specialization
        },

        startTime: appointment.startTime,
        endTime: appointment.endTime,

        status: appointment.status,

        consultationNotes:
            appointment.consultationNotes,

        postVisitSummary:
            appointment.postVisitSummary
                ? appointment.postVisitSummary
                : "Post-visit summary is currently unavailable.",

        prescription:
            appointment.prescription
    }
});

    } catch (error) {

        console.error(
            "Get patient post-visit summary error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to fetch post-visit summary"
        });
    }
};

// ======================================================
// EXPORT FUNCTIONS
// ======================================================

module.exports = {
    getAvailableSlots,
    holdSlot,
    confirmAppointment,
    cancelAppointment,
    rescheduleAppointment,
    getMyAppointments,
    getMyDoctorAppointments,
    getDoctorAppointmentDetails,
    submitConsultation,
    generateAppointmentPostVisitSummary,
    getPatientPostVisitSummary,
    completeAppointment
};