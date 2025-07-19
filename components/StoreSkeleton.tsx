import React from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DimensionValue } from 'react-native';

const SkeletonBox = ({ width, height, borderRadius = 8 }: { 
  width: DimensionValue; 
  height: number; 
  borderRadius?: number 
}) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.3, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: '#E5E7EB',
          borderRadius,
        },
        animatedStyle,
      ]}
    />
  );
};

const StoreSkeletonLoader = () => {
  return (
    <SafeAreaView className='flex-1 bg-white'>
      <View className='px-5 relative flex-1'>
        {/* Header Skeleton */}
        <View className='flex-row justify-between items-center py-4'>
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={120} height={20} />
          <SkeletonBox width={40} height={40} borderRadius={20} />
        </View>


        {/* Store Profile Card Skeleton */}
        <View className='bg-gray-100 mt-5 rounded-2xl p-5'>
          <View className='flex-row justify-between items-center'>
            {/* Profile Image */}
            <View className='relative'>
              <SkeletonBox width={96} height={96} borderRadius={48} />
            </View>

            {/* Followers */}
            <View className='items-center'>
              <SkeletonBox width={40} height={28} />
              <View className='pt-1'>
                <SkeletonBox width={60} height={16} />
              </View>
            </View>

            {/* Badge */}
            <View className='items-center'>
              <SkeletonBox width={50} height={24} />
              <View className='pt-1'>
                <SkeletonBox width={40} height={16} />
              </View>
            </View>
          </View>

          {/* Store Info */}
          <View className='pt-5'>
            <SkeletonBox width="70%" height={24} />
            <View className='pt-2'>
              <SkeletonBox width="100%" height={16} />
              <View className='pt-1'>
                <SkeletonBox width="80%" height={16} />
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards Row 1 */}
        <View className='flex-row justify-between pt-5'>
          <View className='bg-gray-100 p-5 rounded-2xl w-[49%]'>
            <View className='flex-row justify-between items-center'>
              <SkeletonBox width={40} height={24} />
              <SkeletonBox width={30} height={16} />
            </View>
            <View className='pt-2.5'>
              <SkeletonBox width="80%" height={16} />
            </View>
          </View>

          <View className='bg-gray-100 p-5 rounded-2xl w-[49%]'>
            <View className='flex-row justify-between items-center'>
              <SkeletonBox width={30} height={24} />
              <SkeletonBox width={30} height={16} />
            </View>
            <View className='pt-2.5'>
              <SkeletonBox width="90%" height={16} />
            </View>
          </View>
        </View>

        {/* Stats Cards Row 2 */}
        <View className='flex-row justify-between pt-5'>
          <View className='bg-gray-100 p-5 rounded-2xl w-[49%]'>
            <View className='flex-row justify-between items-center'>
              <SkeletonBox width={80} height={24} />
              <SkeletonBox width={35} height={16} />
            </View>
            <View className='pt-2.5'>
              <SkeletonBox width="85%" height={16} />
            </View>
          </View>

          <View className='bg-gray-100 p-5 rounded-2xl w-[49%]'>
            <View className='items-center'>
              <SkeletonBox width={25} height={25} borderRadius={12.5} />
              <View className='pt-1'>
                <SkeletonBox width={70} height={16} />
              </View>
            </View>
          </View>
        </View>

        {/* Floating Action Button Skeleton */}
        <View className='absolute bottom-10 right-8'>
          <SkeletonBox width={80} height={80} borderRadius={40} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default StoreSkeletonLoader;