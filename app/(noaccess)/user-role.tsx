import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { OnboardArrowHeader } from '@/components/btns/OnboardHeader'
import { router } from 'expo-router'
import { Image } from 'react-native'
import { StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { SolidInactiveButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import Animated, { FadeInDown } from 'react-native-reanimated'


const userRole= () => {

    const [active, setActive] = useState(0);
  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
        <StatusBar style='dark'/>

        <View className='px-7 mt-10 flex-1'>
            <OnboardArrowHeader onPressBtn={()=>router.back()}/>
            <Text className='text-2xl w-[70%] pt-5' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>How would you like to use MovBay?</Text>


            <View className='flex flex-col gap-1 mt-5'>
                <Pressable className='' onPress={() => setActive(1)}>

                    <Animated.View style={active === 1 ? styles.activeStyle : styles.inactiveStyle} entering={FadeInDown.duration(300).springify()} className='mb-5 relative'>
                        {active === 1 && 
                            <View className='absolute top-5 right-5 bg-[#F75F15] rounded-full w-6 h-6 flex items-center justify-center'>
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
                    </Animated.View>
                </Pressable>

                <Pressable className='' onPress={() => setActive(2)}>

                    <Animated.View style={active === 2 ? styles.activeStyle : styles.inactiveStyle} entering={FadeInDown.duration(300).delay(200).springify()} className='mb-5 relative'>
                        
                        {active === 2 && 
                            <View className='absolute top-5 right-5 bg-[#F75F15] rounded-full w-6 h-6 flex items-center justify-center'>
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
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Rider (Courier Delivery Only)</Text>
                            <Text className='text-base text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                Deliver packages and earn. Requires a separate rider account.
                            </Text>
                        </View>
                    </Animated.View>
                </Pressable>
            </View>
        </View>

        {/* Button container positioned at the bottom */}
        <View className='px-7 mb-8'>
            {active === 0 && <SolidInactiveButton text='Proceed'/>}
            {active === 1 && <SolidMainButton text='Proceed' onPress={()=>router.push('/user-register')}/>}
            {active === 2 && <SolidMainButton text='Proceed' onPress={()=>router.push('/rider-register')}/>}
            
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