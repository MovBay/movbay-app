import { View, Text, ActivityIndicator, Pressable, FlatList, RefreshControl } from 'react-native'
import React, { useCallback } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Image } from 'react-native'
import { useFollowStore, useGetFollowedStores, useGetOpenStore, useGetStore, useGetUserProducts, useUnFollowStore } from '@/hooks/mutations/sellerAuth'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { router, useLocalSearchParams } from 'expo-router'
import { OnboardArrowHeader } from '@/components/btns/OnboardHeader'
import Products from '@/components/Products'
import { Toast } from 'react-native-toast-notifications'

// Fixed helper function with proper type conversion
const isStoreFollowed = (storeId: any, followedStores: any) => {
  if (!followedStores || !Array.isArray(followedStores)) return false;
  
  // Convert storeId to number for comparison since API returns numbers
  const numericStoreId = parseInt(storeId?.toString());
  
  return followedStores.some(item => {
    const followedStoreId = item?.followed_store?.id;
    return followedStoreId === numericStoreId;
  });
};

const ViewSellerStore = () => {
  // Get the storeId from the route parameters
  const { storeId } = useLocalSearchParams<{ storeId: string }>()
  
  // Pass the storeId to your hook
  const { openStore, isLoading } = useGetOpenStore(storeId)
  const { userProductData, isLoading: productLoading, refetch } = useGetUserProducts()
  const { storeData, refetch: refetchStoreData } = useGetStore() // Get current user's store data
  const openStoreData = openStore?.data

  const ItemSeparator = () => <View style={{ height: 15 }} />
  const insets = useSafeAreaInsets()
  const { getFollowedStores } = useGetFollowedStores()
  
  const followedStoresData = getFollowedStores?.data || []
  const isCurrentStoreFollowed = isStoreFollowed(storeId, followedStoresData)
  
  // Convert storeId to proper type for hooks
  const numericStoreId = parseInt(storeId?.toString() || '0')
  const { isPending, mutate } = useFollowStore(numericStoreId)
  const { isPending: unFollowPending, mutate: unfollowMutate } = useUnFollowStore(numericStoreId)

  // Check if this is the current user's own store
  const isOwnStore = storeData?.data?.id === numericStoreId

  const handleFollowUnfollowStore = async () => {
    if (!storeId) {
      Toast.show("Store ID not found", { type: "error" })
      return
    }

    try {
      if (isCurrentStoreFollowed) {
        await unfollowMutate(numericStoreId)
        refetchStoreData()
        Toast.show("Store unfollowed successfully", { type: "success" })
      } else {
        await mutate(numericStoreId)
        refetchStoreData()
        Toast.show("Store followed successfully", { type: "success" })
      }
    } catch (error) {
      console.error("Error following/unfollowing store:", error)
      const errorMessage = isCurrentStoreFollowed 
        ? "Failed to unfollow store" 
        : "Failed to follow store"
      Toast.show(errorMessage, { type: "error" })
    }
  }

  const isFollowLoading = isPending || unFollowPending

  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <Products
        id={item.id.toString()}
        title={item.title}
        original_price={item.original_price}
        product_images={item.product_images}
        description={item.description}
        discounted_price={item.discounted_price}
        stock_available={item.stock_available}
        store={item.store}
      />
    ),
    [],
  )

  // Header component for the FlatList
  const ListHeaderComponent = () => (
    <View className=''>
      <View className='flex-row justify-between items-center'>
        <View className='w-20 h-20 object-cover overflow-hidden flex rounded-full border-2 border-green-800 p-1'>
          <Image source={{uri: openStoreData?.products[0]?.store?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
        </View>

        <View>
          <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{openStoreData?.post_count}</Text>
          <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Post</Text>
        </View>

        <Pressable>
          <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{openStoreData?.follower_count}</Text>
          <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Followers</Text>
        </Pressable>

        <Pressable>
          <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{openStoreData?.following_count}</Text>
          <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Following</Text>
        </Pressable>
      </View>

      <View className='pt-5 flex-row items-center justify-between'>
        <View>
          <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{openStoreData?.name}</Text>
          <Text className='text-sm text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{openStoreData?.description}</Text>
        </View>
      </View>

      {/* Fixed condition check - compare numeric values */}
      {isOwnStore ? (
        <View className='pt-5'>
          <View className='w-[100%]'>
            <SolidLightButton text='Shop More' onPress={()=>router.push('/(access)/(user_tabs)/home')}/>
          </View>
        </View>
      ) : (
        <View className='flex-row items-center justify-between pt-5'>
          <View className='w-[49%]'>
            <SolidLightButton text='Shop More' onPress={()=>router.push('/(access)/(user_tabs)/home')}/>
          </View>

          {isFollowLoading ? (
            <View className='w-[49%]'>
              <Pressable
                className="bg-[#F75F15] p-4 rounded-full justify-center items-center"
                disabled
              >
                <ActivityIndicator size="small" color="white" />
              </Pressable>
            </View>
          ) : (
            <View className='w-[49%]'>
              <SolidMainButton 
                text={isCurrentStoreFollowed ? 'Unfollow' : 'Follow'} 
                onPress={handleFollowUnfollowStore}
              />
            </View>
          )}
        </View>
      )}

      <View className='pt-5' />
    </View>
  )

  // Empty state component
  const EmptyComponent = () => (
    <View className='justify-center items-center flex-1 pt-20'>
      <Image source={require('../../../assets/images/save.png')} style={{width: 70, height: 70, justifyContent: 'center', margin: 'auto'}}/>
      <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>No product posted yet</Text>
    </View>
  )
    
  return (
    <SafeAreaView className='flex-1 bg-white px-8'>
      <StatusBar style='dark'/>
      <View className='flex-row items-center pt-5'>
        <OnboardArrowHeader onPressBtn={()=>router.back()}/>
      </View>

      {isLoading || productLoading ? 
        <View className='justify-center items-center pt-40'>
          <ActivityIndicator size={'large'} color={'green'}/>
        </View> : 
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
            flexGrow: 1,
          }}
          ListHeaderComponent={ListHeaderComponent}
          data={openStoreData?.products || []}
          keyExtractor={(item) => `product-${item.id}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", gap: 10, paddingHorizontal: 5 }}
          renderItem={renderProduct}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={EmptyComponent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={productLoading}
              onRefresh={refetch}
              tintColor="green"
            />
          }
        />
      }
    </SafeAreaView>
  )
}

export default ViewSellerStore