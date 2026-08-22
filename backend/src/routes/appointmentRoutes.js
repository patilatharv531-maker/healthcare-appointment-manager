const express = require("express");

const {
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
} = require("../controllers/appointmentController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Get available appointment slots
router.get(
    "/doctors/:doctorId/slots",
    authenticate,
    getAvailableSlots
);

// Patient temporarily holds a slot
router.post(
    "/hold",
    authenticate,
    authorizeRoles("PATIENT"),
    holdSlot
);

// Patient confirms appointment
router.post(
    "/confirm",
    authenticate,
    authorizeRoles("PATIENT"),
    confirmAppointment
);

router.get(
    "/my",
    authenticate,
    authorizeRoles("PATIENT"),
    getMyAppointments
);

router.get(
    "/doctor/my",
    authenticate,
    authorizeRoles("DOCTOR"),
    getMyDoctorAppointments
);

router.get(
    "/doctor/:appointmentId",
    authenticate,
    authorizeRoles("DOCTOR"),
    getDoctorAppointmentDetails
);

router.patch(
    "/doctor/:appointmentId/consultation",
    authenticate,
    authorizeRoles("DOCTOR"),
    submitConsultation
);

router.patch(
    "/doctor/:appointmentId/complete",
    authenticate,
    authorizeRoles("DOCTOR"),
    completeAppointment
);

router.post(
    "/doctor/:appointmentId/post-visit-summary",
    authenticate,
    authorizeRoles("DOCTOR"),
    generateAppointmentPostVisitSummary
);

router.get(
    "/patient/:appointmentId/post-visit-summary",
    authenticate,
    authorizeRoles("PATIENT"),
    getPatientPostVisitSummary
);

// Patient cancels an appointment
router.patch(
    "/:appointmentId/cancel",
    authenticate,
    authorizeRoles("PATIENT"),
    cancelAppointment
);

// Patient reschedules an appointment
router.patch(
    "/:appointmentId/reschedule",
    authenticate,
    authorizeRoles("PATIENT"),
    rescheduleAppointment
);

module.exports = router;