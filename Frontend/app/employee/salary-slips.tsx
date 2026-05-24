import {
 View,
 Text,
 StyleSheet,
 TouchableOpacity,
 ScrollView,
 ActivityIndicator,
 Modal,
 Alert
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { getEmployeeDocumentsApi } from "../../api/employeeApi";
import AppLoader from "../../components/Loader";

/* ================= MONTH CONFIG ================= */

const MONTHS=[
 "Jan","Feb","Mar","Apr","May","Jun",
 "Jul","Aug","Sep","Oct","Nov","Dec"
];

const MONTH_INDEX:any={
 Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,
 Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11
};

const normalizeMonth=(m:any)=>{
 if(!m || typeof m!=="string") return null;
 const short=m.substring(0,3);
 const formatted=short.charAt(0).toUpperCase()+short.slice(1).toLowerCase();
 if(MONTH_INDEX[formatted]===undefined) return null;
 return formatted;
};

const getMonthYearLabel=(month:string,year:number)=>{
 return new Date(year,MONTH_INDEX[month]).toLocaleString("en",{
  month:"long",
  year:"numeric"
 });
};

/* ================= TYPES ================= */

type Slip={
 id:string;
 key:string;
 url:string;
 month:string;
 year:number;
 date:Date;
};

/* ================================================= */

export default function SalarySlips(){

 const [loading,setLoading]=useState(true);
 const [slips,setSlips]=useState<Slip[]>([]);
 const [calendarYear,setCalendarYear]=useState(new Date().getFullYear());

 const [fromDate,setFromDate]=useState<Date|null>(null);
 const [toDate,setToDate]=useState<Date|null>(null);

 const [pickerOpen,setPickerOpen]=useState(false);
 const [pickerType,setPickerType]=useState<"from"|"to">("from");

 const [downloadingKey,setDownloadingKey]=useState<string | null>(null);
const [page,setPage]=useState(1);
const PER_PAGE=12;
/* ================= LOAD DATA ================= */

useEffect(()=>{load()},[]);

const load=async()=>{
 try{
  const id=await AsyncStorage.getItem("employeeId");
  const token=await AsyncStorage.getItem("employeeToken");
  if(!id||!token) return;

  const docs=await getEmployeeDocumentsApi(id,token);
  const list=docs.salarySlips||[];

  const parsed:Slip[]=[];

  for(const s of list){

   const month=normalizeMonth(s.month);
   const year=Number(s.year);

   if(!month || !year || !s.key || !s.url) continue;

 parsed.push({
 id:`${s.month}-${s.year}-${s.uploadedAt || Math.random()}`,
 key:s.key,
 url:s.url,
 month,
 year,
 date:new Date(year,MONTH_INDEX[month],1)
});
  }

  parsed.sort((a,b)=>b.date.getTime()-a.date.getTime());
  setSlips(parsed);

 }catch(e){
  console.log("LOAD ERROR",e);
 }finally{
  setLoading(false);
 }
};

/* ================= FILTER ================= */

const filtered=slips.filter(s=>{
 if(fromDate && s.date<fromDate) return false;
 if(toDate && s.date>toDate) return false;
 return true;
});
const totalPages=Math.ceil(filtered.length/PER_PAGE);

const paginated=filtered.slice(
	(page-1)*PER_PAGE,
	page*PER_PAGE
);
/* ================= SELECT MONTH ================= */

const selectMonth=(month:string,year:number)=>{
 const start=new Date(year,MONTH_INDEX[month],1);
 const end=new Date(year,MONTH_INDEX[month]+1,0);

 if(pickerType==="from") setFromDate(start);
 else setToDate(end);

 setPage(1);
 setPickerOpen(false);
};

const resetFilters=()=>{
	setFromDate(null);
	setToDate(null);
	setPage(1);
};

/* ================= DOWNLOAD ================= */

const downloadSlip=async(item:Slip)=>{
 try{
 setDownloadingKey(item.id);

  const fileName =
    item.url.split("/").pop()?.split("?")[0] || "salary-slip";

  const fileUri =
    FileSystem.cacheDirectory + fileName;

  const result =
    await FileSystem.downloadAsync(item.url,fileUri);

  await Sharing.shareAsync(result.uri);

 }catch(e){
  console.log(e);
  Alert.alert("Download failed");
 }finally{
  setDownloadingKey(null);
 }
};

/* ================= LOADER ================= */

if(loading){
 return(
  <View style={styles.loadingOverlay}>
   <AppLoader size={90} color="#1E3C72"/>
  </View>
 );
}

/* ================= UI ================= */

return(
<View style={styles.container}>
<StatusBar style="light"/>

{/* HEADER */}
<LinearGradient colors={["#1E3C72","#2A5298"]} style={styles.header}>
 <View style={styles.navbar}>
  <BackButton/>
  <Text style={styles.navTitle}>Salary Slips</Text>
 </View>
</LinearGradient>

<ScrollView>

{/* FILTER */}
<View style={styles.card}>

<View style={styles.filterHeader}>
<Text style={styles.section}>Filter by Month Range</Text>

<TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
 <Ionicons name="refresh" size={14} color="#fff"/>
 <Text style={styles.resetText}>Reset</Text>
</TouchableOpacity>
</View>

<View style={styles.rangeRow}>

<TouchableOpacity
 style={styles.rangeBtn}
 onPress={()=>{setPickerType("from");setPickerOpen(true)}}
>
<Text style={styles.rangeText}>
{fromDate?fromDate.toLocaleString("en",{month:"short",year:"numeric"}):"From"}
</Text>
</TouchableOpacity>

<TouchableOpacity
 style={styles.rangeBtn}
 onPress={()=>{setPickerType("to");setPickerOpen(true)}}
>
<Text style={styles.rangeText}>
{toDate?toDate.toLocaleString("en",{month:"short",year:"numeric"}):"To"}
</Text>
</TouchableOpacity>

</View>
</View>

{/* LIST */}
<View style={styles.card}>

{filtered.length===0 && (
 <Text style={styles.empty}>No salary slips found</Text>
)}

{paginated.map(item=>(
<View key={item.id} style={styles.row}>

<Text style={styles.rowText}>
 {getMonthYearLabel(item.month,item.year)}
</Text>

<View style={styles.actionWrap}>

<TouchableOpacity
 style={styles.iconBtn}
 onPress={()=>Linking.openURL(item.url)}
>
 <Ionicons name="eye-outline" size={20} color="#1E3C72"/>
</TouchableOpacity>

<TouchableOpacity
 style={styles.iconBtn}
 onPress={()=>downloadSlip(item)}
disabled={downloadingKey===item.id}>
 {downloadingKey===item.id
  ? <ActivityIndicator size="small" color="#1E3C72"/>
  : <Ionicons name="download-outline" size={20} color="#1E3C72"/>
 }
</TouchableOpacity>

</View>

</View>
))}
{filtered.length>PER_PAGE && (
	<View style={styles.pagination}>
		<TouchableOpacity
			style={[styles.pageBtn,page===1 && styles.pageBtnDisabled]}
			disabled={page===1}
			onPress={()=>setPage(p=>p-1)}
		>
			<Text style={styles.pageText}>Prev</Text>
		</TouchableOpacity>

		<Text style={styles.pageInfo}>
			Page {page} of {totalPages}
		</Text>

		<TouchableOpacity
			style={[styles.pageBtn,page===totalPages && styles.pageBtnDisabled]}
			disabled={page===totalPages}
			onPress={()=>setPage(p=>p+1)}
		>
			<Text style={styles.pageText}>Next</Text>
		</TouchableOpacity>
	</View>
)}
</View>

</ScrollView>

{/* ================= CALENDAR ================= */}

<Modal visible={pickerOpen} transparent animationType="slide">
<View style={styles.modalWrap}>
<View style={styles.modalCard}>

<View style={styles.calendarHeader}>
<TouchableOpacity onPress={()=>setCalendarYear(y=>y-1)}>
<Ionicons name="chevron-back" size={26} color="#1E3C72"/>
</TouchableOpacity>

<Text style={styles.calendarYear}>{calendarYear}</Text>

<TouchableOpacity onPress={()=>setCalendarYear(y=>y+1)}>
<Ionicons name="chevron-forward" size={26} color="#1E3C72"/>
</TouchableOpacity>
</View>

<View style={styles.calendarGrid}>
{MONTHS.map(m=>(
<TouchableOpacity
 key={calendarYear+"-"+m}
 style={styles.calendarMonth}
 onPress={()=>selectMonth(m,calendarYear)}
>
<Text style={styles.calendarMonthText}>{m}</Text>
</TouchableOpacity>
))}
</View>

<TouchableOpacity style={styles.closeBtn} onPress={()=>setPickerOpen(false)}>
<Text style={{color:"#fff"}}>Close</Text>
</TouchableOpacity>

</View>
</View>
</Modal>

</View>
);
}

/* ================= STYLES ================= */

const styles=StyleSheet.create({

container:{flex:1,backgroundColor:"#F4F6FA"},

header:{
 paddingTop:55,
 paddingBottom:50,
 paddingHorizontal:20,
 borderBottomLeftRadius:26,
 borderBottomRightRadius:26
},

navbar:{flexDirection:"row",alignItems:"center",gap:10},
navTitle:{color:"#fff",fontSize:18,fontWeight:"700"},

card:{
 backgroundColor:"#fff",
 margin:20,
 padding:18,
 borderRadius:20,
 elevation:6
},

filterHeader:{
 flexDirection:"row",
 justifyContent:"space-between",
 alignItems:"center",
 marginBottom:10
},

resetBtn:{
 backgroundColor:"#EB8305",
 paddingHorizontal:14,
 paddingVertical:8,
 borderRadius:20,
 flexDirection:"row",
 alignItems:"center",
 gap:6
},

resetText:{color:"#fff",fontWeight:"700"},

section:{fontWeight:"700",marginBottom:10,color:"#1E3C72"},

rangeRow:{flexDirection:"row",justifyContent:"space-between"},

rangeBtn:{
 backgroundColor:"#F8FAFF",
 padding:12,
 borderRadius:12,
 width:"48%",
 alignItems:"center"
},

rangeText:{fontWeight:"600",color:"#1E3C72"},

row:{
 flexDirection:"row",
 justifyContent:"space-between",
 alignItems:"center",
 paddingVertical:14,
 borderBottomWidth:1,
 borderColor:"#EEE"
},

rowText:{fontWeight:"600",color:"#1E3C72"},

actionWrap:{
 flexDirection:"row",
 alignItems:"center",
 gap:12
},

iconBtn:{
 width:38,
 height:38,
 borderRadius:10,
 backgroundColor:"#F1F5FF",
 justifyContent:"center",
 alignItems:"center"
},

empty:{textAlign:"center",color:"#999"},

modalWrap:{
 flex:1,
 justifyContent:"flex-end",
 backgroundColor:"rgba(0,0,0,0.4)"
},

modalCard:{
 backgroundColor:"#fff",
 padding:20,
 borderTopLeftRadius:20,
 borderTopRightRadius:20
},

calendarHeader:{
 flexDirection:"row",
 justifyContent:"space-between",
 alignItems:"center",
 marginBottom:20
},

calendarYear:{fontSize:20,fontWeight:"700",color:"#1E3C72"},

calendarGrid:{
 flexDirection:"row",
 flexWrap:"wrap",
 justifyContent:"space-between",
 rowGap:14
},

calendarMonth:{
 width:"30%",
 backgroundColor:"#F8FAFF",
 paddingVertical:14,
 borderRadius:14,
 alignItems:"center",
 elevation:2
},

calendarMonthText:{fontWeight:"600",color:"#1E3C72"},

closeBtn:{
 backgroundColor:"#1E3C72",
 padding:14,
 borderRadius:12,
 alignItems:"center",
 marginTop:20
},

loadingOverlay:{
 flex:1,
 justifyContent:"center",
 alignItems:"center",
 backgroundColor:"#fff"
},
pagination:{
	flexDirection:"row",
	justifyContent:"space-between",
	alignItems:"center",
	marginTop:18
},
pageBtn:{
	backgroundColor:"#1E3C72",
	paddingHorizontal:18,
	paddingVertical:10,
	borderRadius:12
},
pageBtnDisabled:{
	backgroundColor:"#B0BEC5"
},
pageText:{
	color:"#fff",
	fontWeight:"700"
},
pageInfo:{
	fontWeight:"700",
	color:"#1E3C72"
}

});