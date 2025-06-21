import { View, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'

// Usage in your Products component:
// Replace this line:
// <View className='pt-10'>
//   <ActivityIndicator size={'small'} color={'#F75F15'}/>
// </View>
// 
// With:
// <ProductsSkeleton />

const AllProductsSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start(() => animate())
    }
    animate()
  }, [animatedValue])

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  const SkeletonBox = ({ width, height, borderRadius = 8, style = {} }: any) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E0E0E0',
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  )

  const ProductCardSkeleton = () => (
    <View className='border border-neutral-200 bg-white rounded-2xl mb-4'>
      {/* Image skeleton */}
      <View className='w-full h-[280px] overflow-hidden rounded-t-2xl'>
        <SkeletonBox width="100%" height="100%" borderRadius={16} />
      </View>

      <View className='p-5'>
        {/* Title skeleton */}
        <SkeletonBox width="80%" height={28} borderRadius={4} />
        
        {/* Category and condition skeleton */}
        <View className='flex-row gap-2 pt-3'>
          <SkeletonBox width={80} height={16} borderRadius={4} />
          <SkeletonBox width={4} height={16} borderRadius={2} />
          <SkeletonBox width={90} height={16} borderRadius={4} />
        </View>

        {/* Price skeleton */}
        <View className='flex-row gap-3 items-center pt-4'>
          <SkeletonBox width={120} height={24} borderRadius={4} />
          <SkeletonBox width={100} height={20} borderRadius={4} />
        </View>

        {/* Buttons skeleton */}
        <View className='flex-row justify-between pt-5'>
          <SkeletonBox width="48%" height={48} borderRadius={24} />
          <SkeletonBox width="48%" height={48} borderRadius={24} />
        </View>
      </View>
    </View>
  )

  return (
    <View className='pt-5'>
      {/* Search bar skeleton */}
      <View className='relative mb-4'>
        <SkeletonBox width="100%" height={56} borderRadius={28} />
      </View>

      {/* Add product button skeleton */}
      <View className='pt-4'>
        <View className='ml-auto w-[40%]'>
          <SkeletonBox width="100%" height={48} borderRadius={24} />
        </View>

        {/* Product cards skeleton */}
        <View className='pt-5'>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    </View>
  )
}

export default AllProductsSkeleton