const express = require("express");
const baseUpload = require("../middleware/upload");

const {
  sendOtp,
  verifyOtp,
  getEmployeeProfile,
  updateEmployeeProfile,
  uploadEmployeeDocuments,
  uploadAdminDocuments,
  getEmployeeDocuments,
  getEmployeeProfilePhoto,
  employeeCheckIn,
} = require("../controllers/employeeController");

const router = express.Router();

/* ================= MULTER INSTANCES ================= */

// 🔹 profile photo only
const profileUpload = baseUpload.fields([
  { name: "profilePhoto", maxCount: 1 }
]);

// 🔹 employee documents only
const employeeDocsUpload = baseUpload.fields([
  { name:"aadhaar", maxCount:1 },
  { name:"pan", maxCount:1 },
  { name:"bankPassbook", maxCount:1 },
  { name:"marksheet12", maxCount:1 },
  { name:"graduation", maxCount:1 }
]);

// 🔹 admin documents
const adminDocsUpload = baseUpload.fields([
  { name:"offerLetter", maxCount:1 },
  { name:"appointmentLetter", maxCount:1 },
  { name:"uanLetter", maxCount:1 },
  { name:"esicSlip", maxCount:1 },
  { name:"salarySlip", maxCount:1 }
]);

/* ================= AUTH ================= */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

/* ================= PROFILE ================= */
router.get("/profile/:employeeId", getEmployeeProfile);
router.get("/documents/:employeeId", getEmployeeDocuments);

router.put(
  "/profile/:employeeId",
  profileUpload,
  updateEmployeeProfile
);

/* ================= EMPLOYEE UPLOAD ================= */
router.post(
  "/upload/employee/:employeeId",
  employeeDocsUpload,
  uploadEmployeeDocuments
);

/* ================= ADMIN UPLOAD ================= */
router.post(
  "/upload/admin/:employeeId",
  adminDocsUpload,
  uploadAdminDocuments
);

router.get(
  "/profile-photo/:employeeId",
  getEmployeeProfilePhoto
);
/* ================= CHECK IN ================= */
router.post("/checkin/:employeeId", employeeCheckIn);
module.exports = router;
