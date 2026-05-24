import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function EmployeeIndex(){
  useEffect(()=>{
    const check=async()=>{
      const token = await AsyncStorage.getItem("employeeToken");

      if(token){
        router.replace("/employee/dashboard");
      }else{
        router.replace("/employee");
      }
    };

    check();
  },[]);

  return null;
}
