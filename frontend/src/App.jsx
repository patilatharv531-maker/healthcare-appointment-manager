import {
  useEffect,
  useRef,
  useState
} from "react";

import "./App.css";

const API_URL = "http://localhost:5000";

function App() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginMode, setLoginMode] = useState(null);

  const [token, setToken] = useState(
  () => localStorage.getItem("token")
);

const [user, setUser] = useState(
  () => {
    const savedUser =
      localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  }
);

  const [appointments, setAppointments] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  const [calendarConnected, setCalendarConnected] = useState(false);

  // ======================================================
  // APPOINTMENT CATEGORIES
  // ======================================================

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status === "CONFIRMED"
    );

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status === "COMPLETED"
    );

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status === "CANCELLED" ||
        appointment.status === "CANCELLED_BY_DOCTOR"
    );
  
  const rescheduledAppointments =
  appointments.filter(
    (appointment) =>
      appointment.status === "RESCHEDULED"
  );


  // ======================================================
  // POST-VISIT STATE
  // ======================================================

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState(null);

  const postVisitRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ======================================================
  // DOCTOR DASHBOARD STATE
  // ======================================================

  const [selectedDoctorAppointment, setSelectedDoctorAppointment] =
    useState(null);

  const [doctorAppointmentLoading, setDoctorAppointmentLoading] =
    useState(false);

  const doctorAppointmentRef = useRef(null);

  // ======================================================
  // DOCTOR CONSULTATION STATE
  // ======================================================

  const [consultationNotes, setConsultationNotes] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [consultationLoading, setConsultationLoading] = useState(false);

  // ======================================================
  // PATIENT BOOKING STATE
  // ======================================================

  const [showBooking, setShowBooking] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSymptoms, setBookingSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotHoldId, setSlotHoldId] = useState(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);

  // ======================================================
  // RESCHEDULE STATE
  // ======================================================

  const [reschedulingAppointmentId, setReschedulingAppointmentId] =
    useState(null);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] =
    useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // ======================================================
  // ADMIN DASHBOARD STATE
  // ======================================================

  const [adminDoctors, setAdminDoctors] = useState([]);
  const [adminDoctorName, setAdminDoctorName] = useState("");
  const [adminDoctorEmail, setAdminDoctorEmail] = useState("");
  const [adminDoctorPassword, setAdminDoctorPassword] = useState("");
  const [leaveDates, setLeaveDates] = useState({});
  const [leaveReasons, setLeaveReasons] = useState({});
  const [adminSpecialization, setAdminSpecialization] = useState("");
  const [adminWorkingStart, setAdminWorkingStart] = useState("");
  const [adminWorkingEnd, setAdminWorkingEnd] = useState("");
  const [adminSlotDuration, setAdminSlotDuration] = useState(30);
  const [adminLoading, setAdminLoading] = useState(false);


  // ======================================================
  // PATIENT LOGIN
  // ======================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message || "Login failed"
        );

      }

      if (!data.token) {

        throw new Error(
          "Login successful, but token was not returned"
        );

      }

      if (loginMode && data.user?.role !== loginMode) {
        const roleName =
          loginMode === "PATIENT"
            ? "patient"
            : loginMode === "DOCTOR"
              ? "doctor"
              : "admin";

        throw new Error(
          `This account is not registered as a ${roleName} account.`
        );
      }

      setToken(data.token);
setUser(data.user || null);

localStorage.setItem("token", data.token);
localStorage.setItem(
  "user",
  JSON.stringify(data.user || null)
);

setMessage("");

    } catch (error) {

      setMessage(error.message);

    } finally {

      setLoading(false);

    }
  };


  // ======================================================
  // FETCH PATIENT APPOINTMENTS
  // ======================================================

  const fetchAppointments = async () => {

    if (!token) return;

    setLoading(true);
    setMessage("");

    try {

      const response = await fetch(
        `${API_URL}/api/appointments/my`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to fetch appointments"
        );

      }

      console.log(
        "PATIENT APPOINTMENTS:",
        data.appointments
      );

      setAppointments(
        data.appointments || []
      );

    } catch (error) {

      console.error(
        "Fetch appointments error:",
        error
      );

      setMessage(error.message);

    } finally {

      setLoading(false);

    }
  };


  // ======================================================
  // FETCH APPOINTMENTS AFTER LOGIN
  // ======================================================

  const checkCalendarStatus = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/calendar/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    console.log(
      "CALENDAR STATUS:",
      response.status,
      data
    );

    if (response.ok) {
      setCalendarConnected(data.connected);
    }

  } catch (error) {
    console.error(
      "Calendar status error:",
      error
    );
  }
};


