const API_BASE_URL=process.env.EXPO_PUBLIC_API_URL;

export const createCandidateApi = async (data: {
  fullName: string;
  fatherName: string;
  address: string;
  mobile: string;
  resume: any;
  aadhaar: any;
}) => {
  const formData = new FormData();

  formData.append("fullName", data.fullName);
  formData.append("fatherName", data.fatherName);
  formData.append("address", data.address);
  formData.append("mobile", data.mobile);

  formData.append("resume", {
    uri: data.resume.uri,
    name: data.resume.name || "resume.pdf",
    type: data.resume.type || "application/pdf"
  } as any);

  formData.append("aadhaar", {
    uri: data.aadhaar.uri,
    name: data.aadhaar.name || "aadhaar.jpg",
    type: data.aadhaar.type || "image/jpeg"
  } as any);

 const res = await fetch(
  `${API_BASE_URL}/candidates/create-candidate`,
  {
    method: "POST",
    body: formData
  }
);


  const text = await res.text(); // 🔥 read as text first

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.log("❌ Backend returned NON-JSON:", text);
    throw new Error("Server error. Please try again.");
  }

  if (!res.ok) {
    throw new Error(json.message || "Failed to submit");
  }

  return json;
};

export const getCandidateByMobileApi = async (mobile: string) => {
  const res = await fetch(
    `${API_BASE_URL}/candidates/by-mobile/${mobile}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    }
  );

  if (res.status === 404) {
    // ✅ NOT REGISTERED → this is OK
    return null;
  }

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to check mobile");
  }

  return result; // candidate exists
};
