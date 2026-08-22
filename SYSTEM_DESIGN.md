# System Design — Healthcare Appointment Manager

## 1. Overview

The Healthcare Appointment Manager is a full-stack system designed to manage appointments between patients and doctors while preventing scheduling conflicts and handling notifications and external integrations reliably.

The system uses React.js for the frontend, Node.js/Express.js for the backend, PostgreSQL with Prisma ORM for persistent storage, Google Calendar for calendar synchronization, an email job system for notifications, and an LLM for pre-visit and post-visit assistance.

## 2. Double-Booking Prevention

The appointment booking process uses a slot-hold mechanism before an appointment is permanently confirmed.

When a patient selects an available slot, the system temporarily creates a hold with an expiration time. During this period, the slot cannot be confirmed by another patient.

Before confirmation, the backend validates the slot again against existing appointments and active holds. This validation is performed on the server rather than relying only on frontend availability information.

The final confirmation operation checks that the requested slot is still available before creating the appointment. This prevents two patients from booking the same doctor and time slot when they attempt to book concurrently.

The database stores appointment start and end times together with the doctor ID, allowing the backend to detect overlapping appointments.

## 3. Slot Hold Mechanism

A slot is not immediately converted into a confirmed appointment when a patient selects it.

Instead, the system creates a temporary hold associated with the patient and the selected slot. The hold has an expiration time.

While the hold is active, other patients cannot successfully confirm the same slot.

If the patient completes the booking before the hold expires, the appointment is created and the hold is consumed.

If the patient abandons the process or the hold expires, the slot becomes available again.

This prevents users from permanently blocking appointment slots simply by selecting them.

## 4. Doctor Leave Conflict Handling

Administrators can mark a doctor as being on leave for a specific date.

When leave is created, the backend identifies confirmed appointments belonging to that doctor on the affected date.

The leave creation and appointment cancellation operations are performed inside a database transaction so that the leave record and affected appointment updates remain consistent.

Affected appointments are changed to `CANCELLED_BY_DOCTOR`.

The system also removes the corresponding Google Calendar events and sends notification emails to affected patients.

Email failures do not roll back the leave operation or appointment cancellation. This ensures that an external notification failure does not leave the database in an inconsistent state.

## 5. Notification Failure Handling

Email notifications are processed through an email-job system rather than making the main appointment operation dependent on immediate email delivery.

Email jobs are stored with a `PENDING` status and processed by a background email worker.

When an email is successfully sent, the job is marked as `SENT`.

If delivery fails, the system records the error and retries the job using exponential backoff. The number of attempts is limited using a maximum-attempt value.

After the maximum number of attempts is reached, the email job is marked as `FAILED`.

Medication reminders use the same background-processing approach, allowing reminder generation and email delivery to occur independently from the main appointment workflow.

This design prevents temporary email-service failures from breaking appointment booking, cancellation, rescheduling, or doctor-leave operations.

## 6. Google Calendar Integration

Doctors can connect their Google Calendar using OAuth 2.0.

After an appointment is confirmed, a corresponding Google Calendar event is created.

When an appointment is rescheduled, the existing event is updated rather than creating a duplicate event.

When an appointment is cancelled or affected by doctor leave, the corresponding calendar event is deleted.

OAuth credentials and application secrets are stored through environment variables rather than committed to the source repository.

## 7. LLM Integration and Failure Handling

The system uses an LLM for two healthcare-assistance features.

For pre-visit assistance, the prompt requests an urgency level, chief complaint, and three suggested questions based on patient symptoms.

For post-visit assistance, clinical notes are converted into a patient-friendly summary containing the medication schedule and follow-up steps.

LLM output is treated as assistance rather than a replacement for professional medical judgment. The application should also handle API failures gracefully so that an unavailable LLM service does not prevent the underlying appointment or consultation workflow from functioning.

## 8. Overall Design

The system separates frontend presentation, backend controllers/routes, business services, database access, background jobs, and external integrations.

This separation makes the application easier to maintain and allows failures in external services such as email, Google Calendar, or the LLM to be handled without unnecessarily affecting core appointment data.