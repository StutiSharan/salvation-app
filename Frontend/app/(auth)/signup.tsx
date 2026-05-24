import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";


export default function Signup(){
return(
<View style={{flex:1,justifyContent:"center",padding:20}}>
<Text style={{fontSize:24,fontWeight:"700",marginBottom:20}}>Candidate Signup</Text>
<TextInput placeholder="Full Name" style={{borderWidth:1,padding:12,marginBottom:12}} />
<TextInput placeholder="Email" style={{borderWidth:1,padding:12,marginBottom:12}} />
<TextInput placeholder="Password" secureTextEntry style={{borderWidth:1,padding:12}} />
<TouchableOpacity style={{backgroundColor:"#0A1F44",padding:15,marginTop:20}} onPress={()=>router.replace("/(tabs)/candidate")}>
<Text style={{color:"#fff",textAlign:"center"}}>Create Account</Text>
</TouchableOpacity>
</View>
);
}