import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import BackButton from "../../components/BackButton";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getEmployeeProfile,
  getEmployeeProfilePhotoApi,
} from "../../api/employeeApi";
import { BackHandler } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import * as Location from "expo-location";
import { employeeCheckInApi } from "../../api/employeeApi";
/* IMAGES */
import salarySlip from "../../assets/images/salarySlip.png";
import esic from "../../assets/images/ESIC.png";
import offerLetter from "../../assets/images/OfferLetter.png";
import uan from "../../assets/images/UAN.png";
import upload from "../../assets/images/Upload.png";
import defaultProfile from "../../assets/images/Myprofile.png";
import React from "react";
import AppLoader from "../../components/Loader";
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("Employee Name");

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const id = await AsyncStorage.getItem("employeeId");
        const token = await AsyncStorage.getItem("employeeToken");

        if (!id || !token) {
          Alert.alert("Error", "Employee session missing");
          return;
        }

        setEmployeeId(id);

        /* BASIC PROFILE */
        const res = await getEmployeeProfile(id);
        if (res?.employee) {
          setEmployeeName(res.employee.fullName || "Employee Name");
        }

        /* PROFILE PHOTO – SAME API AS PROFILE SCREEN */
        const photoRes = await getEmployeeProfilePhotoApi(id, token);
        if (photoRes?.profilePhoto) {
          setImageLoading(true);
          setProfileImage(`${photoRes.profilePhoto}?t=${Date.now()}`);
        }
      } catch {
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/(tabs)/employee");
        },
      },
    ]);
  };
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.replace("/(tabs)/candidate");
          return true;
        },
      );

      return () => subscription.remove();
    }, []),
  );
  const reloadProfilePhoto=async()=>{
	try{
		const id=await AsyncStorage.getItem("employeeId")
		const token=await AsyncStorage.getItem("employeeToken")

		if(!id||!token) return

		const photoRes=await getEmployeeProfilePhotoApi(id,token)

		if(photoRes?.profilePhoto){
			setImageLoading(true)
			setProfileImage(`${photoRes.profilePhoto}?t=${Date.now()}`)
		}else{
			setProfileImage(null)
		}
	}catch(err){
		console.log("photo reload error",err)
	}
}
useFocusEffect(
	useCallback(()=>{
		reloadProfilePhoto()
	},[])
)
  const goToProfile = () => {
    setMenuOpen(false);
    router.push({ pathname: "/employee/profile", params: { employeeId } });
  };

 const handleCheckIn = async()=>{
  try{
    setLoading(true);

    const token = await AsyncStorage.getItem("employeeToken");
    if(!employeeId || !token){
      Alert.alert("Error","Session expired");
      return;
    }

    /* ================= ASK PERMISSION ================= */
    const { status } = await Location.requestForegroundPermissionsAsync();

    if(status !== "granted"){
      Alert.alert("Permission denied","Location permission required");
      return;
    }

    /* ================= GET CURRENT LOCATION ================= */
    const loc = await Location.getCurrentPositionAsync({
      accuracy:Location.Accuracy.High
    });

    const latitude = loc.coords.latitude;
    const longitude = loc.coords.longitude;

    /* ================= OPTIONAL ADDRESS ================= */
    const reverse = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    let address = "";
    if(reverse.length>0){
      const a = reverse[0];
      address = `${a.name||""} ${a.street||""} ${a.city||""}`;
    }

    /* ================= SEND TO SERVER ================= */
    await employeeCheckInApi(employeeId,token,{
      latitude,
      longitude,
      address
    });

    Alert.alert("Success","Checked in successfully");

  }catch(err:any){
    Alert.alert("Error",err.message || "Check-in failed");
  }finally{
    setLoading(false);
  }
};

  if (loading || !employeeId) {
    return (
      <View style={styles.loadingOverlay}>
          <AppLoader size={50} color="#1E3C72" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <LinearGradient colors={["#1E3C72", "#2A5298"]} style={styles.header}>
        <View style={styles.topRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <BackButton />
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>

          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PROFILE ROW */}
        <View style={styles.profileRow}>
          <View style={styles.profileCircle}>
            {imageLoading && (
              <View style={styles.avatarLoader}>
                <ActivityIndicator size="small" color="#1E3C72" />
              </View>
            )}
            <Image
              source={profileImage ? { uri: profileImage } : defaultProfile}
              style={[styles.profileImage, imageLoading && { opacity: 0 }]}
              onLoadEnd={() => setImageLoading(false)}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{employeeName}</Text>
            <Text style={styles.empId}>ID: {employeeId}</Text>
          </View>

          <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.checkInText}>Check In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* CARDS */}
      <ScrollView contentContainerStyle={styles.cardWrap}>
        <Card
          image={salarySlip}
          title="Salary Slip"
          onPress={() =>
            router.push({
              pathname: "/employee/salary-slips",
              params: { employeeId },
            })
          }
        />
        <Card
          image={esic}
          title="ESIC Slip"
          onPress={() =>
           router.push({
 pathname:"/employee/document-viewer",
 params:{ type:"esicSlip" }
})
          }
        />
        <Card
          image={offerLetter}
          title="Offer Letter"
          onPress={() =>
           router.push({
 pathname:"/employee/document-viewer",
 params:{ type:"offerLetter" }
})
          }
        />
        <Card
          image={uan}
          title="UAN Document"
          onPress={() =>
           router.push({
 pathname:"/employee/document-viewer",
 params:{ type:"uanLetter" }
})
          }
        />
        <Card
          image={upload}
          title="Upload Docs"
          onPress={() =>
            router.push({
              pathname: "/employee/upload-documents",
              params: { employeeId },
            })
          }
        />
        <Card image={defaultProfile} title="My Profile" onPress={goToProfile} />
      </ScrollView>

      {/* HAMBURGER MENU */}
      <Modal transparent visible={menuOpen} animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheet}>
            <Image
              source={profileImage ? { uri: profileImage } : defaultProfile}
              style={styles.sheetProfile}
            />
            <Text style={styles.sheetName}>{employeeName}</Text>
            <Text style={styles.sheetId}>{employeeId}</Text>

            <TouchableOpacity style={styles.sheetItem} onPress={goToProfile}>
              <Ionicons name="person-outline" size={20} color="#1E3C72" />
              <Text style={styles.sheetText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
              <Text style={[styles.sheetText, { color: "#d32f2f" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      {(loading || !employeeId) && (
  <View style={styles.loadingOverlay}>
    <AppLoader size={50} color="#1E3C72" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
)}
    </View>
  );
}

const Card = ({ image, title, onPress }: any) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.circle}>
      <Image source={image} style={styles.circleImage} />
    </View>
    <Text style={styles.cardText}>{title}</Text>
  </TouchableOpacity>
);

/* STYLES */
const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  header: {
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  loadingOverlay:{
 position:"absolute",
 top:0,
 left:0,
 right:0,
 bottom:0,
 backgroundColor:"rgba(255,255,255,0.7)",
 justifyContent:"center",
 alignItems:"center",
 zIndex:999
},

loadingText:{
 marginTop:12,
 fontWeight:"600",
 color:"#1E3C72"
},
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashboardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },

  profileRow: { flexDirection: "row", alignItems: "center", marginTop: 20 },

  profileCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: { width: "100%", height: "100%" },
  avatarLoader: { position: "absolute", zIndex: 10 },

  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  empId: { color: "#D6E0FF", fontSize: 13 },

  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkInText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  cardWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 20,
  },

  card: {
    width: "48%",
    backgroundColor: "#EEF3FF",
    borderRadius: 20,
    paddingVertical: 26,
    alignItems: "center",
    marginBottom: 18,
    elevation: 4,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  circleImage: { width: "100%", height: "100%" },
  cardText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3C72",
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetProfile: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: "center",
  },
  sheetName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  sheetId: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  sheetText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3C72",
  },
});
