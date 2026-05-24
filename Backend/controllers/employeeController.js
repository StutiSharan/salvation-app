const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");
const { uploadToS3 } = require("../utills/uploadToS3");
const { getSignedUrlFromKey } = require("../utills/getSignedUrlFromKey");

const EMPLOYEE_UPLOAD_FIELDS = [
  "aadhaar",
  "pan",
  "bankPassbook",
  "marksheet12",
  "graduation"
];


const ADMIN_UPLOAD_FIELDS = [
  "offerLetter",
  "appointmentLetter",
  "uanLetter",
  "esicSlip",
  "salarySlip"
];
const normalizeMobile=(mobile)=>{
	if(!mobile) return ""
	let phone=String(mobile).replace(/\D/g,"")
	if(phone.length>10){
		phone=phone.slice(-10)
	}
	return phone
}
// /* ================= SEND OTP ================= */
// exports.sendOtp = async (req,res)=>{
//   try{
//     const { employeeId, loginMobile } = req.body;

//     if(!employeeId || !loginMobile){
//       return res.status(400).json({ message:"Employee ID & mobile required" });
//     }

//     // ✅ Only generate OTP (NO DB CREATE)
//     const otp = "123456"; // static for now

//     console.log(`📨 OTP for ${employeeId}:`, otp);

//     // 👉 Later: send SMS here
//     res.json({
//       success:true,
//       message:"OTP sent successfully"
//     });

//   }catch(err){
//     console.error("🔥 sendOtp error:",err);
//     res.status(500).json({ message:"Server error" });
//   }
// };

exports.sendOtp=async(req,res)=>{
	try{
		let {employeeId,loginMobile}=req.body

		if(!employeeId||!loginMobile){
			return res.status(400).json({message:"Employee ID & mobile required"})
		}

		loginMobile=normalizeMobile(loginMobile)

		const employee=await Employee.findOne({employeeId})

		if(!employee){
			return res.status(404).json({
				success:false,
				message:"Employee ID not registered. Contact admin."
			})
		}

		if(employee.loginMobile!==loginMobile){
			return res.status(401).json({
				success:false,
				message:"Mobile number does not match this Employee ID"
			})
		}

		console.log(`📨 OTP for ${employeeId}: 123456`)

		res.json({
			success:true,
			message:"OTP sent successfully"
		})
	}catch(err){
		console.error("🔥 sendOtp error:",err)
		res.status(500).json({message:"Server error"})
	}
}
// exports.verifyOtp = async (req,res)=>{
//  try{
//   const { employeeId, otp } = req.body

//   if(!employeeId || !otp){
//    return res.status(400).json({message:"Employee ID & OTP required"})
//   }

//   if(otp !== "123456"){
//    return res.status(401).json({message:"Invalid OTP"})
//   }

//   const employee = await Employee.findOne({employeeId})

//   if(!employee){
//    return res.status(404).json({
//     message:"Employee ID not registered. Contact admin."
//    })
//   }

//   employee.otpVerified = true
//   employee.lastLoginAt = new Date()
//   await employee.save()

//   const token = jwt.sign(
//    { id: employee._id, role: employee.role },
//    process.env.JWT_SECRET,
//    { expiresIn:"1d" }
//   )

//   res.json({
//    success:true,
//    token,
//    employeeId:employee.employeeId
//   })

//  }catch(err){
//   console.error(err)
//   res.status(500).json({message:"Server error"})
//  }
// }

exports.verifyOtp=async(req,res)=>{
	try{
		const {employeeId,otp}=req.body

		if(!employeeId||!otp){
			return res.status(400).json({message:"Employee ID & OTP required"})
		}

		if(otp!=="123456"){
			return res.status(401).json({message:"Invalid OTP"})
		}

		const employee=await Employee.findOne({employeeId})

		if(!employee){
			return res.status(404).json({
				message:"Employee ID not registered. Contact admin."
			})
		}

		employee.otpVerified=true
		employee.loginAt=new Date()
		employee.lastLoginAt=new Date()
		employee.sessionExpiresAt=new Date(Date.now()+7*24*60*60*1000)
		await employee.save()

		const token=jwt.sign(
			{
				id:employee._id,
				employeeId:employee.employeeId,
				loginMobile:employee.loginMobile,
				role:employee.role
			},
			process.env.JWT_SECRET,
			{expiresIn:"7d"}
		)

		res.json({
			success:true,
			token,
			employeeId:employee.employeeId,
			sessionExpiresAt:employee.sessionExpiresAt
		})
	}catch(err){
		console.error(err)
		res.status(500).json({message:"Server error"})
	}
}


/* ================= GET PROFILE ================= */
exports.getEmployeeProfile = async (req,res)=>{
  try{
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if(!employee){
      return res.status(404).json({ message:"Employee not found" });
    }

    res.json({ success:true, employee });

  }catch(err){
    res.status(500).json({ message:"Server error" });
  }
};

