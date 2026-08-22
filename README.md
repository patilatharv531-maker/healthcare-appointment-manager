# Healthcare Appointment Manager

A full-stack healthcare appointment management system for patients, doctors, and administrators.

## Project Overview

The Healthcare Appointment Manager provides a centralized platform for managing the complete healthcare appointment lifecycle.

The system supports:

- Patient registration and authentication
- Doctor management
- Appointment slot availability
- Temporary slot holds
- Appointment confirmation
- Appointment cancellation
- Appointment rescheduling
- Doctor leave management
- Google Calendar synchronization
- Email notifications
- Consultation and prescription management
- Medication reminders
- AI-assisted pre-visit analysis
- AI-assisted post-visit summaries
- Role-based access control

## Features

### Patient Features

- Secure patient registration and login
- View registered doctors
- View doctor specialization and working hours
- Check available appointment slots
- Temporarily hold an appointment slot
- Confirm appointments
- Submit symptoms before an appointment
- Cancel appointments
- Reschedule appointments
- View upcoming appointments
- View completed appointments
- View cancelled appointments
- View rescheduled appointments
- View consultation and prescription information
- View AI-assisted post-visit summaries

### Doctor Features

- Secure doctor login
- View upcoming appointments
- View completed appointments
- View cancelled appointments
- View rescheduled appointments
- View appointment details
- View patient information
- View patient symptoms
- Add consultation notes
- Complete appointments
- Create prescriptions
- Generate AI-assisted post-visit summaries
- Connect Google Calendar

### Admin Features

- Secure admin login
- Create doctor accounts
- Configure doctor specialization
- Configure working hours
- Configure appointment slot duration
- View registered doctors
- Mark doctors on leave
- Automatically handle appointments affected by doctor leave

### Automation and Integrations

- Google Calendar OAuth 2.0 integration
- Automatic Google Calendar event creation
- Automatic Google Calendar event updates during rescheduling
- Automatic Google Calendar event deletion during cancellation
- Appointment confirmation emails
- Cancellation notifications
- Doctor leave notifications
- Doctor booking notifications
- Medication reminder emails
- Background email processing
- Email retry mechanism
- Automated medication reminder generation
- AI-assisted pre-visit analysis
- AI-assisted post-visit summaries

## Technology Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend

- Node.js
- Express.js
- JavaScript

### Database

- PostgreSQL
- Prisma ORM
- Neon PostgreSQL

### Authentication and Security

- JSON Web Tokens (JWT)
- bcrypt
- Role-based authorization middleware

### External Services

- Google Calendar API
- Google OAuth 2.0
- Nodemailer / SMTP email service
- OpenAI API

### Background Processing

- Email Worker
- Medication Reminder Worker

## Project Structure

```text
healthcare-appointment-manager/

├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── jobs/
│   │   ├── workers/
│   │   └── utils/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── README.md
├── SYSTEM_DESIGN.md
└── .gitignore
```

## Setup Instructions

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- PostgreSQL database
- Google Cloud project
- OpenAI API access
- SMTP/email account

### 1. Clone the Repository

```bash
git clone https://github.com/patilatharv531-maker/healthcare-appointment-manager.git
cd healthcare-appointment-manager
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
```

Create a `.env` file inside the `backend` directory.

Do not commit this file to GitHub.

### 3. Environment Variables

Create `backend/.env` using `.env.example` as a template.

```env
DATABASE_URL=
JWT_SECRET=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

OPENAI_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

FRONTEND_URL=
```

For production, `FRONTEND_URL` should contain the deployed frontend URL:

```text
https://healthcare-appointment-manager-swart.vercel.app
```

The `.env.example` file should contain only empty values and must never contain real credentials.

### 4. Start the Backend

For development:

```bash
npm run dev
```

The backend normally runs on:

```text
http://localhost:5000
```

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display the local frontend URL in the terminal.

## Database Schema

The application uses PostgreSQL with Prisma ORM.

### Main Models

| Model | Purpose |
|---|---|
| `User` | Stores authentication and role information |
| `Patient` | Stores patient-specific information |
| `Doctor` | Stores doctor specialization and working hours |
| `Appointment` | Stores appointment information and status |
| `SlotHold` | Temporarily reserves an appointment slot |
| `DoctorLeave` | Stores doctor leave dates |
| `Prescription` | Stores prescriptions created by doctors |
| `MedicationReminder` | Stores medication reminder schedules |
| `Notification` | Tracks application notification status |
| `EmailJob` | Stores queued email jobs and retry information |
| `CalendarEvent` | Maps appointments to Google Calendar events |
| `GoogleCalendarAccount` | Stores Google Calendar OAuth tokens |

## API Documentation

All protected endpoints require a JWT token:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a patient |
| POST | `/api/auth/login` | Public | Login and receive JWT |

