import { router, Stack } from 'expo-router'
import React, { useEffect } from 'react'
import AsyncStorage from "@react-native-async-storage/async-storage";

const StackPagesLayout = () => {

    useEffect(() => {
        (async () => {
          try {
            const onboarded = await AsyncStorage.getItem("scan_onboard");
           
            if (onboarded) {
              router.replace("/home");
                return;
            } 

            if(!onboarded){
                router.replace("/onboarding");
                return;
            }
     
          } catch (error) {
            console.error(error);
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
    </Stack>
  )
}

export default StackPagesLayout