exports.updateEmployeeProfile = async(req,res)=>{
  try{
    const { employeeId } = req.params;
    const { fullName,fatherName,mobile,address } = req.body;

    const employee = await Employee.findOne({ employeeId });
    if(!employee){
      return res.status(404).json({ message:"Employee not found" });
    }

    /* ---------- UPDATE BASIC FIELDS ---------- */
    if(fullName !== undefined) employee.fullName = fullName;
    if(fatherName !== undefined) employee.fatherName = fatherName;
    if(mobile !== undefined) employee.mobile = mobile;
    if(address !== undefined) employee.address = address;

    /* ---------- UPLOAD PROFILE PHOTO ---------- */
    if(req.files?.profilePhoto?.[0]){
      const s3Key = await uploadToS3(
        req.files.profilePhoto[0],
        {
          module:"employee",
          documentType:"profilePhoto",
          name:employee.fullName || employee.employeeId,
          id:employee.employeeId
        }
      );

      employee.profilePhoto = s3Key;
    }

    await employee.save();

    res.json({
      success:true,
      message:"Profile updated successfully",
      employee
    });

  }catch(err){
    console.error("🔥 updateEmployeeProfile:",err);
    res.status(500).json({ message:"Server error" });
  }
};
exports.uploadEmployeeDocuments=async(req,res)=>{
  try{
    let { employeeId }=req.params;
    if(Array.isArray(employeeId)) employeeId=employeeId[0];

    const employee=await Employee.findOne({employeeId});
    if(!employee){
      return res.status(404).json({message:"Employee not found"});
    }

    if(!req.files || Object.keys(req.files).length===0){
      return res.status(400).json({message:"No files uploaded"});
    }

    for(const field of EMPLOYEE_UPLOAD_FIELDS){
      if(req.files[field]?.[0]){
        const file=req.files[field][0];

        // 🔍 LOG TYPE (debug once)
        console.log(`Uploading ${field}:`,file.mimetype);

        const s3Key=await uploadToS3(file,{
          module:"employee",
          documentType:field,
          name:employee.fullName || employee.employeeId,
          id:employee.employeeId
        });

        employee.employeeUploads[field]=s3Key;
      }
    }

    await employee.save();

    res.json({
      success:true,
      message:"Employee documents uploaded",
      employeeUploads:employee.employeeUploads
    });

  }catch(err){
    console.error("🔥 uploadEmployeeDocuments:",err);
    res.status(500).json({message:"Server error"});
  }
};