useEffect(() => {

  if (!token || !user) return;

  if (user.role === "PATIENT") {
    fetchAppointments();
    checkCalendarStatus();
  }

  if (user.role === "DOCTOR") {
    fetchDoctorAppointments();
    checkCalendarStatus();
  }

  if (user.role === "ADMIN") {
    fetchAdminDoctors();
  }

}, [token, user]);


  // ======================================================
  // PATIENT BOOKING
  // ======================================================

  const fetchDoctors = async () => {
    if (!token) return;

    setBookingLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch doctors"
        );
      }

      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Fetch doctors error:", error);
      setMessage(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchAdminDoctors = async () => {
    if (!token) return;

    setAdminLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/doctors`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch doctors"
        );
      }

      setAdminDoctors(data.doctors || []);
    } catch (error) {
      console.error("Admin fetch doctors error:", error);
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const createDoctorFromAdmin = async (e) => {
    e.preventDefault();

    setAdminLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: adminDoctorName.trim(),
            email: adminDoctorEmail.trim(),
            password: adminDoctorPassword,
            specialization: adminSpecialization.trim(),
            workingStart: adminWorkingStart,
            workingEnd: adminWorkingEnd,
            slotDuration: Number(adminSlotDuration)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create doctor"
        );
      }

      setMessage("Doctor created successfully.");

      setAdminDoctorName("");
      setAdminDoctorEmail("");
      setAdminDoctorPassword("");
      setAdminSpecialization("");
      setAdminWorkingStart("");
      setAdminWorkingEnd("");
      setAdminSlotDuration(30);

      await fetchAdminDoctors();
    } catch (error) {
      console.error("Create doctor from admin error:", error);
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const markDoctorLeave = async (doctorId) => {
  try {

    const leaveDate = leaveDates[doctorId];
    const reason = leaveReasons[doctorId] || "";

    if (!leaveDate) {
      setMessage("Please select a leave date.");
      return;
    }

    setAdminLoading(true);
    setMessage("");

    const response = await fetch(
      `${API_URL}/api/leaves`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          doctorId,
          leaveDate,
          reason
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to mark doctor on leave"
      );
    }

    setMessage(
      data.affectedAppointments?.length > 0
        ? `Doctor leave marked successfully. ${data.affectedAppointments.length} affected appointment(s) were cancelled.`
        : "Doctor leave marked successfully."
    );

    // Clear that doctor's form
    setLeaveDates((prev) => ({
      ...prev,
      [doctorId]: ""
    }));

    setLeaveReasons((prev) => ({
      ...prev,
      [doctorId]: ""
    }));

  } catch (error) {

    console.error(
      "Mark doctor leave error:",
      error
    );

    setMessage(
      error.message ||
      "Unable to mark doctor on leave"
    );

  } finally {

    setAdminLoading(false);

  }
};

  const openBooking = async () => {
    setShowBooking(true);
    setSelectedDoctorId("");
    setBookingDate("");
    setAvailableSlots([]);
    setSelectedSlot(null);
    setBookingSymptoms("");
    setSlotHoldId(null);
    setHoldExpiresAt(null);
    setMessage("");

    await fetchDoctors();
  };

  const closeBooking = () => {
    setShowBooking(false);
    setSelectedDoctorId("");
    setBookingDate("");
    setAvailableSlots([]);
    setSelectedSlot(null);
    setBookingSymptoms("");
    setSlotHoldId(null);
    setHoldExpiresAt(null);
    setMessage("");
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDoctorId || !bookingDate) return;

    setBookingLoading(true);
    setSelectedSlot(null);
    setSlotHoldId(null);
    setHoldExpiresAt(null);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/doctors/${selectedDoctorId}/slots?date=${bookingDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      console.log("SLOTS API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch available slots"
        );
      }

      setAvailableSlots(data.slots || []);

      if (data.available === false) {
        setMessage(
          data.message || "Doctor is unavailable on this date."
        );
      }
    } catch (error) {
      console.error("Fetch available slots error:", error);
      setAvailableSlots([]);
      setMessage(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
  if (selectedDoctorId && bookingDate) {
    fetchAvailableSlots();
  }
}, [selectedDoctorId, bookingDate]);

  const holdSelectedSlot = async (slot) => {
    if (!selectedDoctorId || !slot) return;

    setBookingLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/hold`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            doctorId: selectedDoctorId,
            startTime: slot.startTime,
            endTime: slot.endTime
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to hold this slot"
        );
      }

      setSelectedSlot(slot);
      setSlotHoldId(data.hold?.id || null);
      setHoldExpiresAt(data.hold?.expiresAt || null);

      setMessage(
        "Slot held for 5 minutes. Please confirm your appointment."
      );
    } catch (error) {
      console.error("Hold slot error:", error);
      setSelectedSlot(null);
      setSlotHoldId(null);
      setHoldExpiresAt(null);
      setMessage(error.message);
      await fetchAvailableSlots();
    } finally {
      setBookingLoading(false);
    }
  };

  const confirmNewAppointment = async () => {
    if (!slotHoldId) {
      setMessage("Please select an available slot first.");
      return;
    }

    setBookingLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            holdId: slotHoldId,
            symptoms: bookingSymptoms.trim() || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to confirm appointment"
        );
      }

      setShowBooking(false);
      setSelectedDoctorId("");
      setBookingDate("");
      setAvailableSlots([]);
      setSelectedSlot(null);
      setBookingSymptoms("");
      setSlotHoldId(null);
      setHoldExpiresAt(null);

      setMessage(
        data.appointment?.aiStatus === "FAILED"
          ? "Appointment booked successfully. Pre-visit AI summary is currently unavailable."
          : "Appointment booked successfully."
      );

      await fetchAppointments();
    } catch (error) {
      console.error("Confirm appointment error:", error);
      setMessage(error.message);

      const lower = error.message.toLowerCase();

      if (
        lower.includes("expired") ||
        lower.includes("already") ||
        lower.includes("hold")
      ) {
        setSelectedSlot(null);
        setSlotHoldId(null);
        setHoldExpiresAt(null);
        await fetchAvailableSlots();
      }
    } finally {
      setBookingLoading(false);
    }
  };


  // ======================================================
  // DOCTOR CONSULTATION
  // ======================================================

  const saveConsultation = async () => {

    if (!selectedDoctorAppointment) return false;

    if (!consultationNotes.trim()) {
      setMessage("Consultation notes are required.");
      return false;
    }

    setConsultationLoading(true);
    setMessage("");

    try {

      const hasPrescription =
        medicineName.trim() ||
        dosage.trim() ||
        frequency.trim() ||
        duration.trim() ||
        startDate;

      const body = {
        consultationNotes: consultationNotes.trim()
      };

      if (hasPrescription) {
        if (
          !medicineName.trim() ||
          !dosage.trim() ||
          !frequency.trim() ||
          !duration.trim() ||
          !startDate
        ) {
          setMessage(
            "Please complete all prescription fields or leave the prescription section empty."
          );
          setConsultationLoading(false);
          return false;
        }

        body.prescription = {
          medicineName: medicineName.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim(),
          duration: duration.trim(),
          startDate
        };
      }

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/${selectedDoctorAppointment.id}/consultation`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save consultation"
        );
      }

      setMessage("Consultation saved successfully.");

      await viewDoctorAppointment(
        selectedDoctorAppointment.id
      );

      await fetchDoctorAppointments();

      return true;

    } catch (error) {

      console.error(
        "Save consultation error:",
        error
      );

      setMessage(error.message);
      return false;

    } finally {

      setConsultationLoading(false);

    }
  };

  const completeDoctorAppointment = async () => {

    if (!selectedDoctorAppointment) return;

    if (!consultationNotes.trim()) {
      setMessage(
        "Please enter consultation notes before completing the appointment."
      );
      return;
    }

    setConsultationLoading(true);
    setMessage("");

    try {

      // Save the current consultation data first.
      const saved = await saveConsultation();

      if (!saved) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/${selectedDoctorAppointment.id}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to complete appointment"
        );
      }

      setMessage(
        data.aiStatus === "COMPLETED"
          ? "Appointment completed and post-visit summary generated successfully."
          : "Appointment completed successfully. The AI post-visit summary is currently unavailable."
      );

      await viewDoctorAppointment(
        selectedDoctorAppointment.id
      );

      await fetchDoctorAppointments();

    } catch (error) {

      console.error(
        "Complete appointment error:",
        error
      );

      setMessage(error.message);

    } finally {

      setConsultationLoading(false);

    }
  };

  const loadConsultationForm = (appointment) => {

    setConsultationNotes(
      appointment.consultationNotes || ""
    );

    // Prescription fields are intentionally reset here because the
    // existing doctor-details API does not return prescription data.
    setMedicineName("");
    setDosage("");
    setFrequency("");
    setDuration("");
    setStartDate("");
  };


  // ======================================================
  // DOCTOR DASHBOARD
  // ======================================================

  const fetchDoctorAppointments = async () => {

    if (!token) return;

    setLoading(true);
    setMessage("");

    try {

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to fetch doctor appointments"
        );
      }

      setDoctorAppointments(
        data.appointments || []
      );

    } catch (error) {

      console.error(
        "Fetch doctor appointments error:",
        error
      );

      setMessage(error.message);

    } finally {

      setLoading(false);

    }
  };

  const viewDoctorAppointment = async (appointmentId) => {

    setDoctorAppointmentLoading(true);
    setMessage("");
    setSelectedDoctorAppointment(null);

    try {

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/${appointmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to fetch appointment details"
        );
      }

      setSelectedDoctorAppointment(
        data.appointment
      );

      loadConsultationForm(data.appointment);

      setTimeout(() => {
        doctorAppointmentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);

    } catch (error) {

      console.error(
        "Doctor appointment details error:",
        error
      );

      setMessage(error.message);

    } finally {

      setDoctorAppointmentLoading(false);

    }
  };

  const doctorLogout = () => {
    setToken(null);
    setUser(null);
    setDoctorAppointments([]);
    setSelectedDoctorAppointment(null);
    setEmail("");
    setPassword("");
    setLoginMode(null);
    setMessage("");
  };


  // ======================================================
  // VIEW POST-VISIT SUMMARY
  // ======================================================

  const viewPostVisitSummary = async (
    appointmentId
  ) => {

    console.log(
      "================================"
    );

    console.log(
      "CLICKED APPOINTMENT ID:",
      appointmentId
    );

    console.log(
      "================================"
    );


    setLoading(true);
    setMessage("");

    // Clear previous details
    setSelectedAppointment(null);

    setSelectedAppointmentId(
      appointmentId
    );


    try {

      const response = await fetch(
        `${API_URL}/api/appointments/patient/${appointmentId}/post-visit-summary`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      const data = await response.json();


      console.log(
        "API RETURNED ID:",
        data?.appointment?.id
      );

      console.log(
        "API RETURNED NOTES:",
        data?.appointment?.consultationNotes
      );

      console.log(
        "API RETURNED PRESCRIPTION:",
        data?.appointment?.prescription
      );


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to fetch post-visit summary"
        );

      }


      // Make sure the API returned
      // the appointment we clicked.

      if (
        data.appointment.id !== appointmentId
      ) {

        console.error(
          "WRONG APPOINTMENT RETURNED!"
        );

        console.error(
          "Clicked:",
          appointmentId
        );

        console.error(
          "Returned:",
          data.appointment.id
        );

        throw new Error(
          "Wrong appointment data was returned."
        );

      }


      setSelectedAppointment(
        data.appointment
      );


      // Automatically scroll to
      // post-visit details.

      setTimeout(() => {

        postVisitRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }, 150);


    } catch (error) {

      console.error(
        "Post-visit error:",
        error
      );

      setMessage(
        error.message
      );

    } finally {

      setLoading(false);

    }

  };

  const cancelAppointment = async (appointmentId) => {

  const confirmed = window.confirm(
    "Are you sure you want to cancel this appointment?"
  );

  if (!confirmed) {
    return;
  }

  setLoading(true);
  setMessage("");

  try {

    const response = await fetch(
      `${API_URL}/api/appointments/${appointmentId}/cancel`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Unable to cancel appointment"
      );
    }

    setMessage(
      "Appointment cancelled successfully."
    );

    // Refresh appointment list
    await fetchAppointments();

  } catch (error) {

    console.error(
      "Cancel appointment error:",
      error
    );

    setMessage(error.message);

  } finally {

    setLoading(false);

  }
};


  // ======================================================
  // RESCHEDULE APPOINTMENT
  // ======================================================

  const openReschedule = (appointment) => {
    setReschedulingAppointmentId(appointment.id);
    setRescheduleDate("");
    setAvailableSlots([]);
    setSelectedRescheduleSlot(null);
    setMessage("");
  };

  const closeReschedule = () => {
    setReschedulingAppointmentId(null);
    setRescheduleDate("");
    setAvailableSlots([]);
    setSelectedRescheduleSlot(null);
  };

  const fetchRescheduleSlots = async (appointment, date) => {
    if (!date) {
      setAvailableSlots([]);
      setSelectedRescheduleSlot(null);
      return;
    }

    setRescheduleLoading(true);
    setMessage("");
    setSelectedRescheduleSlot(null);

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/doctors/${appointment.doctorId}/slots?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch available slots"
        );
      }

      setAvailableSlots(
        (data.slots || []).filter((slot) => slot.available)
      );
    } catch (error) {
      console.error(
        "Fetch reschedule slots error:",
        error
      );

      setMessage(error.message);
      setAvailableSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const confirmReschedule = async () => {
    if (!reschedulingAppointmentId) {
      return;
    }

    if (!selectedRescheduleSlot) {
      setMessage("Please select a new time slot.");
      return;
    }

    setRescheduleLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/${reschedulingAppointmentId}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newStartTime: selectedRescheduleSlot.startTime,
            newEndTime: selectedRescheduleSlot.endTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reschedule appointment"
        );
      }

      closeReschedule();

      setMessage(
        "Appointment rescheduled successfully."
      );

      await fetchAppointments();
    } catch (error) {
      console.error(
        "Reschedule appointment error:",
        error
      );

      setMessage(error.message);
    } finally {
      setRescheduleLoading(false);
    }
  };


  // ======================================================
  // LOGOUT
  // ======================================================

  const logout = () => {

  setToken(null);
  setUser(null);

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  setAppointments([]);

  setSelectedAppointment(null);
  setSelectedAppointmentId(null);

  setEmail("");
  setPassword("");
  setMessage("");
};


  // ======================================================
  // LOGIN SCREEN
  // ======================================================

  if (!token) {

    // ====================================================
    // PORTAL SELECTION
    // ====================================================

    if (!loginMode) {

      return (

        <div className="portal-page">

          <div className="portal-decoration portal-decoration-left" />
          <div className="portal-decoration portal-decoration-right" />

          <div className="portal-content">

            <div className="portal-hero">

              <div className="health-icon">
                <span>♡</span>
                <span className="heartbeat">⌁</span>
              </div>

              <h1>
                Healthcare <span>Portal</span>
              </h1>

              <p>
                Choose your login portal to continue
              </p>

            </div>

            <div className="portal-container">

              <div className="portal-options">

                <button
                  type="button"
                  className="portal-button patient-portal"
                  onClick={() => {
                    setLoginMode("PATIENT");
                    setMessage("");
                  }}
                >
                  <div className="portal-icon patient-icon">
                    ♙
                  </div>

                  <span className="portal-title">
                    Patient Login
                  </span>

                  <span className="portal-line" />

                  <span className="portal-description">
                    Book appointments, view your
                    <br />
                    schedule and manage your health.
                  </span>

                  <span className="portal-action">
                    Continue
                    <span>→</span>
                  </span>

                </button>

                <button
                  type="button"
                  className="portal-button doctor-portal"
                  onClick={() => {
                    setLoginMode("DOCTOR");
                    setMessage("");
                  }}
                >
                  <div className="portal-icon doctor-icon">
                    ♙
                  </div>

                  <span className="portal-title">
                    Doctor Login
                  </span>

                  <span className="portal-line" />

                  <span className="portal-description">
                    Manage patients, consultations
                    <br />
                    and appointments.
                  </span>

                  <span className="portal-action">
                    Continue
                    <span>→</span>
                  </span>

                </button>

                <button
  type="button"
  className="portal-button admin-portal"
  onClick={() => {
    setLoginMode("ADMIN");
    setMessage("");
  }}
>
  <div className="portal-icon admin-icon">
    ⚙
  </div>

  <span className="portal-title">
    Admin Login
  </span>

  <span className="portal-line" />

  <span className="portal-description">
    Manage doctors, schedules
    <br />
    and healthcare operations.
  </span>

  <span className="portal-action">
    Continue
    <span>→</span>
  </span>
</button>

              </div>

            </div>

            <div className="portal-trust">

              <div className="shield-icon">
                ✓
              </div>

              <div>
                <strong>Your health. Our priority.</strong>
                <span>Secure • Reliable • Trusted</span>
              </div>

            </div>

          </div>

        </div>

      );

    }

    // ====================================================
    // DEDICATED PATIENT / DOCTOR LOGIN
    // ====================================================

    const isDoctorLogin = loginMode === "DOCTOR";
    const isAdminLogin = loginMode === "ADMIN";

    return (

      <div className="app">

        <div className="login-card">

          <h1>
  {isDoctorLogin
    ? "Doctor Login"
    : isAdminLogin
      ? "Admin Login"
      : "Patient Login"}
</h1>

          <p className="subtitle">
  {isDoctorLogin
    ? "Access your doctor dashboard"
    : isAdminLogin
      ? "Access your admin dashboard"
      : "Access your patient dashboard"}
</p>

          <form onSubmit={handleLogin}>

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <button
            type="button"
            className="portal-back-button"
            onClick={() => {
              setLoginMode(null);
              setEmail("");
              setPassword("");
              setMessage("");
            }}
          >
            ← Back to Portal Selection
          </button>

        </div>

      </div>

    );

  }


  // ======================================================
  // ADMIN DASHBOARD
  // ======================================================

  if (user?.role === "ADMIN") {
    return (
      <div className="app">
        <div className="dashboard">

          <div className="header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage doctors and healthcare operations.</p>
            </div>

            <button className="logout" onClick={logout}>
              Logout
            </button>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-label">Total Doctors</div>
              <div className="stat-number">
                {adminDoctors.length}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Portal Role</div>
              <div className="stat-number">
                ADMIN
              </div>
            </div>
          </div>

          <div className="appointments-section">
            <div className="section-header">
              <div>
                <h2>Create Doctor</h2>
                <p>Add a doctor account and configure working hours.</p>
              </div>

              <button
                className="refresh"
                onClick={fetchAdminDoctors}
                disabled={adminLoading}
              >
                Refresh Doctors
              </button>
            </div>

            <form
              className="booking-form-grid"
              onSubmit={createDoctorFromAdmin}
            >
              <div>
                <label className="booking-label">Doctor Name</label>
                <input
                  className="booking-date"
                  type="text"
                  value={adminDoctorName}
                  onChange={(e) => setAdminDoctorName(e.target.value)}
                  placeholder="Dr. John Doe"
                  required
                />
              </div>

              <div>
                <label className="booking-label">Email</label>
                <input
                  className="booking-date"
                  type="email"
                  value={adminDoctorEmail}
                  onChange={(e) => setAdminDoctorEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  required
                />
              </div>

              <div>
                <label className="booking-label">Password</label>
                <input
                  className="booking-date"
                  type="password"
                  value={adminDoctorPassword}
                  onChange={(e) => setAdminDoctorPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="booking-label">Specialization</label>
                <input
                  className="booking-date"
                  type="text"
                  value={adminSpecialization}
                  onChange={(e) => setAdminSpecialization(e.target.value)}
                  placeholder="Cardiology"
                  required
                />
              </div>

              <div>
                <label className="booking-label">Working Start</label>
                <input
                  className="booking-date"
                  type="time"
                  value={adminWorkingStart}
                  onChange={(e) => setAdminWorkingStart(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="booking-label">Working End</label>
                <input
                  className="booking-date"
                  type="time"
                  value={adminWorkingEnd}
                  onChange={(e) => setAdminWorkingEnd(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="booking-label">Slot Duration</label>
                <select
                  className="booking-select"
                  value={adminSlotDuration}
                  onChange={(e) => setAdminSlotDuration(e.target.value)}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div className="booking-actions">
                <button
                  type="submit"
                  className="confirm-booking-button"
                  disabled={adminLoading}
                >
                  {adminLoading ? "Creating..." : "Create Doctor"}
                </button>
              </div>
            </form>
          </div>

          <div className="appointments-section">
            <div className="section-header">
              <div>
                <h2>Doctors</h2>
                <p>All doctor accounts registered in the system.</p>
              </div>
            </div>

            {adminDoctors.length === 0 ? (
              <div className="empty-category">
                No doctors found.
              </div>
            ) : (
              <div className="appointment-list">
                {adminDoctors.map((doctor) => (
                  <div className="appointment-card" key={doctor.id}>
                    <div className="appointment-top">
                      <div>
                        <h3>{doctor.user?.name}</h3>
                        <p className="specialization">
                          {doctor.specialization}
                        </p>
                      </div>

                      <span className="status confirmed">
                        DOCTOR
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div>
                        <strong>Email</strong>
                        <span>{doctor.user?.email}</span>
                      </div>
                      <div>
                        <strong>Working Hours</strong>
                        <span>
                          {doctor.workingStart} - {doctor.workingEnd}
                        </span>
                      </div>
                      <div>
                        <strong>Slot</strong>
                        <span>{doctor.slotDuration} min</span>
                      </div>
                    </div>
                    <div className="doctor-leave-section">

  <h4>Mark Doctor on Leave</h4>

  <div className="doctor-leave-form">

    <div>
      <label className="booking-label">
        Leave Date
      </label>

      <input
        className="booking-date"
        type="date"
        value={leaveDates[doctor.id] || ""}
        min={new Date().toISOString().split("T")[0]}
        onChange={(e) =>
          setLeaveDates((prev) => ({
            ...prev,
            [doctor.id]: e.target.value
          }))
        }
      />
    </div>


    <div>
      <label className="booking-label">
        Reason
      </label>

      <input
        className="booking-date"
        type="text"
        placeholder="Optional reason"
        value={leaveReasons[doctor.id] || ""}
        onChange={(e) =>
          setLeaveReasons((prev) => ({
            ...prev,
            [doctor.id]: e.target.value
          }))
        }
      />
    </div>


    <div className="doctor-leave-action">

      <button
        type="button"
        className="leave-button"
        onClick={() =>
          markDoctorLeave(doctor.id)
        }
        disabled={
          adminLoading ||
          !leaveDates[doctor.id]
        }
      >
        {adminLoading
          ? "Processing..."
          : "Mark Leave"}
      </button>

    </div>

  </div>

</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {message && (
            <div className="message">{message}</div>
          )}

        </div>
      </div>
    );
  }

  // ======================================================
  // DOCTOR DASHBOARD
  // ======================================================

  if (user?.role === "DOCTOR") {

    const today = new Date();

    const doctorUpcomingAppointments =
      doctorAppointments.filter(
        (appointment) =>
          appointment.status === "CONFIRMED" &&
          new Date(appointment.startTime) >= today
      );

    const doctorCompletedAppointments =
      doctorAppointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED"
      );


    const doctorCancelledAppointments =
      doctorAppointments.filter(
        (appointment) =>
          appointment.status === "CANCELLED" ||
          appointment.status === "CANCELLED_BY_DOCTOR"
      );
    const doctorRescheduledAppointments =
  doctorAppointments.filter(
    (appointment) =>
      appointment.status === "RESCHEDULED"
  );

    return (

      <div className="app">

        <div className="dashboard">

          <div className="header">

            <div>

              <h1>
                Doctor Dashboard
              </h1>

              <p>
                Manage your appointments and patient consultations
              </p>

            </div>

            <button
              className="logout"
              onClick={doctorLogout}
            >
              Logout
            </button>

          </div>

          <div className="dashboard-stats">

            <div className="stat-card">
              <div className="stat-label">
                Total Appointments
              </div>
              <div className="stat-number">
                {doctorAppointments.length}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Upcoming
              </div>
              <div className="stat-number">
                {doctorUpcomingAppointments.length}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Completed
              </div>
              <div className="stat-number">
                {doctorCompletedAppointments.length}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">
                Cancelled
              </div>
              <div className="stat-number">
                {doctorCancelledAppointments.length}
              </div>
            </div>

          </div>

          <div className="appointments-section">

            <div className="section-header">

              <div>
                <h2>My Appointments</h2>
                <p>
                  View your scheduled patient appointments.
                </p>
              </div>

              {calendarConnected ? (
  <button
    className="calendar-button connected"
    disabled
  >
    ✓ Google Calendar Connected
  </button>
) : (
  <button
    className="calendar-button"
    onClick={() => {
      window.location.href =
        `${API_URL}/api/calendar/connect-browser?token=${encodeURIComponent(token)}`;
    }}
  >
    📅 Connect Google Calendar
  </button>
)}

              <button
                className="refresh"
                onClick={fetchDoctorAppointments}
                disabled={loading}
              >
                Refresh
              </button>

            </div>

            {loading && (
              <p className="loading">
                Loading appointments...
              </p>
            )}

            <div className="appointment-category">

              <div className="category-title">
                <h2>Upcoming Appointments</h2>
                <span>
                  {doctorUpcomingAppointments.length}
                </span>
              </div>

              {doctorUpcomingAppointments.length === 0 ? (

                <div className="empty-category">
                  No upcoming appointments.
                </div>

              ) : (

                <div className="appointment-list">

                  {doctorUpcomingAppointments.map(
                    (appointment) => (

                      <div
                        className="appointment-card"
                        key={appointment.id}
                      >

                        <div className="appointment-top">

                          <div>

                            <h3>
                              {appointment.patient.name}
                            </h3>

                            <p className="specialization">
                              {appointment.patient.email}
                            </p>

                          </div>

                          <span className="status confirmed">
                            CONFIRMED
                          </span>

                        </div>

                        <div className="appointment-details">

                          <div>
                            <strong>Date</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <strong>Start</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          <div>
                            <strong>End</strong>
                            <span>
                              {new Date(
                                appointment.endTime
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                        </div>

                        {appointment.symptoms && (

                          <div className="symptoms">

                            <strong>
                              Symptoms:
                            </strong>

                            <p>
                              {appointment.symptoms}
                            </p>

                          </div>

                        )}

                        <div className="appointment-actions">

                          <button
                            className="post-visit-button"
                            onClick={() =>
                              viewDoctorAppointment(
                                appointment.id
                              )
                            }
                          >
                            Open Appointment
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            <div className="appointment-category">

              <div className="category-title">
                <h2>Completed Appointments</h2>
                <span>
                  {doctorCompletedAppointments.length}
                </span>
              </div>

              {doctorCompletedAppointments.length === 0 ? (

                <div className="empty-category">
                  No completed appointments.
                </div>

              ) : (

                <div className="appointment-list">

                  {doctorCompletedAppointments.map(
                    (appointment) => (

                      <div
                        className="appointment-card"
                        key={appointment.id}
                      >

                        <div className="appointment-top">

                          <div>

                            <h3>
                              {appointment.patient.name}
                            </h3>

                            <p className="specialization">
                              {appointment.patient.email}
                            </p>

                          </div>

                          <span className="status completed">
                            COMPLETED
                          </span>

                        </div>

                        <div className="appointment-details">

                          <div>
                            <strong>Date</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <strong>Time</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                        </div>

                        <button
                          className="post-visit-button"
                          onClick={() =>
                            viewDoctorAppointment(
                              appointment.id
                            )
                          }
                        >
                          View Appointment
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            <div className="appointment-category">

  <div className="category-title">
    <h2>Rescheduled Appointments</h2>

    <span>
      {doctorRescheduledAppointments.length}
    </span>
  </div>

  {doctorRescheduledAppointments.length === 0 ? (

    <div className="empty-category">
      No rescheduled appointments.
    </div>

  ) : (

    <div className="appointment-list">

      {doctorRescheduledAppointments.map(
        (appointment) => (

          <div
            className="appointment-card"
            key={appointment.id}
          >

            <div className="appointment-top">

              <div>

                <h3>
                  {appointment.patient.name}
                </h3>

                <p className="specialization">
                  {appointment.patient.email}
                </p>

              </div>

              <span className="status rescheduled">
                RESCHEDULED
              </span>

            </div>

            <div className="appointment-details">

              <div>
                <strong>Previous Date</strong>

                <span>
                  {new Date(
                    appointment.startTime
                  ).toLocaleDateString()}
                </span>
              </div>

              <div>
                <strong>Previous Time</strong>

                <span>
                  {new Date(
                    appointment.startTime
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                  })}
                  {" - "}
                  {new Date(
                    appointment.endTime
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              <div>
                <strong>Status</strong>

                <span>
                  Appointment rescheduled
                </span>
              </div>

            </div>

          </div>

        )
      )}

    </div>

  )}

</div>

            <div className="appointment-category">

              <div className="category-title">
                <h2>Cancelled Appointments</h2>
                <span>
                  {doctorCancelledAppointments.length}
                </span>
              </div>

              {doctorCancelledAppointments.length === 0 ? (

                <div className="empty-category">
                  No cancelled appointments.
                </div>

              ) : (

                <div className="appointment-list">

                  {doctorCancelledAppointments.map(
                    (appointment) => (

                      <div
                        className="appointment-card cancelled-card"
                        key={appointment.id}
                      >

                        <div className="appointment-top">

                          <div>
                            <h3>
                              {appointment.patient.name}
                            </h3>

                            <p className="specialization">
                              {appointment.patient.email}
                            </p>
                          </div>

                          <span
                            className={`status ${
                              appointment.status.toLowerCase()
                            }`}
                          >
                            {appointment.status}
                          </span>

                        </div>

                        <div className="appointment-details">

                          <div>
                            <strong>Date</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <strong>Time</strong>
                            <span>
                              {new Date(
                                appointment.startTime
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          {selectedDoctorAppointment && (

            <div
              className="post-visit"
              ref={doctorAppointmentRef}
            >

              <div className="post-visit-header">

                <div>

                  <h2>
                    Appointment Details
                  </h2>

                  <p>
                    Patient:{" "}
                    {selectedDoctorAppointment.patient.name}
                  </p>

                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setSelectedDoctorAppointment(null)
                  }
                >
                  Close
                </button>

              </div>

              <div className="detail-card">

                <h3>
                  Appointment Information
                </h3>

                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(
                    selectedDoctorAppointment.startTime
                  ).toLocaleDateString()}
                </p>

                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(
                    selectedDoctorAppointment.startTime
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {new Date(
                    selectedDoctorAppointment.endTime
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {selectedDoctorAppointment.status}
                </p>

              </div>

              <div className="detail-card">

                <h3>
                  Patient Symptoms
                </h3>

                <p>
                  {selectedDoctorAppointment.symptoms ||
                    "No symptoms provided."}
                </p>

              </div>

              <div className="detail-card">

                <h3>
                  AI Summary
                </h3>

                <p>
                  {typeof selectedDoctorAppointment.aiSummary ===
                  "string"
                    ? selectedDoctorAppointment.aiSummary
                    : "AI summary is currently unavailable."}
                </p>

              </div>

              <div className="detail-card consultation-card">

                <h3>
                  Consultation
                </h3>

                <p className="consultation-help">
                  {selectedDoctorAppointment.status === "CONFIRMED"
                    ? "Add your clinical notes and, if required, prescribe medication for this patient."
                    : "This appointment is completed. Consultation details and prescription are read-only."}
                </p>

                <label className="consultation-label">
                  Consultation Notes *
                </label>

                <textarea
                  className="consultation-textarea"
                  value={consultationNotes}
                  onChange={(e) =>
                    setConsultationNotes(e.target.value)
                  }
                  placeholder="Enter consultation findings, diagnosis, advice, follow-up instructions, etc."
                  disabled={
                    consultationLoading ||
                    selectedDoctorAppointment.status !== "CONFIRMED"
                  }
                />

                <div className="prescription-section">

                  <h4>
                    Prescription (Optional)
                  </h4>

                  <p className="consultation-help">
                    Leave this section empty if no medicine is prescribed.
                  </p>

                  <div className="prescription-grid">

                    <div>
                      <label className="consultation-label">
                        Medicine Name
                      </label>

                      <input
                        type="text"
                        value={medicineName}
                        onChange={(e) =>
                          setMedicineName(e.target.value)
                        }
                        placeholder="e.g. Paracetamol"
                        disabled={
                          consultationLoading ||
                          selectedDoctorAppointment.status !== "CONFIRMED"
                        }
                      />
                    </div>

                    <div>
                      <label className="consultation-label">
                        Dosage
                      </label>

                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) =>
                          setDosage(e.target.value)
                        }
                        placeholder="e.g. 500 mg"
                        disabled={
                          consultationLoading ||
                          selectedDoctorAppointment.status !== "CONFIRMED"
                        }
                      />
                    </div>

                    <div>
                      <label className="consultation-label">
                        Frequency
                      </label>

                      <input
                        type="text"
                        value={frequency}
                        onChange={(e) =>
                          setFrequency(e.target.value)
                        }
                        placeholder="e.g. Twice daily"
                        disabled={
                          consultationLoading ||
                          selectedDoctorAppointment.status !== "CONFIRMED"
                        }
                      />
                    </div>

                    <div>
                      <label className="consultation-label">
                        Duration
                      </label>

                      <input
                        type="text"
                        value={duration}
                        onChange={(e) =>
                          setDuration(e.target.value)
                        }
                        placeholder="e.g. 5 days"
                        disabled={
                          consultationLoading ||
                          selectedDoctorAppointment.status !== "CONFIRMED"
                        }
                      />
                    </div>

                    <div>
                      <label className="consultation-label">
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate(e.target.value)
                        }
                        disabled={
                          consultationLoading ||
                          selectedDoctorAppointment.status !== "CONFIRMED"
                        }
                      />
                    </div>

                  </div>

                </div>

                <div className="consultation-actions">

                  {selectedDoctorAppointment.status === "CONFIRMED" && (
                    <>
                      <button
                        className="save-consultation-button"
                        onClick={saveConsultation}
                        disabled={consultationLoading}
                      >
                        {consultationLoading
                          ? "Saving..."
                          : "Save Consultation"}
                      </button>

                      <button
                        className="complete-appointment-button"
                        onClick={completeDoctorAppointment}
                        disabled={consultationLoading}
                      >
                        {consultationLoading
                          ? "Processing..."
                          : "Complete Appointment"}
                      </button>
                    </>
                  )}

                  {selectedDoctorAppointment.status === "COMPLETED" && (
                    <div className="completed-consultation-note">
                      This appointment is completed and is now read-only.
                    </div>
                  )}

                </div>

              </div>

              <div className="detail-card ai-summary">

                <h3>
                  Post-Visit AI Summary
                </h3>

                <p>
                  {selectedDoctorAppointment.postVisitSummary
                    ? selectedDoctorAppointment.postVisitSummary
                    : selectedDoctorAppointment.status === "COMPLETED"
                      ? "The appointment was completed, but the AI post-visit summary is currently unavailable. This may happen if the AI service quota has been exceeded."
                      : "The post-visit summary will be generated when the appointment is completed."}
                </p>

              </div>

            </div>

          )}

          {doctorAppointmentLoading && (
            <p className="loading">
              Loading appointment details...
            </p>
          )}

        </div>

      </div>

    );
  }

  // ======================================================
  // PATIENT DASHBOARD
  // ======================================================

  if (user?.role !== "PATIENT") {
    return (
      <div className="app">
        <div className="login-card">
          <h1>Healthcare Portal</h1>
          <p className="message">
            This account does not have access to this dashboard.
          </p>
          <button onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="app">

      <div className="dashboard">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="header">

          <div>

            <h1>
              Patient Dashboard
            </h1>

            <p>
              Manage your appointments and
              post-visit information
            </p>

          </div>


          <button
            className="logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>
        {/* =================================================
    DASHBOARD SUMMARY
================================================= */}

<div className="dashboard-stats">

  <div className="stat-card">

    <div className="stat-label">
      Total Appointments
    </div>

    <div className="stat-number">
      {appointments.length}
    </div>

  </div>


  <div className="stat-card">

    <div className="stat-label">
      Upcoming
    </div>

    <div className="stat-number">
      {upcomingAppointments.length}
    </div>

  </div>


  <div className="stat-card">

    <div className="stat-label">
      Completed
    </div>

    <div className="stat-number">
      {completedAppointments.length}
    </div>

  </div>


  <div className="stat-card">

    <div className="stat-label">
      Cancelled
    </div>

    <div className="stat-number">
      {cancelledAppointments.length}
    </div>

  </div>

</div>


        {/* =================================================
            APPOINTMENTS
        ================================================= */}

        <div className="appointments-section">

          <div className="section-header">

            <div>

              <h2>
                My Appointments
              </h2>

              <p>
                View and manage your appointments.
              </p>

            </div>

            <div className="patient-header-actions">

              <button
                className="book-appointment-button"
                onClick={openBooking}
                disabled={bookingLoading}
              >
                + Book New Appointment
              </button>
              {calendarConnected ? (
  <button
    className="calendar-button connected"
    disabled
  >
    ✓ Google Calendar Connected
  </button>
) : (
  <button
    className="calendar-button"
    onClick={() => {
      window.location.href =
        `${API_URL}/api/calendar/connect-browser?token=${encodeURIComponent(token)}`;
    }}
  >
    📅 Connect Google Calendar
  </button>
)}

              <button
                className="refresh"
                onClick={fetchAppointments}
              >
                Refresh
              </button>

            </div>

          </div>


          {showBooking && (

            <div className="booking-panel">

              <div className="booking-panel-header">

                <div>
                  <h2>Book New Appointment</h2>
                  <p>
                    Select a doctor, date and available time slot.
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={closeBooking}
                  disabled={bookingLoading}
                >
                  Close
                </button>

              </div>

              <div className="booking-form-grid">

                <div>
                  <label className="booking-label">
                    Doctor
                  </label>

                  <select
                    className="booking-select"
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setAvailableSlots([]);
                      setSelectedSlot(null);
                      setSlotHoldId(null);
                      setHoldExpiresAt(null);
                      setMessage("");
                    }}
                    disabled={bookingLoading}
                  >
                    <option value="">
                      Select a doctor
                    </option>

                    {doctors.map((doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.user?.name || doctor.name}
                        {doctor.specialization
                          ? ` - ${doctor.specialization}`
                          : ""}
                      </option>
                    ))}

                  </select>
                </div>

                <div>
                  <label className="booking-label">
                    Date
                  </label>

                  <input
                    className="booking-date"
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setAvailableSlots([]);
                      setSelectedSlot(null);
                      setSlotHoldId(null);
                      setHoldExpiresAt(null);
                      setMessage("");
                    }}
                    disabled={
                      bookingLoading ||
                      !selectedDoctorId
                    }
                  />
                </div>

              </div>

              {selectedDoctorId && bookingDate && (

                <div className="slots-section">

                  <div className="booking-subheading">
                    Available Slots
                  </div>

                  {bookingLoading && (
                    <p className="loading">
                      Loading...
                    </p>
                  )}

                  {!bookingLoading &&
                    availableSlots.length === 0 && (
                      <div className="empty-category">
                        No slots available for the selected date.
                      </div>
                    )}

                  <div className="slot-grid">

                    {availableSlots.map((slot) => {

                      const slotTime =
                        new Date(slot.startTime).toLocaleTimeString(
                          [],
                          {
                            hour: "numeric",
                            minute: "2-digit"
                          }
                        );

                      const isSelected =
                        selectedSlot?.startTime === slot.startTime;

                      return (
                        <button
                          type="button"
                          key={slot.startTime}
                          className={`slot-button ${
                            isSelected ? "slot-selected" : ""
                          } ${
                            !slot.available
                              ? "slot-unavailable"
                              : ""
                          }`}
                          disabled={
                            !slot.available ||
                            bookingLoading
                          }
                          onClick={() =>
                            holdSelectedSlot(slot)
                          }
                        >
                          {slotTime}
                        </button>
                      );
                    })}

                  </div>

                </div>
              )}

              {selectedSlot && slotHoldId && (

                <div className="selected-slot-box">

                  <strong>
                    Selected Slot
                  </strong>

                  <span>
                    {new Date(
                      selectedSlot.startTime
                    ).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(
                      selectedSlot.startTime
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "numeric",
                        minute: "2-digit"
                      }
                    )}
                  </span>

                  {holdExpiresAt && (
                    <small>
                      Your slot is temporarily held until{" "}
                      {new Date(
                        holdExpiresAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute: "2-digit"
                        }
                      )}.
                    </small>
                  )}

                </div>
              )}

              <div className="booking-symptoms">

                <label className="booking-label">
                  Symptoms / Reason for Visit
                </label>

                <textarea
                  className="booking-textarea"
                  value={bookingSymptoms}
                  onChange={(e) =>
                    setBookingSymptoms(e.target.value)
                  }
                  placeholder="Briefly describe your symptoms or reason for the appointment..."
                  disabled={
                    bookingLoading ||
                    !selectedSlot ||
                    !slotHoldId
                  }
                />

              </div>

              <div className="booking-actions">

                <button
                  className="cancel-button"
                  onClick={closeBooking}
                  disabled={bookingLoading}
                >
                  Cancel
                </button>

                <button
                  className="confirm-booking-button"
                  onClick={confirmNewAppointment}
                  disabled={
                    bookingLoading ||
                    !slotHoldId
                  }
                >
                  {bookingLoading
                    ? "Processing..."
                    : "Confirm Appointment"}
                </button>

              </div>

            </div>
          )}

          {loading && (

            <p className="loading">
              Loading...
            </p>

          )}


          {/* =================================================
              UPCOMING APPOINTMENTS
          ================================================= */}

          <div className="appointment-category">

            <div className="category-title">

              <h2>
                Upcoming Appointments
              </h2>

              <span>
                {upcomingAppointments.length}
              </span>

            </div>


            {upcomingAppointments.length === 0 ? (

              <div className="empty-category">

                No upcoming appointments.

              </div>

            ) : (

              <div className="appointment-list">

                {upcomingAppointments.map(
                  (appointment) => (

                    <div
                      className="appointment-card"
                      key={appointment.id}
                    >

                      <div className="appointment-top">

                        <div>

                          <h3>
                            {appointment.doctor.user.name}
                          </h3>

                          <p className="specialization">

                            {
                              appointment.doctor
                                .specialization
                            }

                          </p>

                        </div>


                        <span className="status confirmed">

                          CONFIRMED

                        </span>

                      </div>


                      <div className="appointment-details">

                        <div>

                          <strong>
                            Date
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleDateString()}

                          </span>

                        </div>


                        <div>

                          <strong>
                            Start
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>


                        <div>

                          <strong>
                            End
                          </strong>

                          <span>

                            {new Date(
                              appointment.endTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>

                      </div>


                      {appointment.symptoms && (

                        <div className="symptoms">

                          <strong>
                            Symptoms:
                          </strong>

                          <p>
                            {appointment.symptoms}
                          </p>

                        </div>

                      )}
                      <div className="appointment-actions">

                        <button
                          className="reschedule-button"
                          onClick={() =>
                            openReschedule(appointment)
                          }
                        >
                          Reschedule Appointment
                        </button>

                        <button
                          className="cancel-button"
                          onClick={() =>
                            cancelAppointment(appointment.id)
                          }
                        >
                          Cancel Appointment
                        </button>

                      </div>

                      {reschedulingAppointmentId === appointment.id && (

                        <div className="reschedule-panel">

                          <h3>
                            Reschedule Appointment
                          </h3>

                          <p>
                            Current appointment:{" "}
                            {new Date(
                              appointment.startTime
                            ).toLocaleDateString()}
                            {" • "}
                            {new Date(
                              appointment.startTime
                            ).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>

                          <div className="reschedule-date">

                            <label>
                              Select New Date
                            </label>

                            <input
                              type="date"
                              value={rescheduleDate}
                              min={
                                new Date()
                                  .toISOString()
                                  .split("T")[0]
                              }
                              onChange={(e) => {
                                const date = e.target.value;

                                setRescheduleDate(date);

                                fetchRescheduleSlots(
                                  appointment,
                                  date
                                );
                              }}
                            />

                          </div>

                          {rescheduleLoading && (
                            <p className="loading">
                              Loading available slots...
                            </p>
                          )}

                          {rescheduleDate &&
                            !rescheduleLoading && (

                              <div className="reschedule-slots">

                                <h4>
                                  Available Slots
                                </h4>

                                {availableSlots.length === 0 ? (

                                  <p>
                                    No available slots for this date.
                                  </p>

                                ) : (

                                  <div className="slot-grid">

                                    {availableSlots.map(
                                      (slot) => (

                                        <button
                                          key={slot.startTime}
                                          type="button"
                                          className={
                                            selectedRescheduleSlot?.startTime ===
                                            slot.startTime
                                              ? "slot-button selected"
                                              : "slot-button"
                                          }
                                          onClick={() =>
                                            setSelectedRescheduleSlot(
                                              slot
                                            )
                                          }
                                        >
                                          {new Date(
                                            slot.startTime
                                          ).toLocaleTimeString(
                                            [],
                                            {
                                              hour: "numeric",
                                              minute: "2-digit",
                                            }
                                          )}
                                        </button>

                                      )
                                    )}

                                  </div>

                                )}

                              </div>

                            )}

                          {selectedRescheduleSlot && (

                            <p className="selected-slot">

                              Selected:{" "}
                              {new Date(
                                selectedRescheduleSlot.startTime
                              ).toLocaleDateString()}
                              {" • "}
                              {new Date(
                                selectedRescheduleSlot.startTime
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}

                            </p>

                          )}

                          <div className="reschedule-actions">

                            <button
                              className="confirm-reschedule-button"
                              onClick={confirmReschedule}
                              disabled={
                                rescheduleLoading ||
                                !selectedRescheduleSlot
                              }
                            >
                              {rescheduleLoading
                                ? "Rescheduling..."
                                : "Confirm Reschedule"}
                            </button>

                            <button
                              className="close-reschedule-button"
                              onClick={closeReschedule}
                              disabled={rescheduleLoading}
                            >
                              Close
                            </button>

                          </div>

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* =================================================
              COMPLETED APPOINTMENTS
          ================================================= */}

          <div className="appointment-category">

            <div className="category-title">

              <h2>
                Completed Appointments
              </h2>

              <span>
                {completedAppointments.length}
              </span>

            </div>


            {completedAppointments.length === 0 ? (

              <div className="empty-category">

                No completed appointments.

              </div>

            ) : (

              <div className="appointment-list">

                {completedAppointments.map(
                  (appointment) => (

                    <div
                      className="appointment-card"
                      key={appointment.id}
                    >

                      <div className="appointment-top">

                        <div>

                          <h3>
                            {appointment.doctor.user.name}
                          </h3>

                          <p className="specialization">

                            {
                              appointment.doctor
                                .specialization
                            }

                          </p>

                        </div>


                        <span className="status completed">

                          COMPLETED

                        </span>

                      </div>


                      <div className="appointment-details">

                        <div>

                          <strong>
                            Date
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleDateString()}

                          </span>

                        </div>


                        <div>

                          <strong>
                            Start
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>


                        <div>

                          <strong>
                            End
                          </strong>

                          <span>

                            {new Date(
                              appointment.endTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>

                      </div>


                      {appointment.symptoms && (

                        <div className="symptoms">

                          <strong>
                            Symptoms:
                          </strong>

                          <p>
                            {appointment.symptoms}
                          </p>

                        </div>

                      )}


                      <button
                        className="post-visit-button"

                        onClick={() =>
                          viewPostVisitSummary(
                            appointment.id
                          )
                        }
                      >

                        View Post-Visit Summary

                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* =================================================
    RESCHEDULED APPOINTMENTS
================================================= */}

<div className="appointment-category">

  <div className="category-title">

    <h2>
      Rescheduled Appointments
    </h2>

    <span>
      {rescheduledAppointments.length}
    </span>

  </div>

  {rescheduledAppointments.length === 0 ? (

    <div className="empty-category">
      No rescheduled appointments.
    </div>

  ) : (

    <div className="appointment-list">

      {rescheduledAppointments.map(
        (appointment) => (

          <div
            className="appointment-card"
            key={appointment.id}
          >

            <div className="appointment-top">

              <div>

                <h3>
                  {appointment.doctor.user.name}
                </h3>

                <p className="specialization">
                  {appointment.doctor.specialization}
                </p>

              </div>

              <span className="status rescheduled">
                RESCHEDULED
              </span>

            </div>


            <div className="appointment-details">

              <div>

                <strong>
                  Previous Date
                </strong>

                <span>
                  {new Date(
                    appointment.startTime
                  ).toLocaleDateString()}
                </span>

              </div>


              <div>

                <strong>
                  Previous Time
                </strong>

                <span>
                  {new Date(
                    appointment.startTime
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: "numeric",
                      minute: "2-digit"
                    }
                  )}
                  {" - "}
                  {new Date(
                    appointment.endTime
                  ).toLocaleTimeString(
                    [],
                    {
                      hour: "numeric",
                      minute: "2-digit"
                    }
                  )}
                </span>

              </div>


              <div>

                <strong>
                  Status
                </strong>

                <span>
                  Appointment rescheduled
                </span>

              </div>

            </div>


            {appointment.symptoms && (

              <div className="symptoms">

                <strong>
                  Symptoms:
                </strong>

                <p>
                  {appointment.symptoms}
                </p>

              </div>

            )}

          </div>

        )
      )}

    </div>

  )}

</div>


          {/* =================================================
              CANCELLED APPOINTMENTS
          ================================================= */}

          <div className="appointment-category">

            <div className="category-title">

              <h2>
                Cancelled Appointments
              </h2>

              <span>
                {cancelledAppointments.length}
              </span>

            </div>


            {cancelledAppointments.length === 0 ? (

              <div className="empty-category">

                No cancelled appointments.

              </div>

            ) : (

              <div className="appointment-list">

                {cancelledAppointments.map(
                  (appointment) => (

                    <div
                      className="appointment-card cancelled-card"
                      key={appointment.id}
                    >

                      <div className="appointment-top">

                        <div>

                          <h3>
                            {appointment.doctor.user.name}
                          </h3>

                          <p className="specialization">

                            {
                              appointment.doctor
                                .specialization
                            }

                          </p>

                        </div>


                        <span
                          className={`status ${
                            appointment.status.toLowerCase()
                          }`}
                        >

                          {appointment.status}

                        </span>

                      </div>


                      <div className="appointment-details">

                        <div>

                          <strong>
                            Date
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleDateString()}

                          </span>

                        </div>


                        <div>

                          <strong>
                            Time
                          </strong>

                          <span>

                            {new Date(
                              appointment.startTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}

                          </span>

                        </div>

                      </div>


                      {appointment.symptoms && (

                        <div className="symptoms">

                          <strong>
                            Symptoms:
                          </strong>

                          <p>
                            {appointment.symptoms}
                          </p>

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            ERROR / MESSAGE
        ================================================= */}

        {message && (

          <div className="message">
            {message}
          </div>

        )}


        {/* =================================================
            POST-VISIT DETAILS
        ================================================= */}

        {selectedAppointment && (

          <div
            className="post-visit"
            ref={postVisitRef}
          >


            {/* =================================================
                POST-VISIT HEADER
            ================================================= */}

            <div className="post-visit-header">

              <div>

                <h2>
                  Post-Visit Details
                </h2>

                <p>

                  {selectedAppointment.doctor.name}

                  {" • "}

                  {
                    selectedAppointment
                      .doctor
                      .specialization
                  }

                </p>

              </div>


              <button
                className="close-button"

                onClick={() => {

                  setSelectedAppointment(null);

                  setSelectedAppointmentId(null);

                }}
              >

                Close

              </button>

            </div>


            {/* =================================================
                CONSULTATION NOTES
            ================================================= */}

            <div className="detail-card">

              <h3>
                Consultation Notes
              </h3>

              <p>

                {
                  selectedAppointment
                    .consultationNotes
                    ? selectedAppointment
                        .consultationNotes
                    : "No consultation notes available."
                }

              </p>

            </div>


            {/* =================================================
                PRESCRIPTION
            ================================================= */}

            <div className="detail-card">

              <h3>
                Prescription
              </h3>


              {selectedAppointment.prescription ? (

                <div className="prescription">

                  <p>

                    <strong>
                      Medicine:
                    </strong>{" "}

                    {
                      selectedAppointment
                        .prescription
                        .medicineName
                    }

                  </p>


                  <p>

                    <strong>
                      Dosage:
                    </strong>{" "}

                    {
                      selectedAppointment
                        .prescription
                        .dosage
                    }

                  </p>


                  <p>

                    <strong>
                      Frequency:
                    </strong>{" "}

                    {
                      selectedAppointment
                        .prescription
                        .frequency
                    }

                  </p>


                  <p>

                    <strong>
                      Duration:
                    </strong>{" "}

                    {
                      selectedAppointment
                        .prescription
                        .duration
                    }

                  </p>


                  <p>

                    <strong>
                      Start Date:
                    </strong>{" "}

                    {new Date(
                      selectedAppointment
                        .prescription
                        .startDate
                    ).toLocaleDateString()}

                  </p>

                </div>

              ) : (

                <p>
                  No prescription was provided.
                </p>

              )}

            </div>


            {/* =================================================
                AI POST-VISIT SUMMARY
            ================================================= */}

            <div className="detail-card ai-summary">

              <h3>
                AI Post-Visit Summary
              </h3>

              <p>

                {
                  selectedAppointment
                    .postVisitSummary
                }

              </p>

            </div>


          </div>

        )}

      </div>

    </div>

  );

}

export default App;