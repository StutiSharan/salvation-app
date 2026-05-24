const express = require("express");
const oauth2Client = require("../config/googleOAuth");
const GoogleToken = require("../models/GoogleToken");

const router = express.Router();

router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.file"]
  });
  res.redirect(url);
});


router.get("/google/callback", async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    // 🔥 SAVE TOKENS
    await GoogleToken.deleteMany({});
    await GoogleToken.create(tokens);

    console.log("🟢 Google tokens saved to MongoDB");

    res.send("Google Drive connected successfully. You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    res.status(500).send("OAuth failed");
  }
});

module.exports = router;
