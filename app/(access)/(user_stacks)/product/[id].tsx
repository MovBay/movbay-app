import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { products } from '@/constants/datas'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'

const Product = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const product = products.find(item => item.id === id || item.id === (id))

    
  return (
    <SafeAreaView className='bg-white flex-1'>
        <KeyboardAwareScrollView className=''>
            <View className='pb-10'>
                <View className='w-full h-[350px] object-cover relative'>
                    <Image style={{width: '100%', height: '100%', objectFit: 'cover'}} source={product?.image}/>
                   
                    <Pressable onPress={()=>router.back()} className='absolute top-4 left-5 bg-red-100 p-3 rounded-full justify-center items-center flex'>
                        <MaterialIcons name='chevron-left' size={25} color={'#F75F15'}/>
                    </Pressable>

                    <Pressable className='absolute top-4 right-5  bg-red-100 p-3 rounded-full justify-center items-center flex'>
                        <MaterialIcons name='question-mark' size={22} color={'#F75F15'}/>
                    </Pressable>
                </View>

                <View className='px-5 pt-3'>
                    <View className='flex-row justify-between items-center'>
                        <View className='flex-row gap-2'>
                            <MaterialIcons size={20} name='location-pin'/>
                            <Text className='text-base ' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Akpajo Port Harcourt, Nigeria</Text>
                        </View>

                        <View className='bg-blue-100 flex-row justify-center gap-2 items-center p-1.5 px-2 my-2 rounded-full'>
                            <MaterialIcons name='verified' size={15} color={'#4285F4'}/>
                            <Text className='text-[#4285F4] text-sm' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Verified Seller</Text>
                        </View>
                    </View>

                    <View className='pt-2'>
                        <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{product?.name}</Text>
                        <View className='flex-row justify-between pt-3'>
                            <View className='flex-row items-center gap-3'>
                                <Text className='text-2xl pt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>₦ {product?.price.toLocaleString()}</Text>
                                <Text className='text-xl pt-2 italic line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>₦ {product?.slashPrice.toLocaleString()}</Text>
                            </View>

                            <Pressable className='bg-neutral-200 p-3 rounded-full flex justify-center items-center'>
                                <Ionicons name='share-outline' size={25}/>
                            </Pressable>
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
                            <View className='bg-[#FEF2CD] p-3 rounded-md'>
                                <Text className='text-base text-[#977102]' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                    Seller’s delivery starts within 1–2 working days for out-of-state orders.
                                </Text>
                            </View>

                            <View className='pt-5'>
                                <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Color Variation</Text>
                                <View className='flex-row gap-3 items-center'>
                                    {product?.colors?.map((color, index)=>(
                                        <View className='pt-2' key={index}>
                                            {color === 1 && <View  className='h-12 w-12 bg-black rounded-full'></View>}
                                            {color === 2 && <View  className='h-12 w-12 bg-[#FBBC05] rounded-full'></View>}
                                            {color === 3 && <View  className='h-12 w-12 bg-[#4285F4] rounded-full'></View>}
                                            {color === 4 && <View  className='h-12 w-12 bg-[#34A853] rounded-full'></View>}
                                            {color === 5 && <View  className='h-12 w-12 bg-white border border-neutral-300 rounded-full'></View>}
                                        </View>
                                    ))}
                                </View>

                                <View className='pt-5 pb-3 border-b border-neutral-200'>
                                    <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Description</Text>
                                    <Text className='text-lg pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{product?.description}</Text>
                                </View>

                                <View className='flex-row items-center justify-between pt-5 pb-3 border-b border-neutral-200'>
                                    <View className='flex-row gap-4 items-center'>
                                        <View className='w-10 h-10 rounded-full bg-gray-300 justify-center items-center flex'>
                                            <Image 
                                                source={product?.store.image} 
                                                style={{width: '100%', height: '100%',  objectFit: 'cover'}}
                                            />
                                        </View>
                                        <View>
                                            <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className='text-lg'>{product?.store.name}</Text>
                                            <View className='flex-row'>
                                                <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                            </View>
                                        </View>
                                    </View>

                                    <Pressable className='bg-[#FEEEE6] p-3 rounded-full px-6'>
                                        <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-base text-[#A53F0E]'>Follow</Text>
                                    </Pressable>
                                </View>


                                <View className='pt-5'>
                                    <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Reviews</Text>
                                    
                                    <View>
                                        {product?.reviews.map((review, index)=>(
                                            <View key={index} className='pt-3 pb-3 border-b border-neutral-200'>
                                                <View className='flex-row justify-between '>
                                                    <View>
                                                        <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-base'>{review?.username}</Text>
                                                        <View className='flex-row'>
                                                            <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                            <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                            <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                            <MaterialIcons name='star' size={15} color={'#FBBC05'}/>
                                                        </View>
                                                    </View>

                                                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-sm'>{review.date}</Text>
                                                </View>
                                                <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-base pt-3'>{review.review}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>


                                <View className='flex-row gap-3 justify-center pt-5'>
                                    <View className='w-[50%]'>
                                        <SolidLightButton text='Chat'/>
                                    </View>

                                    <View className='w-[50%]'>
                                        <SolidMainButton text='Add to Cart'/>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Product