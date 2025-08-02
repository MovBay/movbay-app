import { View, Text, Image, Pressable, Alert } from 'react-native'
import React from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCart } from '@/context/cart-context';
import { useFavorites } from '@/context/favorite-context';
import { Toast } from 'react-native-toast-notifications';


interface ProductsProps {
  id: string;
  title: string;
  original_price: number;
  discounted_price: number;
  description: string;
  product_images: any[]
  store?: any; // Optional store info
  stock_available?: number; // Optional stock info
}

const Products = ({
    id,
    title,
    original_price,
    discounted_price,
    description,
    product_images,
    store,
    stock_available = 10, // Default stock if not provided
}: ProductsProps) => {
  const { addToCart, isUpdating: cartUpdating } = useCart()
  const { toggleFavorite, isItemInFavorites, isUpdating: favoritesUpdating } = useFavorites()

  const handleViewProduct = (id: string) => {
    router.push(`/product/${id}` as any)
  }

  const handleAddToCart = async () => {
    try {
      const cartItem = {
        id,
        title,
        price: original_price,
        discounted_price,
        image: product_images[0]?.image_url || '',
        store: store || {},
        stock_available,
        isNewArrival: false, // You can modify this based on your logic
      }

      await addToCart(cartItem)
      
      // Show success toast
      Toast.show(
        `${title} has been added to your cart`,
        {type: 'success'}
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      Toast.show('Failed to add item to cart', {
        type: 'error',
      })
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const favoriteItem = {
        id,
        title,
        original_price,
        discounted_price,
        description,
        product_images,
      }

      await toggleFavorite(favoriteItem)
      
      // Show success toast
      const isCurrentlyFavorite = isItemInFavorites(id)
      Toast.show(`${title} has been ${isCurrentlyFavorite ? 'removed from' : 'added to'} your favorites`,{
        type: 'success',
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      Toast.show('Failed to update favorites',{
        type: 'error',
      })
    }
  }

  const isInFavorites = isItemInFavorites(id)
    
  return (
    <View className='w-[50%] mb-4'>
      <Pressable onPress={() => handleViewProduct(id)}>
        <Animated.View 
            className='w-full relative'
            entering={FadeInDown.duration(400).delay(200).springify()}
        >
          <View className='w-full h-48 bg-slate-200 rounded-3xl relative'>
            <Image 
                source={{uri: product_images[0]?.image_url}}
                style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16}}
            />

            {/* Cart Button */}
            <Pressable 
              className={`absolute bottom-2 right-2 p-3 flex justify-center items-center rounded-full bg-[#FEEEE6] ${cartUpdating ? 'opacity-70' : ''}`}
              onPress={handleAddToCart}
              disabled={cartUpdating}
            >
                <Ionicons 
                  name='cart-outline' 
                  size={20} 
                  color={'#F75F15'}
                />
            </Pressable>
          </View>

          <View className='bg-blue-100 flex-row justify-center w-[80%] gap-2 items-center p-1.5 my-2 rounded-full'>
              <MaterialIcons name='verified' size={15} color={'#4285F4'}/>
              <Text className='text-[#4285F4] text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Verified Seller
              </Text>
          </View>

          <View>
              <View>
                {
                  title.length > 35 ?
                  <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                    {title.slice(0, 35)}...
                  </Text> : 
                  <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                    {title}
                  </Text>
                }
                <View className='flex-row items-center gap-3'>
                  <Text className='text-base pt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    ₦ {original_price.toLocaleString()}
                  </Text>
                  <Text className='text-sm pt-2 italic line-through text-neutral-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                    ₦ {discounted_price.toLocaleString()}
                  </Text>
                </View>
              </View>
          </View>

          {/* Favorite Button */}
          <Pressable 
            className={`absolute top-2 left-2 p-3 flex justify-center items-center rounded-full bg-[#FEEEE6] ${favoritesUpdating ? 'opacity-70' : ''}`}
            onPress={handleToggleFavorite}
            disabled={favoritesUpdating}
          >
              <MaterialIcons 
                name={isInFavorites ? 'favorite' : 'favorite-outline'} 
                size={20} 
                color={'#F75F15'}
              />
          </Pressable>
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default Products