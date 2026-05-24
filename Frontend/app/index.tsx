import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

export default function Index(){
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      setLoading(false);
    },2000);
    return()=>clearTimeout(timer);
  },[]);

  if(loading){
    return(
      <View style={{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#0A1F44"}}>
        <Text style={{color:"#fff",fontSize:24,fontWeight:"700"}}>SOS Pvt Ltd.</Text>
        <Text style={{color:"#cfd8dc",marginVertical:10}}>Employment & Staffing Solutions</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return <Redirect href="/login" />;
}
