const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const {
    startEmailWorker
} = require("./jobs/emailWorker");
require("./workers/reminderWorker");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Healthcare Appointment Manager API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/calendar", calendarRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    startEmailWorker();
});