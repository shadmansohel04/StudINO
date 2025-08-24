import { View, Text, SafeAreaView, StyleSheet, TextInput, Pressable, useColorScheme, ScrollView } from "react-native";
// import homeIMG from "@/assets/homeIMG.jpg"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios"
import { Colors } from "@/constants/colors";

export default function LoginScreen(){
    const router = useRouter()
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? Colors.dark: Colors.light;
    const styles = createStyles(colors)

    useEffect(()=>{
        const fetchData = async ()=>{
            try {
                const userString = await AsyncStorage.getItem('token')
                const userOBJ = JSON.parse(userString)
        
                if(userOBJ != null){
                    router.replace('/(tabs)')
                }
            } catch (error) {
                console.error(error)
            }            
        }
        fetchData();
    }, [])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showErr, setErr] = useState(false)

    const login = async () => {
        if(email === '' || password === ''){
            setErr(true);
            return;
        }
        setErr(false);
        
        try {
            await axios.post('https://rateto-backend.onrender.com/ESP8266/loginAccount', {
                email: email.toString(),
                password: password.toString()
            }).then((response) => {
                if(response.data.success === true){
                    AsyncStorage.setItem('token', JSON.stringify(response.data.user));
                    AsyncStorage.setItem('jwt', response.data.token)
                    router.replace('/(tabs)');
                }
                else{
                    setErr(true);
                }
            }).catch((error) => {
                console.log(error)
                setErr(true);
            });

        } catch (error) {
            setErr(true);
        }
    };    

    return(
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
        <ScrollView
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.container}
        >
            {/* ADD BACKGROUND IMAGE LATER */}
            <Text style={[styles.text, {color: 'white'}]}>StudINO</Text>
            <View style={styles.login}>
                <Text style={styles.loginText}>Welcome Back</Text>
                <TextInput 
                    onChangeText={(e)=>{setEmail(e)}} 
                    placeholderTextColor={colors.placeholder} 
                    placeholder="Enter Email" 
                    style={styles.input} 
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"

                />
                <TextInput 
                    onChangeText={(e)=>{setPassword(e)}} 
                    placeholderTextColor={colors.placeholder} 
                    placeholder="Enter Password" 
                    style={styles.input} 
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                />
                <Pressable
                    onPress={login}
                    style={[styles.input, styles.button]}
                ><Text style={styles.button}>Login</Text></Pressable>
                {showErr && <Text style={{fontSize: 16, color: 'red'}}>Login Failed</Text>}
                <Text style={{ color: colors.textColor, fontSize: 18, marginTop: 30 }}>
                    Don't have an account?{' '}
                    <Text
                        onPress={() => router.push('/(uauth)/signup')}
                        style={{ color: colors.pop, fontSize: 18 }}
                    >
                        Sign up
                    </Text>
                </Text>

            </View>

        </ScrollView>
        </SafeAreaView>
    )
}

function createStyles(colors){
    return StyleSheet.create({
        container:{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.pop
        },
        text:{
            marginTop: '20%',
            fontSize: 50,
            fontWeight: 'bold',
            color: colors.textColor
        },
        image: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        login:{
            paddingTop: 30,
            overflow: 'hidden',
            alignItems: 'center',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            height: '70%',
            width: '100%',
            backgroundColor: colors.background
        },
        loginText:{
            fontSize: 40,
            textAlign: 'left',
            width: '80%',
            marginBottom: 40,
            color: colors.textColor
        },
        input:{
            width: '80%',
            borderColor: colors.textColor,
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 25,
            padding: 15,
            marginBottom: 25,
            fontSize: 14,
            color: colors.textColor
        },
        button:{
            backgroundColor: colors.pop,
            borderWidth: 0,
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: 25
        }
    })
} 