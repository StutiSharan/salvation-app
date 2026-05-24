import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image
} from "react-native";
import BackButton from "../../components/BackButton";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployeeDocumentsApi } from "../../api/employeeApi";
import { useLocalSearchParams, router } from "expo-router";

/* ================= DOCUMENT ITEM ================= */

const DocItem = ({
  label,
  url
}: {
  label: string;
  url: string;
}) => {
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);

  return (
    <TouchableOpacity
      style={styles.docItem}
      onPress={() => Linking.openURL(url)}
    >
      {isImage ? (
        <Image source={{ uri: url }} style={styles.preview} />
      ) : (
        <Ionicons name="document-outline" size={22} color="#0A1F44" />
      )}
      <Text style={styles.docText}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ================= SCREEN ================= */

export default function MyDocuments() {
  /* ---------- PARAMS (SAFE) ---------- */
  const params = useLocalSearchParams();

  const employeeId =
    typeof params.employeeId === "string"
      ? params.employeeId
      : Array.isArray(params.employeeId)
      ? params.employeeId[0]
      : "";

  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD DOCUMENTS ---------- */
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("employeeToken");

        if (!token) {
          Alert.alert("Login required");
          router.replace("/employee");
          return;
        }

        if (!employeeId) {
          Alert.alert("Employee ID missing");
          router.replace("/employee/dashboard");
          return;
        }

        console.log("📄 Fetching docs for:", employeeId);

        const res = await getEmployeeDocumentsApi(employeeId, token);
        setDocs(res);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading documents...</Text>
      </View>
    );
  }

  /* ---------- EMPTY ---------- */
  if (!docs) {
    return (
      <View style={styles.loading}>
        <Text>No documents found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#0A1F44" />

      <View style={styles.navbar}>
        <BackButton />
        <Text style={styles.navTitle}>My Documents</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.card}>

          {/* ================= SALARY ================= */}
          <Text style={styles.section}>Salary Slips</Text>
          {docs.salarySlips?.length ? (
            docs.salarySlips.map((u: string, i: number) => (
              <DocItem key={i} label={`Salary Slip ${i + 1}`} url={u} />
            ))
          ) : (
            <Text style={styles.empty}>No salary slips uploaded</Text>
          )}

          {/* ================= LETTERS ================= */}
          <Text style={styles.section}>Company Letters</Text>
          {docs.letters?.offerLetter && (
            <DocItem label="Offer Letter" url={docs.letters.offerLetter} />
          )}
          {docs.letters?.appointmentLetter && (
            <DocItem
              label="Appointment Letter"
              url={docs.letters.appointmentLetter}
            />
          )}
          {!docs.letters?.offerLetter &&
            !docs.letters?.appointmentLetter && (
              <Text style={styles.empty}>No letters available</Text>
            )}

          {/* ================= GOVERNMENT ================= */}
          <Text style={styles.section}>Government</Text>
          {docs.government?.uanLetter && (
            <DocItem label="UAN Letter" url={docs.government.uanLetter} />
          )}
          {docs.government?.esicSlip && (
            <DocItem label="ESIC Slip" url={docs.government.esicSlip} />
          )}
          {!docs.government?.uanLetter &&
            !docs.government?.esicSlip && (
              <Text style={styles.empty}>No government documents</Text>
            )}

          {/* ================= PERSONAL ================= */}
          <Text style={styles.section}>Personal</Text>
          {docs.personal?.aadhaar && (
            <DocItem label="Aadhaar Card" url={docs.personal.aadhaar} />
          )}
          {docs.personal?.pan && (
            <DocItem label="PAN Card" url={docs.personal.pan} />
          )}
          {docs.personal?.bankPassbook && (
            <DocItem
              label="Bank Passbook"
              url={docs.personal.bankPassbook}
            />
          )}
          {!docs.personal?.aadhaar &&
            !docs.personal?.pan &&
            !docs.personal?.bankPassbook && (
              <Text style={styles.empty}>No personal documents</Text>
            )}

        </View>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: "#0A1F44"
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 12
  },

  card: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 18,
    padding: 18,
    elevation: 4
  },

  section: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 6,
    color: "#263238"
  },

  docItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10
  },

  docText: {
    marginLeft: 10,
    color: "#37474f",
    flex: 1,
    fontSize: 14
  },

  preview: {
    width: 40,
    height: 40,
    borderRadius: 6
  },

  empty: {
    color: "#90a4ae",
    fontSize: 13,
    paddingVertical: 4
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
