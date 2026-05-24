const mongoose = require("mongoose");

/* ================= SALARY SLIP SUB SCHEMA ================= */

const SalarySlipSchema = new mongoose.Schema({
  month:{
    type:String,
    required:true,
    enum:[
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ]
  },
  year:{
    type:Number,
    required:true
  },
  key:{
    type:String,
    required:true
  },
  uploadedAt:{
    type:Date,
    default:Date.now
  }
},{ _id:false });

/* ================= MAIN EMPLOYEE SCHEMA ================= */

const EmployeeSchema = new mongoose.Schema(
{
  /* ================= BASIC INFO ================= */
  employeeId:{ type:String, unique:true, required:true },
  role:{ type:String, default:"employee" },
  fullName:{ type:String, default:"" },
  fatherName:{ type:String, default:"" },
  mobile:{ type:String, default:"" },
  address:{ type:String, default:"" },
  profilePhoto:{ type:String, default:"" },

  /* ================= LOGIN / OTP ================= */
loginMobile:{
	type:String,
	required:true,
	unique:true,
	index:true
},
sessionExpiresAt:{type:Date},
  otp:{ type:String, default:"" },
  otpVerified:{ type:Boolean, default:false },
  loginAt:{ type:Date },
  lastLoginAt:{ type:Date },
checkinLocation:{
  latitude:{ type:Number },
  longitude:{ type:Number },
  address:{ type:String, default:"" },
  checkedInAt:{ type:Date, default:Date.now }
},
  /* ================= EMPLOYEE SELF UPLOADS ================= */
  employeeUploads:{
    aadhaar:{ type:String, default:"" },
    pan:{ type:String, default:"" },
    bankPassbook:{ type:String, default:"" },
    marksheet12:{ type:String, default:"" },
    graduation:{ type:String, default:"" }
  },

  /* ================= ADMIN / COMPANY UPLOADS ================= */
  companyUploads:{
    offerLetter:{ type:String, default:"" },
    appointmentLetter:{ type:String, default:"" },
    uanLetter:{ type:String, default:"" },
    esicSlip:{ type:String, default:"" },

    /* ⭐ NEW STRUCTURED SALARY SLIPS */
    salarySlips:{
      type:[SalarySlipSchema],
      default:[]
    }
  }

},
{ timestamps:true }
);

module.exports = mongoose.model("Employee",EmployeeSchema,"employees");
