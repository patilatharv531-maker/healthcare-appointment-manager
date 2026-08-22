const {
    sendEmailWithRetry
} = require("./emailJobService");

// ======================================================
// BOOKING CONFIRMATION
// ======================================================

const sendBookingConfirmation = async ({
    patientEmail,
    patientName,
    doctorName,
    startTime,
    endTime
}) => {

    return sendEmailWithRetry({
        to: patientEmail,

        subject: "Healthcare Appointment Confirmation",

        text: `
Hello ${patientName},

Your appointment has been confirmed.

Doctor: ${doctorName}
Start: ${startTime}
End: ${endTime}

Please arrive on time.

Thank you,
Healthcare Appointment Manager
        `,

        html: `
            <h2>Appointment Confirmed</h2>

            <p>Hello ${patientName},</p>

            <p>Your appointment has been confirmed.</p>

            <p>
                <strong>Doctor:</strong> ${doctorName}<br>
                <strong>Start:</strong> ${startTime}<br>
                <strong>End:</strong> ${endTime}
            </p>

            <p>Please arrive on time.</p>

            <p>
                Thank you,<br>
                Healthcare Appointment Manager
            </p>
        `
    });
};


// ======================================================
// DOCTOR LEAVE NOTIFICATION
// ======================================================

const sendDoctorLeaveNotification = async ({
    patientEmail,
    patientName,
    doctorName,
    startTime,
    reason
}) => {

    return sendEmailWithRetry({
        to: patientEmail,

        subject: "Appointment Cancelled - Doctor Unavailable",

        text: `
Hello ${patientName},

We are sorry to inform you that your appointment with
Dr. ${doctorName} has been cancelled because the doctor
is unavailable on the scheduled date.

Appointment:
${startTime}

Reason:
${reason || "Doctor unavailable"}

Please book another available appointment.

Thank you,
Healthcare Appointment Manager
        `,

        html: `
            <h2>Appointment Cancelled</h2>

            <p>Hello ${patientName},</p>

            <p>
                We are sorry to inform you that your appointment
                with <strong>Dr. ${doctorName}</strong> has been
                cancelled because the doctor is unavailable.
            </p>

            <p>
                <strong>Appointment:</strong> ${startTime}<br>
                <strong>Reason:</strong>
                ${reason || "Doctor unavailable"}
            </p>

            <p>
                Please book another available appointment.
            </p>

            <p>
                Thank you,<br>
                Healthcare Appointment Manager
            </p>
        `
    });
};


// ======================================================
// CANCELLATION NOTIFICATION
// ======================================================

const sendCancellationNotification = async ({
    patientEmail,
    patientName,
    doctorName,
    startTime
}) => {

    return sendEmailWithRetry({
        to: patientEmail,

        subject: "Appointment Cancelled",

        text: `
Hello ${patientName},

Your appointment with Dr. ${doctorName}
has been cancelled.

Appointment time:
${startTime}

Thank you,
Healthcare Appointment Manager
        `,

        html: `
            <h2>Appointment Cancelled</h2>

            <p>Hello ${patientName},</p>

            <p>
                Your appointment with
                <strong>Dr. ${doctorName}</strong>
                has been cancelled.
            </p>

            <p>
                <strong>Appointment:</strong> ${startTime}
            </p>

            <p>
                Thank you,<br>
                Healthcare Appointment Manager
            </p>
        `
    });
};

// ======================================================
// DOCTOR BOOKING NOTIFICATION
// ======================================================

const sendDoctorBookingNotification = async ({
    doctorEmail,
    doctorName,
    patientName,
    startTime,
    endTime
}) => {

    return sendEmailWithRetry({
        to: doctorEmail,

        subject: "New Healthcare Appointment",

        text: `
Hello Dr. ${doctorName},

A new appointment has been booked.

Patient: ${patientName}
Start: ${startTime}
End: ${endTime}

Please review the appointment details before the visit.

Thank you,
Healthcare Appointment Manager
        `,

        html: `
            <h2>New Appointment</h2>

            <p>Hello Dr. ${doctorName},</p>

            <p>
                A new appointment has been booked.
            </p>

            <p>
                <strong>Patient:</strong> ${patientName}<br>
                <strong>Start:</strong> ${startTime}<br>
                <strong>End:</strong> ${endTime}
            </p>

            <p>
                Please review the appointment details before the visit.
            </p>

            <p>
                Thank you,<br>
                Healthcare Appointment Manager
            </p>
        `
    });
};


module.exports = {
    sendBookingConfirmation,
    sendDoctorBookingNotification,
    sendDoctorLeaveNotification,
    sendCancellationNotification
};