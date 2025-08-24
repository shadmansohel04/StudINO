import { View, Text, FlatList, useColorScheme, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Profile() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);
  const [headerTXT, setHead] = useState("Your Sessions");
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      if(token != null){
        const query = "https://rateto-backend.onrender.com/ESP8266/sessionStats/";
        const res = await axios.get(query, {
          headers: {
            Authorization: token
          }
        });
        if(res.data.success){
          setData(res.data.sessions);
          setLoading(false);
          setHead("Your Sessions");
        }
        else{
          setHead("Nothing yet...");
        }
      }
      else{
        setHead("Nothing yet...");
      }
    } catch (error) {
      console.error(error);
      setHead("Nothing yet...");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderSess = ({ item }) => {
    const formattedDate = new Date(item[1]);
    return (
      <Pressable 
        style={styles.sessContainer}
        onPress={() => {
          router.push({
            pathname: '../(comp)/' + item[0].toString(),
            params: {
              date: formattedDate.toLocaleString('en', {month: 'short'}) + " " + formattedDate.getDate() + " " + formattedDate.getFullYear()
            }
          });
        }}
      >
        <View style={[
          styles.num, 
          {borderWidth: 2, borderColor: parseInt(item[3]) >= 0 ? 'green' : 'red', borderStyle: 'solid'}
        ]}>
          <Text style={[styles.update, {color: parseInt(item[3]) >= 0 ? 'green' : 'red'}]}>
            {parseInt(item[3]) > 0 ? '+' + item[3].toString() : item[3].toString()}
          </Text>
        </View>
        <Text style={[styles.text, {fontSize: 15, flex: 2, textAlign: 'center'}]}>
          {formattedDate.toLocaleString('en', {month: 'short'}) + " " + formattedDate.getDate() + " " + formattedDate.getFullYear()}
        </Text>
        <Text style={[
          styles.minutes, 
          {backgroundColor: parseInt(item[3]) >= 0 ? 'rgba(60,179,113, 0.6)' : 'rgba(178,34,34, 0.6)'}
        ]}>
          {parseFloat(item[2]) === 0 ? "Active" : item[2] + " min"} 
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>{headerTXT}</Text>

      {loading ? (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.pop || '#888'} />
          <Text style={{ marginTop: 20, color: colors.textColor, fontSize: 16 }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.sessions}
          data={data}
          keyExtractor={(item) => item[0].toString()}
          renderItem={renderSess}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.pop || '#888']}
              tintColor={colors.pop || '#888'} 
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ color: colors.textColor, textAlign: 'center', marginTop: 20 }}>No sessions found.</Text>}
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    minutes:{
      overflow: 'hidden',
      color: colors.textColor,
      fontSize: 15,
      padding: 20,
      textAlign: 'right',
      borderRadius: 40
    },
    update:{
      fontSize: 20,
      fontWeight: '700'
    },
    num:{
      width: 60,
      height: 60,
      backgroundColor: colors.background,
      borderRadius: 30, 
      alignItems: 'center',
      justifyContent: 'center'
    }, 
    text:{
      color: colors.textColor,
      fontSize: 14
    },
    container: {
      backgroundColor: colors.background,
      flex: 1,
      padding: 20,
      alignItems: 'center'
    },
    headerText: {
      fontSize: 25,
      color: colors.textColor,
      fontWeight: 'bold',
      marginBottom: 25, 
    },
    sessions: {
      width: '100%',
      maxWidth: 500
    },
    sessContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.halfBackground,
      padding: 10,
      marginBottom: 15,
      borderRadius: 8,
      elevation: 3,
      alignItems: 'center'
    },
  });
}
