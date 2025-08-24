import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, Animated, useColorScheme, StyleSheet, AppState } from 'react-native';
import { Colors } from '@/constants/colors';
import axios from 'axios';

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);
  const [state, setState] = useState(AppState.currentState)
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const fetcher = async () => {
      try {
        const userSTRING = await AsyncStorage.getItem("jwt");

        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            if (userSTRING === null || userSTRING == "") {
              router.replace('/(uauth)');
            } else {
              axios.post("https://rateto-backend.onrender.com/ESP8266/tokenAuth", {
                "token": userSTRING
              }).then((res)=>{
                if(res.data.success){
                  router.replace('/(tabs)');
                }
                else{
                  console.log("back")
                  AsyncStorage.clear()
                  router.replace('/(uauth)');
                }
              }).catch((err)=>{
                  console.log("back")
                  AsyncStorage.clear()
                  router.replace('/(uauth)');
              })
            }
          });
        }, 1000);
      } catch (error) {
        AsyncStorage.clear()
        router.replace('/(uauth)');
        console.error(error);
      }
    };
    fetcher();
    
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity }]}>
        StudINO
      </Animated.Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 50,
      fontWeight: '600',
      color: colors.textColor,
    },
  });
}
