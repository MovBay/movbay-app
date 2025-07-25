import {SolidMainButton } from '@/components/btns/CustomButtoms';
import { DrawerHeader } from '@/components/btns/DrawerHeader';
import StoreSkeletonLoader from '@/components/StoreSkeleton';
import { useGetStore } from '@/hooks/mutations/sellerAuth';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, RefreshControl, ScrollView } from 'react-native';
import { Pressable, View } from 'react-native';
import {Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';

const Sell =()=> {

  const navigation = useNavigation()
  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }
  const {storeData, refetch, isLoading} = useGetStore()
  // console.log('Store Data:', storeData)
  
  // State for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing store data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <SafeAreaView className='flex-1 bg-white '>
      <StatusBar style='dark'/>

      {isLoading ? 
        <StoreSkeletonLoader />
        : 
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F75F15']} // Android
              tintColor={'#F75F15'} // iOS
            />
          }
        >
          {storeData === undefined ? 
            <View className='items-center justify-center flex-1'>
              <Animated.View entering={FadeInDown.duration(500).springify()} className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
                <MaterialIcons name='storefront' size={35} color={'#F75F15'}/>
              </Animated.View>

              <Animated.View className='w-[60%]' entering={FadeInDown.duration(500).delay(200).springify()}>
                <Text className='text-lg pt-3 text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Create Your Store</Text>
                <Text className='text-sm  text-center text-neutral-600 pt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Start selling in minutes. Create a store and reach thousands of buyers nearby.
                </Text>
              </Animated.View>

              <Animated.View className='w-[50%] pt-5' entering={FadeInDown.duration(500).delay(400).springify()}>
                <SolidMainButton text='Create Store' onPress={()=>router.push('/store-create')}/>
              </Animated.View>
            </View>
          :
            <View className='px-5 relative flex-1'>
              <DrawerHeader onPress={openDrawer}/>
    
              <Animated.View className='pt-5' entering={FadeInDown.duration(500).springify()}>
                <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Welcome back, {storeData?.data?.name}!</Text>
                <Text className='text-sm' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Manage your products, orders, and earnings here.</Text>
              </Animated.View>
    
              <Animated.View className='bg-gray-100 mt-5 rounded-2xl p-5' entering={FadeInDown.duration(500).delay(200).springify()}>
                <View className='flex-row justify-between items-center'>
    
                  <View className='relative'>
                    <View className='w-24 h-24 object-cover overflow-hidden flex rounded-full border-2 border-green-800 p-1'>
                      <Image source={{uri: storeData?.data?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
                    </View>
                    <View className='bg-white absolute top-1 right-0 p-0.5 rounded-full'>
                      <MaterialIcons name='verified' size={25} color={'#4285F4'}/>
                    </View>
                  </View>
    
                  <View>
                      <Text className='text-2xl text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
                      <Text className='text-sm text-center' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Followers</Text>
                  </View>
    
                  <View>
                      <Text className='text-lg text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>5-Star</Text>
                      <Text className='text-sm text-center' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Badge</Text>
                  </View>
                </View>
    
                <View className='pt-5'>
                  <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.name}</Text>
                  <Text className='text-sm pt-1 text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{storeData?.data?.description}</Text>
                </View>
              </Animated.View>
    
              <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(500).delay(400).springify()}>
                <View className='bg-[#e5eefd] p-5 rounded-2xl w-[49%]'>
                  <View className='flex-row justify-between'>
                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-purple-600'>{storeData?.data?.product_count}</Text>
                    <View className='flex-row gap-1 items-center'>
                      <Ionicons name='trending-up' color={'green'} size={15}/>
                      <Text className='text-green-700 text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>0%</Text>
                    </View>
                  </View>
                  <Text className='text-sm pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Product Listed</Text>
                </View>
    
                <View className='bg-[#FFF7EB] p-5 rounded-2xl w-[49%]'>
                  <View className='flex-row justify-between'>
                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-orange-500'>{storeData?.data?.order_count}</Text>
                    <View className='flex-row gap-1 items-center'>
                      <Ionicons name='trending-down' color={'red'} size={15}/>
                      <Text className='text-red-500 text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>0%</Text>
                    </View>
                  </View>
                  <Text className='text-sm pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Orders This Week</Text>
                </View>
              </Animated.View>
    
              <Animated.View className='flex-row justify-between pt-5 pb-20' entering={FadeInDown.duration(500).delay(600).springify()}>
                <View className='bg-[#F3EBFF] p-5 rounded-2xl w-[49%]'>
                  <View className='flex-row justify-between'>
                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-purple-600'>₦182,000</Text>
                    <View className='flex-row gap-1 items-center'>
                      <Ionicons name='trending-up' color={'green'} size={15}/>
                      <Text className='text-green-700 text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>28%</Text>
                    </View>
                  </View>
                  <Text className='text-sm pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Earnings This Month</Text>
                </View>
    
                <Pressable className='bg-gray-100  p-5 rounded-2xl w-[49%]' onPress={()=>router.push('/(access)/(user_stacks)/user_story_post')}>
                  <MaterialIcons name='add' size={25} style={{margin: 'auto'}}/>
                  <Text className='text-sm pt-1 text-center' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Post on story</Text>
                </Pressable>
              </Animated.View>
    
              <Pressable className='absolute bottom-10 right-8 bg-[#F75F15] p-6 rounded-full border-4 border-gray-200'>
                <MaterialIcons name='motorcycle' size={30} color={'white'} style={{margin: 'auto'}}/>
                <Text className='text-sm text-white text-center' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Courier</Text>
              </Pressable>
            </View>
          }
        </ScrollView>
      }
    </SafeAreaView>
  );
}

export default Sell;