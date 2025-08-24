import { useRouter, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useColorScheme, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Session(){
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const styles = createStyles(colors);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
      date: "",
      data: []
    })
    const router = useRouter();
    const passed = useLocalSearchParams() 

    useEffect(()=>{
      const url = "https://rateto-backend.onrender.com/ESP8266/oneSessionStat/" + passed.session
      axios.get(url).then((res)=>{
        if(res.data.success){
          setData({
            date: passed.date,
            data: res.data.updates
          })
          setLoading(false)
        }
        else{
          router.back()
        }
      }).catch((err)=>{
        console.log("huh")
        router.back()
      })
    }, [])

    const renderUpdate = ({ item }) => {
      const theDate = new Date(item[1]);

      let hours = theDate.getHours();
      const minutes = theDate.getMinutes();

      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours; 

      const paddedMinutes = minutes.toString().padStart(2, '0');

      const itemTime = `${hours}:${paddedMinutes} ${ampm}`;

      return (
        <View style={styles.updateContainer}>
          <Text
            style={[styles.number,{ backgroundColor: parseInt(item[0]) === 0 ? "rgba(60,179,113, 0.6)" : "rgba(178,34,34, 0.6)"}]}
          >
            {parseInt(item[0]) === 1 ? "-1" : "+1"}
          </Text>
          <Text style={styles.text}>{itemTime}</Text>
        </View>
      );
    };


    if(loading){
      return(
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.pop || '#888'} />
          <Text style={{ marginTop: 20, color: colors.textColor, fontSize: 16 }}>Loading...</Text>
        </View>
      )
    }

    return(

        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.replace("../(tabs)/profile")}>
              <Text style={styles.backButtonText}>←</Text>
          </Pressable>

          <Text style={styles.header}>{data.date}</Text>
          <FlatList 
            style={styles.list}
            data={data.data}
            renderItem={renderUpdate}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
    )
}

function createStyles(colors) {
    return StyleSheet.create({
      container:{
        alignItems: 'center',
        backgroundColor: colors.background,
        flex: 1,
        padding: 20
      },
      text:{
        fontSize: 18,
        color: colors.textColor,
        fontWeight: '600',
        textAlign: 'center',
        flex: 3
      },
      number:{
        flex: 1,
        color: colors.textColor,
        padding: 20,
        fontSize: 25
      },
      header:{
        color: colors.textColor,
        fontSize: 30,
        marginBottom: 30
      },
      list:{
        flex: 1,
        width: '80%'
      },  
      backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 10,
        zIndex: 1
      },
      backButtonText: {
        fontSize: 24,
        color: colors.textColor
      },
      updateContainer:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginBottom: 20,
        borderRadius: 40,
        backgroundColor: colors.halfBackground
      }
    });
  }
  