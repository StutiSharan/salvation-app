const drive = require("../config/googleDrive"); // ✅ FIXED
const { Readable } = require("stream");

/* ---------- BUFFER → STREAM ---------- */
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/* ---------- TIMEOUT WRAPPER ---------- */
const uploadWithTimeout = (promise, ms = 20000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Google Drive upload timeout")), ms)
    )
  ]);
};

/* ---------- UPLOAD TO DRIVE ---------- */
const uploadToDrive = async (file, folderId) => {
  console.log("📤 Uploading:", file.originalname);
  console.log("📦 File size (KB):", Math.round(file.buffer.length / 1024));
  console.log("📁 Target folder:", folderId);
  console.log("⏳ Starting Google Drive upload...");

  const uploadPromise = drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId]
    },
    media: {
      body: bufferToStream(file.buffer)
    }
  });

  const response = await uploadWithTimeout(uploadPromise, 20000);

  console.log("✅ Uploaded to Drive, File ID:", response.data.id);
  return response.data.id;
};

/* ---------- MAIN CONTROLLER ---------- */
exports.uploadCandidateDocuments = async (req, res) => {
  try {
    console.log("📥 Received upload request");

    if (!req.files) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let resumeFileId = null;
    let aadhaarFileId = null;

    if (req.files.resume) {
      resumeFileId = await uploadToDrive(
        req.files.resume[0],
        process.env.GOOGLE_DRIVE_RESUME_FOLDER_ID
      );
    }

    if (req.files.aadhaar) { // ✅ spelling fixed
      aadhaarFileId = await uploadToDrive(
        req.files.aadhaar[0],
        process.env.GOOGLE_DRIVE_AADHAR_FOLDER_ID
      );
    }

    res.status(200).json({
      message: "Documents uploaded successfully",
      resumeFileId,
      aadhaarFileId
    });

  } catch (error) {
    console.error("🔥 Upload error:", error.message);
    res.status(500).json({
      message: "Upload failed",
      error: error.message
    });
  }
};
