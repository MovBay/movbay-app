import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { OnboardArrowHeader } from '@/components/btns/OnboardHeader'
import { router } from 'expo-router'
import { Image } from 'react-native'
import { StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'


const userRole= () => {

    const [active, setActive] = useState(0);
  return (
    <SafeAreaView className='flex-1 flex w-full bg-white '>
        <StatusBar style='dark'/>

        <View className='px-7 mt-10'>
            <OnboardArrowHeader onPressBtn={()=>router.back()}/>
            <Text className='text-2xl ' style={{fontFamily: 'HankenGrotesk_600SemiBold', width: '50%'}}>How would you like to use MovBay?</Text>


            <View className='flex flex-col gap-5 mt-10'>
                <Pressable className='' onPress={() => setActive(1)}>

                    <View style={active === 1 ? styles.activeStyle : styles.inactiveStyle} className='mb-5 relative'>
                        {active === 1 && 
                            <View className='absolute top-10 right-5 bg-[#F75F15] rounded-full w-7 h-7 flex items-center justify-center'>
                                <MaterialIcons name='check' size={15} color='white'/>
                            </View>
                        }
                        <View>
                            <Image 
                                source={require('../../assets/images/user.png')} 
                                style={{
                                    width: 50,
                                    height: 50,
                                }}
                            />
                        </View>

                        <View className='pt-3'>
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>User (Shop, Sell, Send, Receive)</Text>
                            <Text className='text-base text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                Buy or sell products, book couriers, and track orders.
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </View>
        </View>

    </SafeAreaView>
  )
}

export default userRole

const styles = StyleSheet.create( {
  inactiveStyle: {
    backgroundColor: "#F6F6F6",
    borderRadius: 25,
    padding: 20,
  },

   activeStyle: {
    borderWidth: 1,
    borderColor: "#F75F15",
    backgroundColor: "#F6F6F6",
    borderRadius: 25,
    padding: 20,
  },
});