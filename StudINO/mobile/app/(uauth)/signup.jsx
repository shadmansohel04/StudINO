import { View, Text, TextInput, Pressable, StyleSheet, useColorScheme, ScrollView, SafeAreaView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { Colors } from "@/constants/colors";

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(colors);

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLast] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showErr, setErr] = useState('');

  const signup = async () => {
    if (!firstName || !email || !password || !confirm) {
      setErr('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('https://rateto-backend.onrender.com/ESP8266/createAccount', {
        email,
        password,
        firstName,
        lastName
      });

      if (response.data.success === true) {
        alert("Account Created")
        router.replace('/(uauth)');
      } else {
        setErr(response.data.message || 'Signup failed');
      }

    } catch (error) {
      console.error(error);
      setErr('Something went wrong');
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.text, { color: 'white' }]}>StudINO</Text>
      <View style={styles.login}>
        <Text style={styles.loginText}>Create Account</Text>

        <TextInput
          onChangeText={(e) => setFirstName(e)}
          placeholder="Enter First Name"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
        />

        <TextInput
          onChangeText={(e) => setLast(e)}
          placeholder="Enter Last Name"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
        />

        <TextInput
          onChangeText={(e) => setEmail(e)}
          placeholder="Enter Email"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextInput
          onChangeText={(e) => setPassword(e)}
          placeholder="Enter Password"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
        />
        <TextInput
          onChangeText={(e) => setConfirm(e)}
          placeholder="Confirm Password"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable onPress={signup} style={[styles.input, styles.button]}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        {!!showErr && <Text style={{ fontSize: 16, color: 'red' }}>{showErr}</Text>}

        <Text style={{ color: colors.textColor, fontSize: 18, marginTop: 30 }}>
          Already have an account?{' '}
          <Text
            onPress={() => router.replace('/(uauth)')}
            style={{ color: colors.pop, fontSize: 18 }}
          >
            Login
          </Text>
        </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.pop
    },
    text: {
      marginTop: '20%',
      fontSize: 50,
      fontWeight: 'bold',
      color: colors.textColor
    },
    login: {
      paddingTop: 30,
      overflow: 'hidden',
      alignItems: 'center',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      height: '80%',
      width: '100%',
      backgroundColor: colors.background
    },
    loginText: {
      fontSize: 35,
      textAlign: 'left',
      width: '80%',
      marginBottom: 30,
      color: colors.textColor
    },
    input: {
      width: '80%',
      borderColor: colors.textColor,
      borderWidth: 2,
      borderStyle: 'solid',
      borderRadius: 25,
      padding: 15,
      marginBottom: 20,
      fontSize: 14,
      color: colors.textColor
    },
    button: {
      backgroundColor: colors.pop,
      borderWidth: 0,
      borderRadius: 25,
      padding: 15,
      marginTop: 10
    },
    buttonText: {
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 20,
      color: 'white'
    }
  });
}
