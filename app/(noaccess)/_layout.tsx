import { router, Stack } from 'expo-router'
import React, { useEffect } from 'react'
import AsyncStorage from "@react-native-async-storage/async-storage";

const StackPagesLayout = () => {

    useEffect(() => {
        (async () => {
          try {
            const onboarded = await AsyncStorage.getItem("movebay_onboarding");
            const token = await AsyncStorage.getItem("movebay_token");
            const userType = await AsyncStorage.getItem("movebay_usertype");

            console.log('Thi is token', token)

            if (token) {
              if(token && userType){
                if(userType === "User"){
                  router.replace("/home");
                  return;
                }
                else if(userType === "Rider"){
                  router.replace("/riderHome");
                  return;
                }
              }
            }


            // if (token) {
            //   router.replace("/home");
            //   return
            // }


            if (onboarded) {
              router.replace("/login");
              return;
            } else {
              router.replace("/onboarding");
              return;
            }
     
          } catch (error) {
            console.error(error);
            router.replace("/login");
            return;
          }
        })();
    
        return () => {};
      }, []);
  return (
    <Stack
        screenOptions={{
        headerShown: false,
        }}
    >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="user-register" />
        <Stack.Screen name="rider-register" />
        <Stack.Screen name="otp-screen" />
    </Stack>
  )
}

export default StackPagesLayout