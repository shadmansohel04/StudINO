import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Settings() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyles(colors);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState(false);
  const [load, setLoading] = useState(true);
  const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
        try {
            const data = await AsyncStorage.getItem("token");
            if (data) {
            setUser(JSON.parse(data));
            } else {
            setErr(true);
            }
        } catch (error) {
            setErr(true);
        } finally {
            setLoading(false);
        }
        };
        fetchUser();
    }, []);

    function logout(){
        const clear = async () =>{
            await AsyncStorage.clear();
            router.replace("../(uauth)")
        }
        clear();
    }

    if (load) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.pop || '#888'} />
                <Text style={{color: colors.textColor, fontSize: 16, marginTop: 15}}>Loading...</Text>
            </View>
        );
    }

  if (err || !user) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.label}>Failed to load user data.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.itemColumn}>
          <Text style={styles.label}>First Name</Text>
          <Text style={styles.value}>{user.firstName}</Text>
        </View>

        <View style={styles.itemColumn}>
          <Text style={styles.label}>Last Name</Text>
          <Text style={styles.value}>{user.lastName}</Text>
        </View>

        <View style={styles.itemColumn}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <Pressable style={styles.item} onPress={logout}>
          <Text style={[styles.label, { color: "red" }]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    header: {
      fontSize: 30,
      fontWeight: "bold",
      color: colors.textColor,
      marginBottom: 50,
    },
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.textColor,
      marginBottom: 10,
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 15,
    },
    itemColumn: {
      paddingVertical: 12,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textColor,
    },
    value: {
      fontSize: 16,
      color: colors.textColor,
      marginTop: 4,
    },
  });
}
