// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import { useState, useEffect } from "react";
// import { router } from "expo-router";
// import { sendOtpApi, verifyOtpApi } from "../../api/authApi";

// export default function Login(){

//  const [step,setStep]=useState<"FORM"|"OTP">("FORM");
//  const [phone,setPhone]=useState("");
//  const [fullName,setFullName]=useState("");
//  const [otp,setOtp]=useState("");
//  const [loading,setLoading]=useState(false);
//  const [timer,setTimer]=useState(60);

//  /* ================= OTP TIMER ================= */
//  useEffect(()=>{
//   let interval:any;
//   if(step==="OTP" && timer>0){
//    interval=setInterval(()=>setTimer(t=>t-1),1000);
//   }
//   return()=>clearInterval(interval);
//  },[step,timer]);

//  /* ======================================================
//     CONTINUE BUTTON (SMART)
//  ====================================================== */

//  const handleContinue = async()=>{

//   try{
//    setLoading(true);

//    /* ================= STEP 1 : SEND / DIRECT LOGIN ================= */
//    if(step==="FORM"){

//     const res = await sendOtpApi(fullName,phone);

//     if(res.directLogin){
//       router.replace("/(tabs)/candidate");
//       return;
//     }

//     setStep("OTP");
//     setTimer(60);
//     return;
//    }

//    /* ================= STEP 2 : VERIFY OTP ================= */

//    if(step==="OTP"){
//     if(otp.length!==6){
//       Alert.alert("Enter 6 digit OTP");
//       return;
//     }

//     await verifyOtpApi(phone,otp);
//     router.replace("/(tabs)/candidate");
//    }

//   }catch(err:any){
//    Alert.alert("Error",err.message);
//   }finally{
//    setLoading(false);
//   }
//  };

//  /* ====================================================== */

//  return(
//  <View style={styles.container}>
//   <View style={styles.card}>

//    <Text style={styles.title}>
//     {step==="FORM" ? "Candidate Login" : "Verify OTP"}
//    </Text>

//    {step==="FORM" && (
//     <>
//      <TextInput
//       placeholder="Full Name"
//       value={fullName}
//       onChangeText={setFullName}
//       style={styles.input}
//      />

//      <TextInput
//       placeholder="Phone Number"
//       keyboardType="number-pad"
//       maxLength={10}
//       value={phone}
//       onChangeText={t=>setPhone(t.replace(/\D/g,""))}
//       style={styles.input}
//      />

    
//     </>
//    )}

//    {step==="OTP" && (
//     <>
//      <TextInput
//       placeholder="Enter OTP"
//       keyboardType="number-pad"
//       maxLength={6}
//       value={otp}
//       onChangeText={setOtp}
//       style={styles.input}
//      />

//      {timer>0
//       ? <Text style={styles.note}>OTP valid {timer}s</Text>
//       : <Text style={styles.note}>Request new OTP</Text>
//      }
//     </>
//    )}

//    <TouchableOpacity
//     style={styles.button}
//     onPress={handleContinue}
//     disabled={loading}
//    >
//     <Text style={styles.buttonText}>
//      {loading ? "Please wait..." : "Continue"}
//     </Text>
//    </TouchableOpacity>

//   </View>
//  </View>
//  )
// }

// const styles=StyleSheet.create({
//  container:{flex:1,justifyContent:"center",padding:20,backgroundColor:"#0A1F44"},
//  card:{backgroundColor:"#fff",padding:20,borderRadius:16},
//  title:{fontSize:22,fontWeight:"700",marginBottom:20,textAlign:"center"},
//  input:{height:50,borderWidth:1,borderColor:"#ddd",borderRadius:12,paddingHorizontal:15,marginBottom:12},
//  button:{backgroundColor:"#0A1F44",height:50,borderRadius:12,justifyContent:"center",alignItems:"center"},
//  buttonText:{color:"#fff",fontWeight:"600",fontSize:16},
//  note:{textAlign:"center",color:"#777",marginBottom:10}
// });

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendOtpApi, verifyOtpApi } from "../../api/authApi";

const CANDIDATE_SESSION_KEY="candidateSession";
const FIVE_DAYS=5*24*60*60*1000;