### Doctors

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/doctors` | ADMIN | Create a doctor |
| GET | `/api/doctors` | ADMIN, PATIENT, DOCTOR | Get registered doctors |

### Appointments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/appointments/doctors/:doctorId/slots` | Authenticated | Get available appointment slots |
| POST | `/api/appointments/hold` | PATIENT | Temporarily hold a slot |
| POST | `/api/appointments/confirm` | PATIENT | Confirm a held appointment |
| GET | `/api/appointments/my` | PATIENT | Get patient appointments |
| GET | `/api/appointments/doctor/my` | DOCTOR | Get doctor appointments |
| GET | `/api/appointments/doctor/:appointmentId` | DOCTOR | Get appointment details |
| PATCH | `/api/appointments/:appointmentId/cancel` | PATIENT | Cancel an appointment |
| PATCH | `/api/appointments/:appointmentId/reschedule` | PATIENT | Reschedule an appointment |

### Doctor Leave

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/leaves` | ADMIN | Mark a doctor on leave |
| GET | `/api/leaves/doctor/:doctorId` | ADMIN, DOCTOR | View doctor leave records |

### Google Calendar

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/calendar/connect` | Authenticated | Start Google Calendar OAuth |
| GET | `/api/calendar/connect-browser` | Browser | Start Google Calendar OAuth |
| GET | `/api/calendar/oauth2callback` | Google OAuth | Handle OAuth callback |
| GET | `/api/calendar/status` | Authenticated | Check calendar connection |

### Consultations and Prescriptions

The application provides doctor-side functionality for:

- Adding consultation notes
- Completing appointments
- Creating prescriptions
- Generating post-visit summaries
- Generating medication reminders

Refer to the corresponding appointment controller and routes for the implementation details.

## LLM Usage

The application uses an LLM for two healthcare-assistance features.

### Pre-Visit Summary

Prompt:

```text
Analyse these symptoms and return:
urgency level (Low / Medium / High),
chief complaint,
and three suggested questions for the doctor.

Symptoms: <symptoms>
```

The output provides:

- Urgency level
- Chief complaint
- Three suggested questions for the doctor

The LLM is used as an assistance tool and does not replace professional medical diagnosis or treatment.

### Post-Visit Summary

Prompt:

```text
Convert these clinical notes into a patient-friendly summary
with medication schedule and follow-up steps:

<notes>
```

The output provides a patient-friendly summary of the consultation, medication schedule, and follow-up instructions.

The LLM should not invent clinical information or modify medication instructions.

If the LLM service is unavailable, the underlying appointment and consultation workflows should remain usable.

## Google Calendar Setup

### 1. Create a Google Cloud Project

Create or select a project in Google Cloud Console.

### 2. Enable Google Calendar API

Enable the Google Calendar API for the project.

### 3. Configure OAuth Consent Screen

Configure the OAuth consent screen and provide the required application information.

### 4. Create OAuth Credentials

Create an OAuth 2.0 Client ID for a web application.

### 5. Configure Authorized Redirect URI

For production, add:

```text
https://healthcare-appointment-manager-az0x.onrender.com/api/calendar/oauth2callback
```

For local development, add the corresponding localhost callback URL used by the backend.

The URI configured in Google Cloud must exactly match `GOOGLE_REDIRECT_URI`.

### 6. Configure Frontend Redirect

The backend uses `FRONTEND_URL` to redirect the browser to the frontend after successful Google Calendar authentication.

Production:

```text
https://healthcare-appointment-manager-swart.vercel.app
```

## Email Notifications

The system sends notifications for:

- Appointment confirmation
- Appointment cancellation
- Doctor leave
- Doctor booking
- Medication reminders

Email delivery is handled asynchronously through email jobs.

## Notification Failure Handling

Email jobs contain:

- Recipient
- Subject
- Message
- Attempt count
- Maximum attempts
- Status
- Next retry time
- Last error

Failed emails are retried using exponential backoff.

If the maximum number of attempts is reached, the job is marked as `FAILED`.

Email failures do not roll back the main appointment or doctor-leave operation.

## Deployment

### Frontend

The React frontend is deployed using Vercel.

Production URL:

```text
https://healthcare-appointment-manager-swart.vercel.app
```

### Backend

The Node.js/Express backend is deployed using Render.

Production API:

```text
https://healthcare-appointment-manager-az0x.onrender.com
```

### Source Code

```text
https://github.com/patilatharv531-maker/healthcare-appointment-manager
```

## Security

Sensitive configuration files must never be committed to GitHub.

The repository ignores:

```text
.env
.env.local
node_modules/
```

Use `.env.example` to document required environment variables without storing real credentials.

JWT authentication, password hashing, and role-based authorization are used to protect application resources.

## System Design

Detailed system-design decisions covering:

- Double-booking prevention
- Slot hold mechanism
- Doctor leave conflict handling
- Notification failure handling

are documented in:

```text
SYSTEM_DESIGN.md
```

## Submission Checklist

- [ ] Complete source code included
- [ ] README included
- [ ] SYSTEM_DESIGN.md included
- [ ] `.env.example` included
- [ ] `.env` excluded
- [ ] `node_modules` excluded
- [ ] No API keys or passwords committed
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Hosted application URL available
- [ ] Google Calendar configured
- [ ] Email notifications configured
- [ ] LLM prompts documented