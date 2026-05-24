import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";

export default function Jobs(){
	const openJobs=()=>{
		Linking.openURL("https://sospvtltd.com/jobs");
	};

	return(
		<View style={styles.container}>
			<StatusBar style="light"/>

			<LinearGradient colors={["#0A1F44","#12326B"]} style={styles.header}>
				<View style={styles.navbar}>
					<BackButton/>
					<Text style={styles.navTitle}>Jobs</Text>
				</View>
			</LinearGradient>

			<View style={styles.content}>
				<Ionicons name="briefcase-outline" size={76} color="#0A1F44"/>

				<Text style={styles.title}>Explore Jobs</Text>

				<Text style={styles.subtitle}>
					View latest job openings and apply directly from our website.
				</Text>

				<TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={openJobs}>
					<Text style={styles.buttonText}>Explore Jobs</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

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

	content:{
		flex:1,
		alignItems:"center",
		justifyContent:"center",
		paddingHorizontal:24
	},
	title:{
		fontSize:26,
		fontWeight:"800",
		color:"#0A1F44",
		marginTop:18
	},
	subtitle:{
		fontSize:15,
		color:"#78909c",
		textAlign:"center",
		marginTop:10,
		marginBottom:28,
		lineHeight:22
	},
	button:{
		backgroundColor:"#0A1F44",
		paddingVertical:15,
		paddingHorizontal:34,
		borderRadius:16,
		elevation:4
	},
	buttonText:{
		color:"#fff",
		fontSize:16,
		fontWeight:"700"
	}
});