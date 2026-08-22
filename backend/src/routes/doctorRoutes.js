const express = require("express");

const {
    createDoctor,
    getDoctors,
    updateDoctor
} = require("../controllers/doctorController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin creates doctor
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    createDoctor
);

// Get doctors
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN", "PATIENT", "DOCTOR"),
    getDoctors
);

router.put(
    "/:doctorId",
    authenticate,
    authorizeRoles("ADMIN"),
    updateDoctor
);

module.exports = router;