exports.uploadAdminDocuments = async(req,res)=>{
  try{
    const { employeeId } = req.params;

    const employee = await Employee.findOne({ employeeId });
    if(!employee){
      return res.status(404).json({ message:"Employee not found" });
    }

    if(!req.files){
      return res.status(400).json({ message:"No files uploaded" });
    }

    for(const field of ADMIN_UPLOAD_FIELDS){
      if(req.files[field]?.[0]){

        if(field === "salarySlip"){
          const s3Key = await uploadToS3(
            req.files[field][0],
            {
              module:"admin",
              documentType:"salarySlip",
              name:employee.fullName || employee.employeeId,
              id:employee.employeeId
            }
          );

          employee.companyUploads.salarySlips.push(s3Key);
        }else{
          const s3Key = await uploadToS3(
            req.files[field][0],
            {
              module:"admin",
              documentType:field,
              name:employee.fullName || employee.employeeId,
              id:employee.employeeId
            }
          );

          employee.companyUploads[field] = s3Key;
        }
      }
    }

    await employee.save();

    res.json({
      success:true,
      message:"Admin documents uploaded",
      companyUploads:employee.companyUploads
    });

  }catch(err){
    console.error("🔥 uploadAdminDocuments:",err);
    res.status(500).json({ message:"Server error" });
  }
};
exports.getEmployeeDocuments = async(req,res)=>{
  try{
    let { employeeId } = req.params;

    // ✅ normalize (VERY IMPORTANT)
    if(Array.isArray(employeeId)){
      employeeId = employeeId[0];
    }

    if(!employeeId){
      return res.status(400).json({ message:"Employee ID missing" });
    }

    console.log("📄 Fetch docs for:", employeeId);

    const employee = await Employee.findOne({ employeeId });

    if(!employee){
      return res.status(404).json({ message:"Employee not found" });
    }

    const employeeDocs = employee.employeeUploads || {};
    const companyDocs = employee.companyUploads || {};

    const response = {
      personal:{
        aadhaar: await getSignedUrlFromKey(employeeDocs.aadhaar),
        pan: await getSignedUrlFromKey(employeeDocs.pan),
        bankPassbook: await getSignedUrlFromKey(employeeDocs.bankPassbook),
        marksheet12: await getSignedUrlFromKey(employeeDocs.marksheet12),
        graduation: await getSignedUrlFromKey(employeeDocs.graduation)
      },
      letters:{
        offerLetter: await getSignedUrlFromKey(companyDocs.offerLetter),
        appointmentLetter: await getSignedUrlFromKey(companyDocs.appointmentLetter)
      },
      government:{
        uanLetter: await getSignedUrlFromKey(companyDocs.uanLetter),
        esicSlip: await getSignedUrlFromKey(companyDocs.esicSlip)
      },
      salarySlips:[]
    };

    if(companyDocs.salarySlips?.length){
      for(const key of companyDocs.salarySlips){
        response.salarySlips.push(await getSignedUrlFromKey(key));
      }
    }

    res.json({ success:true, documents:response });

  }catch(err){
    console.error("🔥 getEmployeeDocuments:",err);
    res.status(500).json({ message:"Server error" });
  }
};
// ================= GET EMPLOYEE PROFILE PHOTO =================
exports.getEmployeeProfilePhoto = async (req, res) => {
  try {
    console.log("📸 getEmployeeProfilePhoto called with params:", req.params);
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID missing" });
    }

    const employee = await Employee.findOne({ employeeId }).select(
      "profilePhoto"
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const key = employee?.profilePhoto;

    if (!key) {
      return res.json({
        success: true,
        profilePhoto: null
      });
    }

    const imageUrl = `${process.env.S3_BASE_URL}/${key}`;

    return res.json({
      success: true,
      profilePhoto: imageUrl
    });

  } catch (error) {
    console.error("🔥 getEmployeeProfilePhoto:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getEmployeeDocuments = async (req,res)=>{
 try{

  let { employeeId } = req.params

  if(Array.isArray(employeeId)){
   employeeId = employeeId[0]
  }

  if(!employeeId){
   return res.status(400).json({ message:"Employee ID missing" })
  }

  const employee = await Employee.findOne({ employeeId })

  if(!employee){
   return res.status(404).json({ message:"Employee not found" })
  }

  const empUploads = employee.employeeUploads || {}
  const companyUploads = employee.companyUploads || {}

  /* =====================================================
     HELPER → SAFE SIGNED URL
  ===================================================== */

  const safeUrl = async(key)=>{
   if(!key) return null
   return await getSignedUrlFromKey(key)
  }

  /* =====================================================
     EMPLOYEE UPLOADS (SELF DOCUMENTS)
  ===================================================== */

  const employeeDocuments = {
   aadhaar: empUploads.aadhaar
     ? { key: empUploads.aadhaar, url: await safeUrl(empUploads.aadhaar) }
     : null,

   pan: empUploads.pan
     ? { key: empUploads.pan, url: await safeUrl(empUploads.pan) }
     : null,

   bankPassbook: empUploads.bankPassbook
     ? { key: empUploads.bankPassbook, url: await safeUrl(empUploads.bankPassbook) }
     : null,

   marksheet12: empUploads.marksheet12
     ? { key: empUploads.marksheet12, url: await safeUrl(empUploads.marksheet12) }
     : null,

   graduation: empUploads.graduation
     ? { key: empUploads.graduation, url: await safeUrl(empUploads.graduation) }
     : null
  }

  /* =====================================================
     COMPANY DOCUMENTS
  ===================================================== */

  const companyDocuments = {
   offerLetter: companyUploads.offerLetter
     ? { key: companyUploads.offerLetter, url: await safeUrl(companyUploads.offerLetter) }
     : null,

   appointmentLetter: companyUploads.appointmentLetter
     ? { key: companyUploads.appointmentLetter, url: await safeUrl(companyUploads.appointmentLetter) }
     : null,

   uanLetter: companyUploads.uanLetter
     ? { key: companyUploads.uanLetter, url: await safeUrl(companyUploads.uanLetter) }
     : null,

   esicSlip: companyUploads.esicSlip
     ? { key: companyUploads.esicSlip, url: await safeUrl(companyUploads.esicSlip) }
     : null
  }

  /* =====================================================
     SALARY SLIPS
  ===================================================== */

  const salarySlips = []

  if(companyUploads.salarySlips?.length){
   for(const slip of companyUploads.salarySlips){
    salarySlips.push({
     month: slip.month,
     year: slip.year,
     key: slip.key,
     uploadedAt: slip.uploadedAt,
     url: await safeUrl(slip.key)
    })
   }
  }

  /* =====================================================
     FINAL RESPONSE (CLEAN STRUCTURE)
  ===================================================== */

  res.json({
   success:true,
   documents:{
    employeeUploads: employeeDocuments,
    companyUploads: companyDocuments,
    salarySlips
   }
  })

 }catch(err){
  console.error("🔥 getEmployeeDocuments:",err)
  res.status(500).json({ message:"Server error" })
 }
}
/* ================= EMPLOYEE CHECK IN ================= */
exports.employeeCheckIn = async(req,res)=>{
  try{
    const { employeeId } = req.params;
    const { latitude, longitude, address } = req.body;

    if(!latitude || !longitude){
      return res.status(400).json({
        message:"Location coordinates required"
      });
    }

    const employee = await Employee.findOne({ employeeId });

    if(!employee){
      return res.status(404).json({
        message:"Employee not found"
      });
    }

    employee.checkinLocation = {
      latitude,
      longitude,
      address: address || "",
      checkedInAt:new Date()
    };

    await employee.save();

    res.json({
      success:true,
      message:"Checked in successfully",
      checkinLocation:employee.checkinLocation
    });

  }catch(err){
    console.error("🔥 employeeCheckIn:",err);
    res.status(500).json({ message:"Server error" });
  }
};