import { View, Text, Image, Pressable } from 'react-native'
import React from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

interface ProductsProps {
  id: string;
  title: string;
  original_price: number;
  discounted_price: number;
  description: string;
  product_images: any
  // reviews: {
  //   id: number;
  //   username: string;
  //   date: string;
  //   review: string;
  // }[];

}
const Products = ({
    id,
    title,
    original_price,
    discounted_price,
    description,
    product_images,
}: ProductsProps) => {


  const handleViewProduct = (id: string) =>{
    router.push(`/product/${id}` as any)
  }
    
  return (
    <View className='w-[50%] mb-4 '>
      <Pressable onPress={()=>handleViewProduct(id)}>
        <Animated.View 
            className='w-full relative'
            entering={FadeInDown.duration(400).delay(200).springify()}
        >
          <View className='w-full h-52 bg-slate-200 rounded-3xl relative'>
            <Image 
                source={{uri: product_images[0]?.image_url}}
                style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16}}
            />

            <Pressable className='absolute bottom-2 right-2 p-3 flex justify-center items-center rounded-full bg-[#FEEEE6]'>
                <Ionicons name='cart-outline' size={20} color={'#F75F15'}/>
            </Pressable>
          </View>
          <View className='bg-blue-100 flex-row justify-center w-[80%] gap-2 items-center p-1.5 my-2 rounded-full'>
              <MaterialIcons name='verified' size={15} color={'#4285F4'}/>
              <Text className='text-[#4285F4] text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Verified Seller</Text>
          </View>
          <View>
              <View>
                {
                  title.length > 35 ?
                  <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>{title.slice(0, 35)}...</Text> : 
                  <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>{title}</Text>

                }
                <View className='flex-row items-center gap-3'>
                  <Text className='text-base pt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>₦ {original_price.toLocaleString()}</Text>
                  <Text className='text-sm pt-2 italic line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>₦ {discounted_price.toLocaleString()}</Text>
                </View>
              </View>
          </View>

          <Pressable className='absolute top-2 left-2 p-3 flex justify-center items-center rounded-full bg-[#FEEEE6]'>
              <MaterialIcons name='favorite-outline' size={20} color={'#F75F15'}/>
          </Pressable>
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default Products