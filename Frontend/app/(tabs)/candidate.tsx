import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Animated
} from "react-native";
import BackButton from "../../components/BackButton";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  createCandidateApi,
  getCandidateByMobileApi
} from "../../api/candidateApi";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function Candidate(){
  /* ================= FORM STATES ================= */
  const [fullName,setFullName]=useState("");
  const [fatherName,setFatherName]=useState("");
  const [address,setAddress]=useState("");
  const [mobile,setMobile]=useState("");

  const [resume,setResume]=useState<any>(null);
  const [aadhaar,setAadhaar]=useState<any>(null);

  /* ================= UI STATES ================= */
  const [loading,setLoading]=useState(false);
  const [popupVisible,setPopupVisible]=useState(false);
  const [popupType,setPopupType]=useState<"success"|"error"|"exists">("success");

  const scaleAnim=useRef(new Animated.Value(0)).current;

 const pickResume=async()=>{
  const res=await DocumentPicker.getDocumentAsync({
    type:["application/pdf"]
  });
  if(!res.canceled){
    const f=res.assets[0];
    setResume({
      uri:f.uri,
      name:f.name,
      type:f.mimeType || "application/pdf"
    });
  }
};

const pickAadhaar=async()=>{
  const res=await DocumentPicker.getDocumentAsync({
    type:["image/*","application/pdf"]
  });
  if(!res.canceled){
    const f=res.assets[0];
    setAadhaar({
      uri:f.uri,
      name:f.name,
      type:f.mimeType || "image/jpeg"
    });
  }
};


  /* ================= POPUP ================= */
  const openPopup=(type:"success"|"error"|"exists")=>{
    setPopupType(type);
    setPopupVisible(true);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim,{toValue:1,useNativeDriver:true}).start();
  };

 const handleSubmit = async () => {
  if (!fullName || !fatherName || !address || !mobile || !resume || !aadhaar) {
    Alert.alert("Required", "Please fill all fields and upload documents");
    return;
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    Alert.alert("Invalid Mobile", "Mobile number must be 10 digits");
    return;
  }

  try {
    setLoading(true);

    const existing = await getCandidateByMobileApi(mobile);

    if (existing) {
      openPopup("exists");
      return;
    }

    await createCandidateApi({
      fullName,
      fatherName,
      address,
      mobile,
      resume,
      aadhaar
    });

    openPopup("success");

    // reset form
    setFullName("");
    setFatherName("");
    setAddress("");
    setMobile("");
    setResume(null);
    setAadhaar(null);

  } catch (err) {
    console.log("❌ create candidate error:", err);
    openPopup("error");
  } finally {
    setLoading(false);
  }
};


  return(
    <View style={styles.container}>
      <StatusBar style="light"/>

      {/* ===== HEADER (EMPLOYEE DASHBOARD STYLE) ===== */}
      <LinearGradient colors={["#0A1F44","#12326B"]} style={styles.header}>
        <View style={styles.navbar}>
          <BackButton/>
          <Text style={styles.navTitle}>Job Application</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:40}}>

        <Text style={styles.subtitle}>Please fill accurate candidate details</Text>

        {/* ===== PERSONAL INFO ===== */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <TextInput placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.input}/>
          <TextInput placeholder="Father's Name" value={fatherName} onChangeText={setFatherName} style={styles.input}/>
          <TextInput placeholder="Mobile Number" value={mobile} onChangeText={setMobile} keyboardType="number-pad" maxLength={10} style={styles.input}/>
          <TextInput placeholder="Address" value={address} onChangeText={setAddress} multiline style={[styles.input,{height:90}]}/>
        </View>

        {/* ===== DOCUMENT UPLOADS (NEW UI) ===== */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Document Uploads</Text>

          {/* RESUME */}
          <TouchableOpacity style={styles.uploadRow} onPress={pickResume}>
            <View style={styles.uploadLeft}>
              <Ionicons name="document-text-outline" size={20} color="#1E3C72"/>
              <Text style={styles.uploadLabel}>
                {resume ? resume.name : "Resume (PDF)"}
              </Text>
            </View>
            <View style={styles.uploadAction}>
              <Ionicons name={resume ? "checkmark" : "add"} size={18} color="#fff"/>
            </View>
          </TouchableOpacity>

          {/* AADHAAR */}
          <TouchableOpacity style={styles.uploadRow} onPress={pickAadhaar}>
            <View style={styles.uploadLeft}>
              <Ionicons name="card-outline" size={20} color="#1E3C72"/>
              <Text style={styles.uploadLabel}>
                {aadhaar ? "Aadhaar Selected" : "Aadhaar Card"}
              </Text>
            </View>
            <View style={styles.uploadAction}>
              <Ionicons name={aadhaar ? "checkmark" : "add"} size={18} color="#fff"/>
            </View>
          </TouchableOpacity>
        </View>

        {/* ===== SUBMIT ===== */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitText}>Submit Application</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* ===== POPUP ===== */}
      <Modal transparent visible={popupVisible}>
        <View style={styles.popupOverlay}>
          <Animated.View style={[styles.popupBox,{transform:[{scale:scaleAnim}]}]}>
            <Text style={[styles.popupIcon,{color:popupType==="success"?"#2e7d32":"#c62828"}]}>
              {popupType==="success"?"✔":"✖"}
            </Text>
            <Text style={styles.popupText}>
              {popupType==="success" && "Application Submitted Successfully"}
              {popupType==="exists" && "Mobile number already registered"}
              {popupType==="error" && "Submission Failed"}
            </Text>
            <TouchableOpacity style={styles.popupClose} onPress={()=>setPopupVisible(false)}>
              <Text style={{color:"#fff",fontWeight:"700"}}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */
