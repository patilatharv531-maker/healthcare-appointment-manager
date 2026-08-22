const express = require("express");

const {
    createDoctorLeave,
    getDoctorLeaves
} = require("../controllers/leaveController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin marks doctor on leave
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    createDoctorLeave
);

// Admin views doctor leave
router.get(
    "/doctor/:doctorId",
    authenticate,
    authorizeRoles("ADMIN", "DOCTOR"),
    getDoctorLeaves
);

module.exports = router;