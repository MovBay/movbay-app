import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { products } from '@/constants/datas'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetSingleUserProducts } from '@/hooks/mutations/sellerAuth'

const UserProduct = () => {
    const { id } = useLocalSearchParams<{ id: string }>()

    const {userSingleProductData, isLoading} = useGetSingleUserProducts(id)

    const eachData = userSingleProductData?.data

    console.log('This is single user data', userSingleProductData?.data)

    
  return (
    <SafeAreaView className='bg-white flex-1'>
        <View className='flex-1'>
            <KeyboardAwareScrollView 
                className='' 
                contentContainerStyle={{ paddingBottom: 100 }} // Add padding to prevent content from being hidden behind buttons
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? 
                    <View className='justify-center items-center pt-36'>
                        <ActivityIndicator size={'small'} color={'#F75F15'}/>
                    </View> : 
                    <View className='pb-5'>
                        <View className='w-full h-[350px] object-cover relative'>
                            <Image style={{width: '100%', height: '100%', objectFit: 'cover'}} source={{uri: eachData?.product_images[0]?.image_url}}/>
                        
                            <Pressable onPress={()=>router.back()} className='absolute top-4 left-5 bg-white p-3 rounded-full justify-center items-center flex'>
                                <MaterialIcons name='chevron-left' size={25} color={'black'}/>
                            </Pressable>

                            <Pressable className='absolute top-4 right-5  bg-white p-3 rounded-full justify-center items-center flex'>
                                <Ionicons name='share-outline' size={25} color={'#black'}/>
                            </Pressable>
                        </View>

                        <View className='px-5 pt-3'>
                            <View className='pt-2'>
                                <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{eachData?.title}</Text>
                                <View className='flex-row justify-between pt-3'>
                                    <View className='flex-row items-center gap-3'>
                                        <Text className='text-2xl pt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>₦ {eachData?.original_price.toLocaleString()}</Text>
                                        <Text className='text-xl pt-2 italic line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>₦ {eachData?.discounted_price.toLocaleString()}</Text>
                                    </View>
                                </View>

                                <View className='flex-row gap-3 pt-2 border-b border-neutral-200 pb-3'>
                                    <View className='flex-row'>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                        <MaterialIcons name='star' size={20} color={'#FBBC05'}/>
                                    </View>
                                    <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>(1,020)</Text>
                                </View>

                                <View className='pt-2'>
                                    <View className='pt-5 pb-3 border-b border-neutral-200'>
                                        <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Description</Text>
                                        <Text className='text-lg pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{eachData?.description}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                }
            </KeyboardAwareScrollView>

            {/* Fixed buttons at the bottom */}
            {!isLoading && (
                <View className='absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-5 py-10'>
                    <View className='flex-row gap-3 justify-center'>
                        <View className='w-[50%]'>
                            <SolidLightButton text='Save as Draft'/>
                        </View>

                        <View className='w-[50%]'>
                            <SolidMainButton text='Post'/>
                        </View>
                    </View>
                </View>
            )}
        </View>
    </SafeAreaView>
  )
}

export default UserProduct