const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:"#F4F6FA"},

  header:{
    height:120,
    paddingTop:50,
    paddingHorizontal:20,
    borderBottomLeftRadius:26,
    borderBottomRightRadius:26
  },
  navbar:{flexDirection:"row",alignItems:"center"},
  navTitle:{color:"#fff",fontSize:20,fontWeight:"700",marginLeft:12},

  subtitle:{fontSize:14,color:"#78909c",margin:20},

  card:{
    backgroundColor:"#fff",
    marginHorizontal:20,
    marginBottom:16,
    borderRadius:18,
    padding:16,
    elevation:4
  },
  sectionTitle:{fontSize:16,fontWeight:"700",marginBottom:12,color:"#0A1F44"},

  input:{
    borderWidth:1,
    borderColor:"#e0e0e0",
    borderRadius:12,
    padding:14,
    backgroundColor:"#fafafa",
    marginBottom:12
  },

  /* ===== UPLOAD ROW STYLE ===== */
  uploadRow:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    backgroundColor:"#F7F9FD",
    borderRadius:14,
    paddingHorizontal:14,
    height:54,
    marginBottom:12
  },
  uploadLeft:{flexDirection:"row",alignItems:"center"},
  uploadLabel:{marginLeft:12,fontSize:14,fontWeight:"600",color:"#263238"},
  uploadAction:{
    width:30,
    height:30,
    borderRadius:15,
    backgroundColor:"#1E3C72",
    justifyContent:"center",
    alignItems:"center"
  },

  submitButton:{
    marginTop:20,
    marginHorizontal:20,
    backgroundColor:"#0A1F44",
    height:54,
    borderRadius:16,
    justifyContent:"center",
    alignItems:"center"
  },
  submitText:{color:"#fff",fontSize:16,fontWeight:"700"},

  popupOverlay:{flex:1,backgroundColor:"rgba(0,0,0,0.5)",justifyContent:"center",alignItems:"center"},
  popupBox:{width:"80%",backgroundColor:"#fff",borderRadius:18,padding:24,alignItems:"center"},
  popupIcon:{fontSize:56,marginBottom:10},
  popupText:{fontSize:16,fontWeight:"600",textAlign:"center",marginBottom:20},
  popupClose:{backgroundColor:"#0A1F44",paddingHorizontal:26,paddingVertical:12,borderRadius:12}
});
