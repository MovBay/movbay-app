import React from 'react'
import { View, FlatList } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Individual product skeleton item
const ProductSkeletonItem = () => {
  const opacity = useSharedValue(0.3)

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.3, 1], [0.3, 0.7])
  }))

  return (
    <Animated.View 
      style={animatedStyle}
      className="bg-white w-[49%] rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Product Image Skeleton */}
      <View className="w-full h-40 bg-gray-200 rounded-t-2xl" />
      
      {/* Product Details Skeleton */}
      <View className="p-4 space-y-3">
        {/* Title Skeleton - 2 lines */}
        <View className="space-y-2">
          <View className="h-4 bg-gray-200 rounded w-full" />
          <View className="h-4 bg-gray-200 rounded w-3/4" />
        </View>
        
        {/* Description Skeleton - 1 line */}
        <View className="h-3 bg-gray-200 rounded w-5/6" />
        
        {/* Price Section Skeleton */}
        <View className="flex-row items-center justify-between pt-2">
          <View className="space-y-1">
            <View className="h-5 bg-gray-200 rounded w-16" />
            <View className="h-3 bg-gray-200 rounded w-12" />
          </View>
          
          {/* Add to cart button skeleton */}
          <View className="h-8 w-8 bg-gray-200 rounded-full" />
        </View>
      </View>
    </Animated.View>
  )
}

// Main skeleton loader component
const AllProductSkeleton2 = () => {
  const insets = useSafeAreaInsets()
  
  // Generate skeleton data
  const skeletonData = Array.from({ length: 6 }, (_, index) => ({ id: index }))
  
  const ItemSeparator = () => <View style={{ height: 15 }} />
  
  const renderSkeletonItem = ({ item }: { item: { id: number } }) => (
    <ProductSkeletonItem key={item.id} />
  )

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 30,
      }}
      data={skeletonData}
      keyExtractor={(item) => `skeleton-${item.id}`}
      numColumns={2}
      columnWrapperStyle={{ 
        justifyContent: 'space-between', 
        gap: 16, 
        paddingHorizontal: 24 
      }}
      renderItem={renderSkeletonItem}
      ItemSeparatorComponent={ItemSeparator}
      scrollEnabled={false} // Disable scrolling while loading
    />
  )
}

export default AllProductSkeleton2