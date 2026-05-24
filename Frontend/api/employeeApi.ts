const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/* SEND OTP */
export const sendEmployeeOtpApi = async (data:any)=>{
  const res = await fetch(`${API_BASE_URL}/employees/send-otp`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(data)
  });
  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};

/* VERIFY OTP */
export const verifyEmployeeOtpApi = async (data:any)=>{
  const res = await fetch(`${API_BASE_URL}/employees/verify-otp`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(data)
  });
  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};

/* GET PROFILE */
export const getEmployeeProfile = async (employeeId:string)=>{
  const res = await fetch(`${API_BASE_URL}/employees/profile/${employeeId}`);
  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};

export const updateEmployeeProfileApi = async (
  employeeId:string,
  token:string,
  data:{
    fullName?:string;
    fatherName?:string;
    mobile?:string;
    address?:string;
    profilePhoto?:any; // image picker result
  }
)=>{
  const formData = new FormData();

  if(data.fullName) formData.append("fullName",data.fullName);
  if(data.fatherName) formData.append("fatherName",data.fatherName);
  if(data.mobile) formData.append("mobile",data.mobile);
  if(data.address) formData.append("address",data.address);

  if(data.profilePhoto){
    formData.append("profilePhoto",{
      uri:data.profilePhoto.uri,
      name:"profile.jpg",
      type:"image/jpeg"
    } as any);
  }

  const res = await fetch(
    `${API_BASE_URL}/employees/profile/${employeeId}`,
    {
      method:"PUT",
      headers:{
        Authorization:`Bearer ${token}`
      },
      body:formData
    }
  );

  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};

export const uploadEmployeeDocumentsApi = async (
  employeeId:string,
  token:string,
  files:{
    aadhaar?:any;
    pan?:any;
    bankPassbook?:any;
    marksheet12?:any;
    profilePhoto?:any;
    graduation?:any;
  }
)=>{
  const formData = new FormData();

  Object.entries(files).forEach(([key,file])=>{
    if(file){
      formData.append(key,{
        uri:file.uri,
        name:file.name || `${key}.jpg`,
        type:file.type || "application/octet-stream"
      } as any);
    }
  });

  const res = await fetch(
    `${API_BASE_URL}/employees/upload/employee/${employeeId}`,
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${token}`
      },
      body:formData
    }
  );

  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};
// export const uploadAdminDocumentsApi = async (
//   employeeId:string,
//   token:string,
//   files:{
//     offerLetter?:any;
//     appointmentLetter?:any;
//     uanLetter?:any;
//     esicSlip?:any;
//     salarySlip?:any;
//   }
// )=>{
//   const formData = new FormData();

//   Object.entries(files).forEach(([key,file])=>{
//     if(file){
//       formData.append(key,{
//         uri:file.uri,
//         name:file.name || `${key}.pdf`,
//         type:file.type || "application/pdf"
//       } as any);
//     }
//   });

//   const res = await fetch(
//     `${API_BASE_URL}/employees/upload/admin/${employeeId}`,
//     {
//       method:"POST",
//       headers:{
//         Authorization:`Bearer ${token}`
//       },
//       body:formData
//     }
//   );

//   const json = await res.json();
//   if(!res.ok) throw new Error(json.message);
//   return json;
// };
export const getEmployeeDocumentsApi = async(
  employeeId:string,
  token:string
)=>{
  const res = await fetch(
    `${API_BASE_URL}/employees/documents/${employeeId}`,
    {
      headers:{ Authorization:`Bearer ${token}` }
    }
  );

  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json.documents;
};
/* GET PROFILE PHOTO */
export const getEmployeeProfilePhotoApi = async (
  employeeId: string,
  token: string
) => {
  const res = await fetch(
    `${API_BASE_URL}/employees/profile-photo/${employeeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json; 
  // { success:true, profilePhoto: string | null }
};
export const employeeCheckInApi = async(
  employeeId:string,
  token:string,
  location:{
    latitude:number;
    longitude:number;
    address?:string;
  }
)=>{
  const res = await fetch(
    `${API_BASE_URL}/employees/checkin/${employeeId}`,
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify(location)
    }
  );

  const json = await res.json();
  if(!res.ok) throw new Error(json.message);
  return json;
};