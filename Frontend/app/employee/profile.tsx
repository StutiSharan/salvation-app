import {
 View,
 Text,
 StyleSheet,
 ScrollView,
 TouchableOpacity,
 Alert,
 Image,
 ActivityIndicator,
 Linking,
 TextInput
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import * as ImagePicker from "expo-image-picker"
import BackButton from "../../components/BackButton"
import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
 getEmployeeProfile,
 updateEmployeeProfileApi,
 getEmployeeProfilePhotoApi,
 getEmployeeDocumentsApi
} from "../../api/employeeApi"
import AppLoader from "../../components/Loader"

/* ================= TYPES ================= */

type DocItem={
 key:string
 url:string
 type:"image"|"pdf"
}

/* ================= COMPONENT ================= */

export default function Profile(){

 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [docLoading,setDocLoading]=useState(true)

 const [mode,setMode]=useState<"VIEW"|"EDIT">("VIEW")

 const [employeeId,setEmployeeId]=useState("")
 const [token,setToken]=useState("")

 const [profileImage,setProfileImage]=useState<any>(null)

 const [fullName,setFullName]=useState("")
 const [fatherName,setFatherName]=useState("")
 const [mobile,setMobile]=useState("")
 const [address,setAddress]=useState("")

 const [documents,setDocuments]=useState<DocItem[]>([])
 const [previewImage,setPreviewImage]=useState<string|null>(null)

 const PHOTO_CACHE_KEY="EMPLOYEE_PROFILE_PHOTO"

 /* ================= LOAD DATA ================= */

 useEffect(()=>{
  (async()=>{
   try{

    const empId=await AsyncStorage.getItem("employeeId")
    const tok=await AsyncStorage.getItem("employeeToken")
    if(!empId||!tok) return

    setEmployeeId(empId)
    setToken(tok)

    /* ===== CLEAR OLD DOC CACHE (IMPORTANT) ===== */
    await AsyncStorage.removeItem("EMPLOYEE_DOC_CACHE")

    /* ===== PROFILE ===== */
    const profileRes=await getEmployeeProfile(empId)
    const emp=profileRes.employee

    setFullName(emp.fullName||"")
    setFatherName(emp.fatherName||"")
    setMobile(emp.mobile||"")
    setAddress(emp.address||"")

    /* ===== PROFILE PHOTO ===== */
    const cachedPhoto=await AsyncStorage.getItem(PHOTO_CACHE_KEY)

    if(cachedPhoto){
     setProfileImage({uri:cachedPhoto})
    }else{
     const photoRes=await getEmployeeProfilePhotoApi(empId,tok)
     if(photoRes?.profilePhoto){
      setProfileImage({uri:photoRes.profilePhoto})
      await AsyncStorage.setItem(PHOTO_CACHE_KEY,photoRes.profilePhoto)
     }
    }

    /* ===== EMPLOYEE DOCUMENTS ===== */

    const docsRes=await getEmployeeDocumentsApi(empId,tok)

    const uploads=docsRes?.employeeUploads || {}

    const flat:DocItem[]=[]

    Object.entries(uploads).forEach(([key,value])=>{

     if(!value) return

     const item=value as { key?:string; url?:string }

     const url=item?.url
     const fileKey=item?.key

     if(!url) return

     const extension=fileKey?.split(".").pop()?.toLowerCase()
     const isPdf=extension==="pdf"

     flat.push({
      key,
      url,
      type:isPdf?"pdf":"image"
     })
    })

    setDocuments(flat)

   }catch(err){
    Alert.alert("Error","Failed to load profile")
   }finally{
    setLoading(false)
    setDocLoading(false)
   }
  })()
 },[])

 /* ================= IMAGE PICKER ================= */

const pickImage=async()=>{
	const perm=await ImagePicker.requestMediaLibraryPermissionsAsync()
	if(!perm.granted){
		Alert.alert("Permission Required","Please allow gallery access")
		return
	}

	const res=await ImagePicker.launchImageLibraryAsync({
		mediaTypes:ImagePicker.MediaTypeOptions.Images,
		quality:0.7
	})

	if(!res.canceled){
		const img=res.assets[0]
		setProfileImage(img)

		try{
			setSaving(true)

			await updateEmployeeProfileApi(employeeId,token,{
				fullName,
				fatherName,
				mobile,
				address,
				profilePhoto:img
			})

			await AsyncStorage.removeItem(PHOTO_CACHE_KEY)
			Alert.alert("Success","Profile photo updated")
		}catch(err){
			Alert.alert("Error","Failed to update profile photo")
		}finally{
			setSaving(false)
		}
	}
}

 /* ================= SAVE PROFILE ================= */

 const saveProfile=async()=>{
  if(!fullName||!fatherName||!mobile||!address){
   Alert.alert("Required","All fields required")
   return
  }

  try{
   setSaving(true)

   await updateEmployeeProfileApi(employeeId,token,{
    fullName,
    fatherName,
    mobile,
    address,
    profilePhoto:
     profileImage?.uri?.startsWith("file://")?profileImage:undefined
   })

   await AsyncStorage.removeItem(PHOTO_CACHE_KEY)
   Alert.alert("Success","Profile updated")
   setMode("VIEW")

  }catch{
   Alert.alert("Error","Failed to update profile")
  }finally{
   setSaving(false)
  }
 }

 if(loading){
  return(
   <View style={styles.loadingOverlay}>
    <AppLoader size={50} color="#1E3C72"/>
    <Text style={styles.loadingText}>Loading...</Text>
   </View>
  )
 }

 /* ================= UI ================= */

 return(
 <View style={styles.container}>
  <StatusBar style="light"/>

  <LinearGradient colors={["#1E3C72","#2A5298"]} style={styles.header}>
   <View style={styles.navbar}>
    <BackButton/>
    <Text style={styles.navTitle}>My Profile</Text>
   </View>
  </LinearGradient>

  <ScrollView>

   {/* AVATAR */}
  <View style={styles.avatarSection}>
	<View style={styles.avatarBox}>
		<View style={styles.avatarWrapper}>
			<Image
				source={
					profileImage
						?{uri:profileImage.uri}
						:require("../../assets/images/Myprofile.png")
				}
				style={styles.avatar}
			/>
		</View>

		<TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
			<Ionicons name="camera" size={20} color="#fff"/>
		</TouchableOpacity>
	</View>

	<Text style={styles.name}>{fullName}</Text>
</View>

   {/* PROFILE INFO */}
   <View style={styles.card}>
    {mode==="EDIT"?(
     <>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name"/>
      <TextInput style={styles.input} value={fatherName} onChangeText={setFatherName} placeholder="Father Name"/>
      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="Mobile"/>
      <TextInput style={[styles.input,{height:80}]} value={address} onChangeText={setAddress} placeholder="Address" multiline/>

      <TouchableOpacity style={styles.editBtn} onPress={saveProfile}>
       <Text style={styles.editText}>{saving?"Saving...":"Save Profile"}</Text>
      </TouchableOpacity>
     </>
    ):(
     <>
      <InfoRow icon="person-outline" value={fullName}/>
      <InfoRow icon="people-outline" value={fatherName}/>
      <InfoRow icon="call-outline" value={mobile}/>
      <InfoRow icon="location-outline" value={address}/>

      <TouchableOpacity style={styles.editBtn} onPress={()=>setMode("EDIT")}>
       <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>
     </>
    )}
   </View>

   {/* DOCUMENTS */}
   <View style={styles.card}>
    <Text style={styles.sectionTitle}>My Documents</Text>

    {docLoading?(
      <ActivityIndicator/>
    ):documents.length===0?(
      <Text style={styles.empty}>No documents uploaded</Text>
    ):(
      <View style={styles.grid}>
        {documents.map(doc=>(
          <TouchableOpacity
           key={doc.key}
           style={styles.item}
           onPress={async()=>{
            if(doc.type==="pdf"){
             try{
              await Linking.openURL(doc.url)
             }catch{
              Alert.alert("Unable to open document")
             }
            }else{
             setPreviewImage(doc.url)
            }
           }}
          >
            <View style={styles.itemInner}>
              {doc.type==="image"?(
                <Image
                 source={{uri:doc.url}}
                 style={styles.thumb}
                 resizeMode="cover"
                 onError={()=>Alert.alert("Failed to load image")}
                />
              ):(
                <>
                  <Ionicons name="document-text" size={36} color="#E53935"/>
                  <Text style={styles.pdfText}>PDF</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )}
   </View>

  </ScrollView>

  {/* IMAGE PREVIEW */}
  {previewImage&&(
   <View style={styles.preview}>
    <TouchableOpacity style={styles.close} onPress={()=>setPreviewImage(null)}>
     <Ionicons name="close" size={30} color="#fff"/>
    </TouchableOpacity>
    <Image source={{uri:previewImage}} style={styles.previewImage} resizeMode="contain"/>
   </View>
  )}

 </View>
 )
}

/* ================= SMALL ================= */

const InfoRow=({icon,value}:any)=>(
 <View style={styles.infoRow}>
  <Ionicons name={icon} size={18} color="#1E3C72"/>
  <Text style={styles.infoText}>{value||"-"}</Text>
 </View>
)

/* ================= STYLES ================= */

const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:"#F4F6FA"},
 header:{height:120,paddingTop:50,paddingHorizontal:20,borderBottomLeftRadius:26,borderBottomRightRadius:26},
 navbar:{flexDirection:"row",alignItems:"center"},
 navTitle:{color:"#fff",fontSize:18,fontWeight:"700",marginLeft:8},

 avatarSection:{alignItems:"center",marginTop:20},
 name:{fontSize:18,fontWeight:"700",marginTop:10},
 avatarWrapper:{width:110,height:110,borderRadius:55,overflow:"hidden",backgroundColor:"#fff",elevation:6},
 avatar:{width:"100%",height:"100%"},

 card:{backgroundColor:"#fff",margin:20,borderRadius:18,padding:18,elevation:4},
 infoRow:{flexDirection:"row",alignItems:"center",paddingVertical:8},
 infoText:{marginLeft:12,fontWeight:"600"},

 input:{borderWidth:1,borderColor:"#e0e0e0",borderRadius:12,padding:12,marginBottom:12,backgroundColor:"#fafafa"},
 editBtn:{marginTop:16,backgroundColor:"#1E3C72",height:46,borderRadius:24,justifyContent:"center",alignItems:"center"},
 editText:{color:"#fff",fontWeight:"700"},

 sectionTitle:{fontSize:16,fontWeight:"700",marginBottom:12},
 grid:{flexDirection:"row",flexWrap:"wrap"},
 item:{width:"33.333%",padding:6},
 itemInner:{height:100,borderRadius:10,backgroundColor:"#F4F6FA",justifyContent:"center",alignItems:"center",overflow:"hidden"},
 thumb:{width:"100%",height:"100%"},
 pdfText:{fontSize:11,marginTop:4,fontWeight:"600",color:"#E53935"},
 empty:{textAlign:"center",color:"#90a4ae"},

 preview:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0,0,0,0.9)",justifyContent:"center",alignItems:"center"},
 previewImage:{width:"90%",height:"80%"},
 close:{position:"absolute",top:50,right:20},
avatarBox:{
	position:"relative"
},
cameraBtn:{
	position:"absolute",
	right:0,
	bottom:4,
	width:34,
	height:34,
	borderRadius:17,
	backgroundColor:"#1E3C72",
	justifyContent:"center",
	alignItems:"center",
	elevation:5,
	borderWidth:2,
	borderColor:"#fff"
},
 loadingOverlay:{flex:1,justifyContent:"center",alignItems:"center"},
 loadingText:{marginTop:12,fontWeight:"600",color:"#1E3C72"}
})