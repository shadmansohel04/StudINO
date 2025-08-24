import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { 
  View, Text, ActivityIndicator, StyleSheet, 
  Pressable, AppState, ScrollView, RefreshControl 
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import axios from "axios";

export default function HomePage(){
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const styles = createStyles(colors);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState({
        firstName: null,
        score: null,
        recent: null,
        perc: null,
        userid: null
    });
    const [codeShown, setCode] = useState(false);
    const router = useRouter();

    const handleAppStateChange = (nextAppState) => {
        console.log(nextAppState);
        if (nextAppState === 'inactive') {
          console.log('the app is closed');
        }    
    };

    const reload = async (userid, userOBJ) => {
        try {
            const stringer = 'https://rateto-backend.onrender.com/ESP8266/getScore/' + userid;
            await axios.get(stringer)
            .then((response) => {
                if(response.data.success){
                    setUser((prev) => ({
                        ...prev,
                        score: response.data.score,
                        recent: response.data.recent,
                        perc: response.data.posNeg
                    }));
                };
                
                const updated = {
                    ...userOBJ,
                    score: response.data.score,
                    recent: response.data.recent,
                    perc: response.data.posNeg
                };
                    
                AsyncStorage.setItem("token", JSON.stringify(updated));
            }).catch((err) => {
                console.log(err);
            });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const appStateId = AppState.addEventListener('change', handleAppStateChange);
        return () => {
          appStateId.remove();
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userString = await AsyncStorage.getItem('token');
                const token = await AsyncStorage.getItem('jwt');
                const userOBJ = JSON.parse(userString);
                if(userOBJ != null){
                    setUser(userOBJ);
                    setLoading(false);
                    await reload(token, userOBJ);
                }
                else{
                    router.replace('/(uauth)/login');
                }
            } catch (error) {
                console.error(error);
            }            
        };
        fetchData();
    }, []);

    const toggle = () => {
        setCode((prev) => !prev);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const token = await AsyncStorage.getItem('jwt');
            const userString = await AsyncStorage.getItem('token');
            const userOBJ = JSON.parse(userString);

            if(token && userOBJ){
                await reload(token, userOBJ);
            }
        } catch (error) {
            console.error(error);
        }
        setRefreshing(false);
    };

    if (loading) {
        return (
          <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.pop || '#888'} />
            <Text style={{color: colors.textColor, fontSize: 16 }}>Loading...</Text>
          </View>
        );
    }
    else {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={{flex: 1, maxHeight: 700 ,alignItems: 'center'}}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.pop || '#888']} 
                            tintColor={colors.pop || '#888'} 
                        />
                    }
                >
                    <Text style={styles.title}>Hey {user.firstName}!</Text>
                    <View style={styles.fullBar}>
                        <Text style={{fontSize: 20, fontWeight: '600'}}>Your Score</Text>
                        <Text style={styles.larger}>{user.score != null ? user.score : 80}</Text>
                    </View>
                    <View style={{marginBottom: 20, flex: 1.2, width: '98%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between'}}>
                        <View style={styles.halfRow}>
                            <Text style={styles.BarText}>Most Recent Sess</Text>
                            <Text style={styles.selector}>{user.recent}</Text>
                        </View>
                        <View style={styles.halfRow}>
                            <Text style={styles.BarText}>Positive Percentage</Text>
                            <Text style={styles.selector}>{user.perc != null ? user.perc + " %" : null}</Text>
                        </View>
                    </View>
                    <Pressable
                        style={[styles.fullBar, {backgroundColor: colors.halfBackground, flex: 0.5}]}
                        onPress={toggle}
                    >
                        <Text style={styles.BarText}>Your code</Text>
                        <Text style={{fontSize: 45, textAlign: 'center', color: colors.pop}}>
                            {codeShown ? user.userid : '**********'}
                        </Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        );
    }
}

function createStyles(colors){
    return StyleSheet.create({
        container:{
            backgroundColor: colors.background,
            flex: 1,
            padding: 20,
        },
        title:{
            fontSize: 40,
            textAlign: 'left',
            marginBottom: 40,
            color: colors.textColor,
            width: '100%',
            alignSelf: 'center'
        },
        fullBar:{
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            justifyContent: 'center',
            backgroundColor: colors.fillColor,
            borderRadius: 25,
            padding: 25,
            marginBottom: 20
        },
        BarText:{
            fontSize: 22, 
            marginBottom: 10,
            color: colors.textColor,
            fontWeight: '100'
        },
        larger:{
            fontSize: 65, 
            fontWeight: '400'
        },
        halfRow:{
            width: '48%',
            borderRadius: 20,
            padding: 15,
            backgroundColor: colors.halfBackground,
            justifyContent: 'space-between'
        },
        selector:{
            color: colors.textColor,
            fontSize: 35,
            fontWeight: '900',
        }
    });
}
