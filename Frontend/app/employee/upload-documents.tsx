import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { ActivityIndicator } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { uploadEmployeeDocumentsApi } from "../../api/employeeApi";
import { useLocalSearchParams, router } from "expo-router";

/* ---------------- TYPES ---------------- */
type FileType = {
  uri: string;
  name: string;
  type: string;
};

/* ---------------- ROW COMPONENT ---------------- */
const UploadRow = ({
  label,
  value,
  onPress,
  isOptional = false,
}: {
  label: string;
  value?: FileType;
  onPress: () => void;
  isOptional?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.rowLeft}>
      <Ionicons name="document-text-outline" size={20} color="#1E3C72" />
      <Text style={styles.rowText}>
        {label}{" "}
        {isOptional && <Text style={{ color: "#90a4ae" }}>(Optional)</Text>}
      </Text>
    </View>

    <View style={styles.plusBtn}>
      <Ionicons name={value ? "checkmark" : "add"} size={20} color="#fff" />
    </View>
  </TouchableOpacity>
);

export default function UploadDocuments() {
  const params = useLocalSearchParams();

  const employeeId =
    typeof params.employeeId === "string"
      ? params.employeeId
      : Array.isArray(params.employeeId)
        ? params.employeeId[0]
        : "";

  const [token, setToken] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);

  const [files, setFiles] = useState<{
    aadhaar?: FileType;
    pan?: FileType;
    bankPassbook?: FileType;
    marksheet12?: FileType;
    graduation?: FileType;
  }>({});

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem("employeeToken");
      if (!storedToken) {
        Alert.alert("Session expired", "Please login again");
        router.replace("/employee");
        return;
      }
      if (!employeeId) {
        Alert.alert("Error", "Employee ID missing");
        router.back();
        return;
      }
      setToken(storedToken);
    })();
  }, []);

const pickDocument = async (field: keyof typeof files) => {
  const res = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true,
    type: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ],
  });

  if (res.canceled) return;

  let file = res.assets[0];

  // 🔥 Compress ONLY images
  if (file.mimeType?.startsWith("image/")) {
    const compressed = await ImageManipulator.manipulateAsync(
      file.uri,
      [{ resize: { width: 1200 } }], // resize
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    file = {
      uri: compressed.uri,
      name: file.name || "image.jpg",
      mimeType: "image/jpeg",
    } as any;
  }

  setFiles(prev => ({
    ...prev,
    [field]: {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    },
  }));
};


 const handleUpload = async () => {
  try {
    if (!token || uploading) return;

    if (Object.keys(files).length === 0) {
      Alert.alert("No files selected", "Please select at least one document");
      return;
    }

    setUploading(true); // 👈 START LOADING

    await uploadEmployeeDocumentsApi(employeeId, token, files);

    Alert.alert("Success", "Documents uploaded successfully");
    router.back();
  } catch (err: any) {
    Alert.alert("Upload failed", err.message || "Something went wrong");
  } finally {
    setUploading(false); // 👈 STOP LOADING
  }
};

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <LinearGradient colors={["#1E3C72", "#2A5298"]} style={styles.header}>
        <View style={styles.navbar}>
          <BackButton />
          <Text style={styles.navTitle}>Upload Documents</Text>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.whiteCard}>
          <UploadRow
            label="PAN Card"
            value={files.pan}
            onPress={() => pickDocument("pan")}
          />

          <UploadRow
            label="Bank Passbook"
            value={files.bankPassbook}
            onPress={() => pickDocument("bankPassbook")}
          />
<UploadRow
  label="Aadhaar Card"
  value={files.aadhaar}
  onPress={() => pickDocument("aadhaar")}   // ✅ EXACT
/>


          <Text style={styles.optionalTitle}>Other Documents (Optional)</Text>

          <UploadRow
            label="12th Certificate"
            value={files.marksheet12}
            onPress={() => pickDocument("marksheet12")}
            isOptional
          />

        <UploadRow
  label="Graduation Certificate"
  value={files.graduation}
  onPress={() => pickDocument("graduation")} // ✅ EXACT
  isOptional
/>

        </View>

       <TouchableOpacity
  style={[
    styles.submitBtn,
    uploading && { opacity: 0.7 }
  ]}
  onPress={handleUpload}
  disabled={uploading}
>
  {uploading ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <ActivityIndicator color="#fff" />
      <Text style={styles.submitText}>Uploading…</Text>
    </View>
  ) : (
    <Text style={styles.submitText}>Submit</Text>
  )}
</TouchableOpacity>

      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  header: {
    paddingTop: 55,
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  navTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  whiteCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    padding: 18,
    elevation: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFF",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 14,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  rowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3C72",
  },

  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E3C72",
    justifyContent: "center",
    alignItems: "center",
  },

  optionalTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#90a4ae",
    marginVertical: 10,
  },

  submitBtn: {
    backgroundColor: "#1E3C72",
    height: 54,
    marginHorizontal: 20,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
