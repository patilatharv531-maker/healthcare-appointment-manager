# Healthcare Appointment Manager

A full-stack healthcare appointment management system for patients, doctors, and administrators.

## Project Overview

The Healthcare Appointment Manager provides a centralized platform for managing the complete healthcare appointment lifecycle.

The system supports:

- Patient appointment booking
- Doctor appointment management
- Admin doctor management
- Appointment cancellation
- Appointment rescheduling
- Doctor leave management
- Google Calendar synchronization
- Email notifications
- Consultation and prescription management
- Medication reminders
- AI-assisted pre-visit and post-visit summaries

## Features

### Patient Features

- Secure patient login
- View registered doctors
- View doctor specialization and working hours
- Check available appointment slots
- Temporarily hold an appointment slot
- Confirm appointments
- Provide symptoms before the appointment
- Cancel appointments
- Reschedule appointments
- View upcoming appointments
- View completed appointments
- View cancelled appointments
- View rescheduled appointments
- Connect Google Calendar
- View consultation and prescription information
- View AI-assisted post-visit summaries

### Doctor Features

- Secure doctor login
- View upcoming appointments
- View completed appointments
- View cancelled appointments
- View rescheduled appointments
- View patient details
- View patient symptoms
- Add consultation notes
- Create prescriptions
- Complete appointments
- View AI-assisted post-visit information
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
- Automatic Google Calendar event deletion
- Automatic Google Calendar event updates during rescheduling
- Appointment confirmation emails
- Cancellation notifications
- Rescheduling notifications
- Doctor leave notifications
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

### Backend

- Node.js
- Express.js

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
- Email service
- LLM / AI service

### Background Processing

- Email Worker
- Medication Reminder Worker

## Project Structure

```text
healthcare-appointment-manager/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── jobs/
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
└── .gitignore