export default function Login(){
	const [step,setStep]=useState<"FORM"|"OTP">("FORM");
	const [phone,setPhone]=useState("");
	const [fullName,setFullName]=useState("");
	const [otp,setOtp]=useState("");
	const [loading,setLoading]=useState(false);
	const [checking,setChecking]=useState(true);
	const [timer,setTimer]=useState(60);

	useEffect(()=>{
		checkExistingLogin();
	},[]);

	const checkExistingLogin=async()=>{
		try{
			const session=await AsyncStorage.getItem(CANDIDATE_SESSION_KEY);

			if(session){
				const parsed=JSON.parse(session);
				const now=Date.now();

				if(parsed?.expiresAt && now<parsed.expiresAt){
					router.replace("/(tabs)/candidate");
					return;
				}

				await AsyncStorage.removeItem(CANDIDATE_SESSION_KEY);
			}
		}catch(err){
			await AsyncStorage.removeItem(CANDIDATE_SESSION_KEY);
		}finally{
			setChecking(false);
		}
	};

	const saveCandidateSession=async()=>{
		await AsyncStorage.setItem(
			CANDIDATE_SESSION_KEY,
			JSON.stringify({
				phone,
				fullName,
				loggedInAt:Date.now(),
				expiresAt:Date.now()+FIVE_DAYS
			})
		);
	};

	useEffect(()=>{
		let interval:any;
		if(step==="OTP" && timer>0){
			interval=setInterval(()=>setTimer(t=>t-1),1000);
		}
		return()=>clearInterval(interval);
	},[step,timer]);

	const handleContinue=async()=>{
		try{
			setLoading(true);

			if(step==="FORM"){
				if(!fullName || phone.length!==10){
					Alert.alert("Required","Enter full name and valid 10 digit phone number");
					return;
				}

				const res=await sendOtpApi(fullName,phone);

				if(res.directLogin){
					await saveCandidateSession();
					router.replace("/(tabs)/candidate");
					return;
				}

				setStep("OTP");
				setTimer(60);
				return;
			}

			if(step==="OTP"){
				if(otp.length!==6){
					Alert.alert("Enter 6 digit OTP");
					return;
				}

				await verifyOtpApi(phone,otp);
				await saveCandidateSession();
				router.replace("/(tabs)/candidate");
			}
		}catch(err:any){
			Alert.alert("Error",err.message);
		}finally{
			setLoading(false);
		}
	};

	if(checking){
		return(
			<View style={styles.container}>
				<Text style={{color:"#fff",fontWeight:"700"}}>Checking login...</Text>
			</View>
		);
	}

	return(
		<View style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.title}>
					{step==="FORM" ? "Candidate Login" : "Verify OTP"}
				</Text>

				{step==="FORM" && (
					<>
						<TextInput
							placeholder="Full Name"
							value={fullName}
							onChangeText={setFullName}
							style={styles.input}
						/>

						<TextInput
							placeholder="Phone Number"
							keyboardType="number-pad"
							maxLength={10}
							value={phone}
							onChangeText={t=>setPhone(t.replace(/\D/g,""))}
							style={styles.input}
						/>
					</>
				)}

				{step==="OTP" && (
					<>
						<TextInput
							placeholder="Enter OTP"
							keyboardType="number-pad"
							maxLength={6}
							value={otp}
							onChangeText={setOtp}
							style={styles.input}
						/>

						{timer>0
							?<Text style={styles.note}>OTP valid {timer}s</Text>
							:<Text style={styles.note}>Request new OTP</Text>
						}
					</>
				)}

				<TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
					<Text style={styles.buttonText}>
						{loading ? "Please wait..." : "Continue"}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles=StyleSheet.create({
	container:{flex:1,justifyContent:"center",alignItems:"center",padding:20,backgroundColor:"#0A1F44"},
	card:{width:"100%",backgroundColor:"#fff",padding:20,borderRadius:16},
	title:{fontSize:22,fontWeight:"700",marginBottom:20,textAlign:"center"},
	input:{height:50,borderWidth:1,borderColor:"#ddd",borderRadius:12,paddingHorizontal:15,marginBottom:12},
	button:{backgroundColor:"#0A1F44",height:50,borderRadius:12,justifyContent:"center",alignItems:"center"},
	buttonText:{color:"#fff",fontWeight:"600",fontSize:16},
	note:{textAlign:"center",color:"#777",marginBottom:10}
});