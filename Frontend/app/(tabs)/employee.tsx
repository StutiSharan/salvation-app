import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  sendEmployeeOtpApi,
  verifyEmployeeOtpApi,
} from "../../api/employeeApi";

export default function Employee() {

  const [step,setStep]=useState<"FORM"|"OTP">("FORM")
  const [employeeId,setEmployeeId]=useState("")
  const [mobile,setMobile]=useState("")
  const [otp,setOtp]=useState("")
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    const checkAuth=async()=>{
      const token=await AsyncStorage.getItem("employeeToken")
      if(token){
        router.replace("/employee/dashboard")
      }
    }
    checkAuth()
  },[])

  const isValidMobile=(value:string)=>{
    return /^[0-9]{10}$/.test(value)
  }

  /* ================= SEND OTP ================= */

  const sendOtp=async()=>{

    if(!employeeId.trim()){
      Alert.alert("Required","Enter Employee ID")
      return
    }

    if(!mobile.trim()){
      Alert.alert("Required","Enter Mobile Number")
      return
    }

    if(!isValidMobile(mobile)){
      Alert.alert("Invalid Mobile Number","Mobile must be 10 digits")
      return
    }

    try{
      setLoading(true)

      await sendEmployeeOtpApi({
        employeeId,
        loginMobile:mobile
      })

      setStep("OTP")
      Alert.alert("OTP Sent","Please check your phone")

    }catch(err:any){
      Alert.alert("Error",err.message || "Failed to send OTP")
    }finally{
      setLoading(false)
    }
  }

  /* ================= VERIFY OTP ================= */

  const verifyOtp=async()=>{

    if(!otp){
      Alert.alert("Required","Enter OTP")
      return
    }

    try{
      setLoading(true)

      const res=await verifyEmployeeOtpApi({
        employeeId,
        otp,
        loginMobile:mobile
      })

      await AsyncStorage.setItem("employeeToken",res.token)
      await AsyncStorage.setItem("employeeId",res.employeeId)

      router.replace("/employee/dashboard")

    }catch(err:any){
      Alert.alert("Invalid OTP",err.message)
    }finally{
      setLoading(false)
    }
  }

  /* ================= GO BACK TO FORM ================= */

  const goBackToForm=()=>{
    setStep("FORM")
    setOtp("")
  }

  return(
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0A1F44"/>

      <View style={styles.header}>
        <Ionicons name="briefcase" size={42} color="#fff"/>
        <Text style={styles.brand}>Employee Portal</Text>
        <Text style={styles.subtitle}>Authorized access only</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Employee Login</Text>

        {/* ================= FORM ================= */}

        {step==="FORM" &&(
          <>
            <View style={styles.inputBox}>
              <Ionicons name="id-card-outline" size={20} color="#607d8b"/>
              <TextInput
                placeholder="Employee ID"
                value={employeeId}
                onChangeText={setEmployeeId}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color="#607d8b"/>
              <TextInput
                placeholder="Registered Mobile Number"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={t=>setMobile(t.replace(/[^0-9]/g,""))}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={sendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff"/>
                : <Text style={styles.buttonText}>Send OTP</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ================= OTP ================= */}

        {step==="OTP" &&(
          <>
            {/* BACK BUTTON */}
            <TouchableOpacity
              style={styles.backRow}
              onPress={goBackToForm}
            >
              <Ionicons name="arrow-back" size={18} color="#0A1F44"/>
              <Text style={styles.backText}>Edit mobile or employee ID</Text>
            </TouchableOpacity>

            <View style={styles.inputBox}>
              <Ionicons name="key-outline" size={20} color="#607d8b"/>
              <TextInput
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={verifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff"/>
                : <Text style={styles.buttonText}>Verify & Login</Text>
              }
            </TouchableOpacity>
          </>
        )}

      </View>
    </View>
  )
}

/* ================= STYLES ================= */

const styles=StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:"#0A1F44",
    justifyContent:"center",
    padding:20,
    paddingBottom:80
  },
  header:{alignItems:"center",marginBottom:30},
  brand:{fontSize:24,fontWeight:"700",color:"#fff",marginTop:10},
  subtitle:{fontSize:14,color:"#cfd8dc",marginTop:4},

  card:{
    backgroundColor:"#fff",
    borderRadius:18,
    padding:20,
    elevation:6
  },

  title:{
    fontSize:22,
    fontWeight:"700",
    color:"#0A1F44",
    marginBottom:20,
    textAlign:"center"
  },

  inputBox:{
    flexDirection:"row",
    alignItems:"center",
    borderWidth:1,
    borderColor:"#e0e0e0",
    borderRadius:12,
    paddingHorizontal:12,
    marginBottom:15,
    backgroundColor:"#fafafa",
    height:50
  },

  input:{
    flex:1,
    marginLeft:10,
    fontSize:16,
    color:"#263238"
  },

  button:{
    backgroundColor:"#0A1F44",
    height:52,
    borderRadius:14,
    justifyContent:"center",
    alignItems:"center",
    marginTop:10
  },

  buttonText:{
    color:"#fff",
    fontSize:16,
    fontWeight:"600"
  },

  backRow:{
    flexDirection:"row",
    alignItems:"center",
    marginBottom:12
  },

  backText:{
    marginLeft:6,
    color:"#0A1F44",
    fontWeight:"600"
  }
})