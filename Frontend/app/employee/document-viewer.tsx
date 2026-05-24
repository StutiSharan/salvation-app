import {
 View,
 Text,
 StyleSheet,
 TouchableOpacity,
 Image,
 Alert
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";
import AppLoader from "../../components/Loader";

import { useEffect,useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployeeDocumentsApi } from "../../api/employeeApi";
import { useLocalSearchParams } from "expo-router";

import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

/* ======================= */

export default function DocumentViewer(){

 const params = useLocalSearchParams();
 const type = params.type as string;

 const [loading,setLoading] = useState(true);
 const [docUrl,setDocUrl] = useState<string | null>(null);
 const [downloading,setDownloading] = useState(false);

 const isOfferLetter = type === "offerLetter";

 const titles:any={
  uanLetter:"UAN Document",
  offerLetter:"Offer Letter",
  esicSlip:"ESIC Slip"
 };

 const title = titles[type] || "Document";

/* ================= LOAD ================= */

 useEffect(()=>{ load() },[]);

const load=async()=>{
	try{
		const id=await AsyncStorage.getItem("employeeId");
		const token=await AsyncStorage.getItem("employeeToken");
		if(!id||!token) return;

		const docs=await getEmployeeDocumentsApi(id,token);

		const value=docs?.companyUploads?.[type];

		if(!value){
			Alert.alert("No document uploaded");
			return;
		}

		let url="";

		if(typeof value==="string"){
			url=`${process.env.EXPO_PUBLIC_API_URL}/${value}`;
		}else{
			url=value?.url || "";
		}

		if(!url){
			Alert.alert("No document uploaded");
			return;
		}

		setDocUrl(url);

	}catch(e){
		console.log("document load error",e);
		Alert.alert("Error loading document");
	}finally{
		setLoading(false);
	}
};

const handleDownload = async()=>{
 if(!docUrl) return;

 try{
  setDownloading(true);

  const fileName =
    docUrl.split("/").pop()?.split("?")[0] || "document";

  const fileUri =
    FileSystem.cacheDirectory + fileName;

  const result =
    await FileSystem.downloadAsync(docUrl,fileUri);

  // open share sheet → user saves to device
  await Sharing.shareAsync(result.uri);

 }catch(e){
  console.log(e);
  Alert.alert("Download failed");
 }finally{
  setDownloading(false);
 }
};;
/* ================= OFFER LETTER OPEN ================= */

 const openDocument = ()=>{
  if(!docUrl) return;
  Linking.openURL(docUrl);
 };

/* ======================= */

 return(
 <View style={styles.container}>
 <StatusBar style="light"/>

 <LinearGradient colors={["#1E3C72","#2A5298"]} style={styles.header}>
  <View style={styles.navbar}>
   <BackButton/>
   <Text style={styles.navTitle}>{title}</Text>
  </View>
 </LinearGradient>

 <View style={styles.body}>

 {!loading && !docUrl && (
  <Text style={styles.empty}>Document not available</Text>
 )}

 {/* OFFER LETTER CARD */}
 {!loading && docUrl && isOfferLetter && (
  <TouchableOpacity style={styles.pdfCard} onPress={openDocument}>
   <Ionicons name="document-text" size={90} color="#E53935"/>
   <Text style={styles.pdfTitle}>Offer Letter</Text>
   <Text style={styles.pdfSub}>Tap to view</Text>
  </TouchableOpacity>
 )}

 {/* IMAGE PREVIEW */}
 {!loading && docUrl && !isOfferLetter && (
  <Image
   source={{ uri: docUrl }}
   style={styles.fullImage}
   resizeMode="contain"
  />
 )}

 </View>

 {/* DOWNLOAD BUTTON */}
 {docUrl && !loading && (
  <TouchableOpacity
   style={styles.downloadBtn}
   onPress={handleDownload}
   disabled={downloading}
  >
   <Ionicons name="download-outline" size={20} color="#fff"/>
   <Text style={styles.downloadText}>
    {downloading ? "Downloading..." : "Download Document"}
   </Text>
  </TouchableOpacity>
 )}

 {/* LOADER */}
 {(loading || downloading) && (
  <View style={styles.loadingOverlay}>
   <AppLoader size={90}/>
   <Text style={styles.loadingText}>
    {downloading ? "Downloading..." : "Loading document..."}
   </Text>
  </View>
 )}

 </View>
 );
}

/* ======================= */

const styles=StyleSheet.create({

 container:{flex:1,backgroundColor:"#000"},

 header:{
  paddingTop:55,
  paddingBottom:20,
  paddingHorizontal:20,
  borderBottomLeftRadius:26,
  borderBottomRightRadius:26
 },

 navbar:{flexDirection:"row",alignItems:"center",gap:10},
 navTitle:{color:"#fff",fontSize:18,fontWeight:"700"},

 body:{
  flex:1,
  justifyContent:"center",
  alignItems:"center",
  padding:20
 },

 fullImage:{
  width:"100%",
  height:"100%",
  borderRadius:16
 },

 empty:{color:"#fff"},

 pdfCard:{
  width:"100%",
  backgroundColor:"#fff",
  borderRadius:20,
  padding:40,
  alignItems:"center",
  elevation:6
 },

 pdfTitle:{
  marginTop:14,
  fontSize:18,
  fontWeight:"700",
  color:"#333"
 },

 pdfSub:{
  marginTop:4,
  color:"#888"
 },

 downloadBtn:{
  position:"absolute",
  bottom:30,
  left:20,
  right:20,
  backgroundColor:"#1E3C72",
  height:56,
  borderRadius:16,
  justifyContent:"center",
  alignItems:"center",
  flexDirection:"row",
  gap:8
 },

 downloadText:{
  color:"#fff",
  fontSize:16,
  fontWeight:"700"
 },

 loadingOverlay:{
  position:"absolute",
  top:0,
  left:0,
  right:0,
  bottom:0,
  backgroundColor:"rgba(0,0,0,0.6)",
  justifyContent:"center",
  alignItems:"center"
 },

 loadingText:{
  marginTop:12,
  fontWeight:"600",
  color:"#fff"
 }

});