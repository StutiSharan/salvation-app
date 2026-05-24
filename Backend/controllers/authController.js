const LoginData = require("../models/LoginData");
const jwt = require("jsonwebtoken");

// helper error response
const sendError = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error
      ? { error: error.message }
      : {})
  });
};

exports.sendOtp = async (req, res) => {
  try {
    let { fullName, phone } = req.body;

    if (!phone) {
      return sendError(res, 400, "Phone required");
    }

    /* ================= NORMALIZE PHONE ================= */
    phone = phone.replace(/\D/g,"");
    if(phone.length===10) phone = "+91"+phone;

    if (!/^\+\d{10,13}$/.test(phone)) {
      return sendError(res, 400, "Invalid phone format");
    }

    const otp = "123456";

    let loginData = await LoginData.findOne({ phone });

    /* ======================================================
       EXISTING VERIFIED USER → DIRECT LOGIN
    ====================================================== */

    if(loginData && loginData.otpStatus==="verified"){

      loginData.lastLoggedInAt = new Date();
      loginData.loginAt = new Date();
      await loginData.save();

      const token = jwt.sign(
        { id: loginData._id, phone: loginData.phone },
        process.env.JWT_SECRET,
        { expiresIn:"3d" }
      );

      return res.json({
        success:true,
        directLogin:true,
        token,
        message:"Welcome back"
      });
    }

    /* ======================================================
       NEW USER OR NOT VERIFIED → SEND OTP
    ====================================================== */

    if(!loginData){
      loginData = await LoginData.create({
        fullName,
        phone,
        otpStatus:"pending"
      });
    }else{
      loginData.otpStatus="pending";
      await loginData.save();
    }

    return res.json({
      success:true,
      directLogin:false,
      message:"OTP sent"
    });

  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Failed", err);
  }
};

// =============================
// VERIFY OTP
// =============================
exports.verifyOtp = async (req, res) => {
  try {
    let { phone, otp } = req.body;

phone = phone.replace(/\D/g,"");
if(phone.length===10) phone = "+91"+phone;
    if (!phone || !otp) {
      return sendError(res, 400, "Phone and OTP required");
    }

    if (otp !== "123456") {
      return sendError(res, 401, "Invalid OTP");
    }

    const loginData = await LoginData.findOne({ phone });
    if (!loginData) {
      return sendError(res, 404, "User not found");
    }

    loginData.otpStatus = "verified";
    loginData.loginAt = new Date();
    loginData.lastLoggedInAt = new Date();
    await loginData.save();

    if (!process.env.JWT_SECRET) {
      return sendError(res, 500, "JWT secret not configured");
    }

    const token = jwt.sign(
      { id: loginData._id, phone: loginData.phone },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return sendError(res, 500, "OTP verification failed", err);
  }
};
