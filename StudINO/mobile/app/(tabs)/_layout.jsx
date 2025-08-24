import { Tabs } from 'expo-router';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Colors} from "@/constants/colors"

export default function TabsLayout() {

  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark: Colors.light;
  
  const styles = createStyles(colors);

  const homeIcon = ({ color, size }) => {
    return (
      <Entypo
        name="home"
        size={size}
        color={color}
      />
    );
  };

  const activeIcon = ({ color, size }) => {
    return (
      <Ionicons 
        name="tv" 
        size={size} 
        color={color} 
      />
    );
  };

  const profileIcon = ({ color, size }) => {
    return (
      <FontAwesome 
        name="user" 
        size={size} 
        color={color} 
      />
    );
  };
  const settingsIcon = ({ color, size }) => {
    return (
      <Ionicons 
        name="settings-sharp" 
        size={size} 
        color={color} 
      />
    );
  };

  return (
    <>
    <StatusBar
      translucent={true}
      backgroundColor="transparent"
      barStyle={colorScheme === "light"? "light-content": "dark-content"} 
    />

    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.pop,
        tabBarInactiveTintColor: colors.textColor, 
        tabBarLabelStyle: { fontSize: 14 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: homeIcon,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: profileIcon,
        }}
      />

      <Tabs.Screen
        name="activate"
        options={{
          title: 'Live',
          tabBarIcon: activeIcon,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: settingsIcon,
        }}
      />


    </Tabs>
    </>
  );
}

function createStyles(colors) {

  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.tabBar,
      borderTopColor: 'transparent',
      height: 60,
      paddingBottom: 5,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
}
