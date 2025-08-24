import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Animated,
  Pressable
} from "react-native";
import { Colors } from "@/constants/colors";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ActivatePage() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const [isPulsing, setIsPulsing] = useState(false);
  const [message, setMessage] = useState("Pending...")
  const pulseAnimationRef = useRef(null);

  useEffect(()=>{
    const fetch = async ()=>{
      const token = await AsyncStorage.getItem("jwt")
      axios.get("https://rateto-backend.onrender.com/ESP8266/getState",{
        headers:{
          Authorization: token
        }
      }).then((res)=>{
        if(res.data.success === true){
          if(res.data.state === true){
            setMessage("Deactivate")
            togglePulse();
          }
          else{
            setMessage("Activate")
          }
        }
      })
    }

    fetch();
  }, [])

  const createPulseAnimation = () => {
    return Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 4,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ]),
      {
        resetBeforeIteration: true
      }
    );
  };

  const togglePulse = async () => {
    setMessage("Pending...")
    let token = "";
    try {
      token = await AsyncStorage.getItem("jwt");
    } catch (error) {
      console.error("Failed to retrieve token:", error);
      return;
    }

    try {
      const res = await axios.put(
        "https://rateto-backend.onrender.com/ESP8266/activate",
        { toggle: !isPulsing },
        {
          headers: {
            Authorization: token
          }
        }
      );

      if (!res.data.success) {
        console.log("Backend error:", res.data);
        return;
      }
    } catch (err) {
      console.error("Axios request failed:", err.message);
      return;
    }

    if (isPulsing) {
      pulseAnimationRef.current?.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      await AsyncStorage.setItem("State", "Activate")
      setMessage("Activate")
      setIsPulsing(false);
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      const animation = createPulseAnimation();
      pulseAnimationRef.current = animation;
      animation.start();
      await AsyncStorage.setItem("State", "Deactivate")
      setMessage("Deactivate")
      setIsPulsing(true);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={togglePulse}>
        <View style={styles.circleWrapper}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity
              }
            ]}
          />
          <View style={styles.bigCircle}>
            <Text style={styles.text}>{message}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center"
    },
    circleWrapper: {
      width: 200,
      height: 200,
      alignItems: "center",
      justifyContent: "center"
    },
    pulseCircle: {
      position: "absolute",
      width: 200,
      height: 200,
      backgroundColor: colors.textColor,
      borderRadius: 100
    },
    bigCircle: {
      width: 200,
      height: 200,
      backgroundColor: colors.pop,
      borderRadius: 200,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1
    },
    text: {
      color: colors.textColor,
      fontSize: 30,
      fontWeight: "600"
    }
  });
}