const express = require("express");
const upload = require("../middleware/upload");
const {
  createCandidate,
  getCandidateByMobile
} = require("../controllers/candidateController");

const router = express.Router();

console.log("🟢 Candidate routes initialized");

/**
 * POST /api/candidates/create-candidate
 * Creates candidate
 * Uploads resume + aadhaar
 */
router.post(
  "/create-candidate",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "aadhaar", maxCount: 1 }
  ]),
  createCandidate
);

router.get(
  "/by-mobile/:mobile",
  getCandidateByMobile
);

module.exports = router;
