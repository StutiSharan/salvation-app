import { Tabs, usePathname } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";

export default function TabsLayout(){
  const pathname = usePathname();

  // ✅ CONDITION: dark bg ONLY for employee page
  const isEmployeePage = pathname === "/employee";

  return(
    <View style={{ flex: 1, backgroundColor: isEmployeePage ? "#0A1F44" : "transparent" }}>
      <Tabs
        screenOptions={{
          headerShown:false,

          tabBarActiveTintColor:"#0A1F44",
          tabBarInactiveTintColor:"#90a4ae",

          // Floating white tab bar
          tabBarStyle:{
            height:65,
            paddingBottom:8,
            paddingTop:8,
            backgroundColor:"#ffffff",
            borderTopWidth:0,
            elevation:12,
            marginBottom:12,
            marginHorizontal:14,
            borderRadius:18
          },

          // 👇 Let page / layout bg show through
          tabBarBackground:() => (
            <View style={{ flex:1, backgroundColor:"transparent" }} />
          ),

          tabBarLabelStyle:{
            fontSize:12,
            fontWeight:"600"
          }
        }}
      >
        <Tabs.Screen
          name="candidate"
          options={{
            title:"New Candidate",
            tabBarIcon:({color,size})=>(
              <MaterialIcons
                name="person-add-alt-1"
                size={size}
                color={color}
              />
            )
          }}
        />
<Tabs.Screen
					name="jobs"
					options={{
						title:"Jobs",
						tabBarIcon:({color,size})=>(
							<Ionicons name="document-text-outline" size={size} color={color}/>
						)
					}}
				/>
        <Tabs.Screen
          name="employee"
          options={{
            title:"Employee",
            tabBarIcon:({color,size})=>(
              <Ionicons
                name="briefcase-outline"
                size={size}
                color={color}
              />
            )
          }}
        />
      </Tabs>
    </View>
  );
}
