import { View, Text, ActivityIndicator, Pressable, RefreshControl } from 'react-native'
import React, { useCallback } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeaderMany } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native'
import { useGetStore, useGetUserProducts } from '@/hooks/mutations/sellerAuth'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { FlatList } from 'react-native'
import Products from '@/components/Products'

const Store = () => {

    const navigation = useNavigation()
    const openDrawer = () => {
      navigation.dispatch(DrawerActions.openDrawer())
    }

    const {storeData, isLoading} = useGetStore()
    const {userProductData, isLoading: productLoading, refetch} = useGetUserProducts()
    const userData = userProductData?.data?.results
    console.log('This is store data', storeData?.data)
    console.log('This is user product data', userProductData?.data)

    const ItemSeparator = () => <View style={{ height: 15 }} />
    const insets = useSafeAreaInsets()
  
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
            <Image source={{uri: storeData?.data?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
          </View>

          <View>
            <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.product_count}</Text>
            <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Post</Text>
          </View>

          <Pressable onPress={()=>router.push('/(access)/(user_stacks)/user_follows')}>
            <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.followers_count}</Text>
            <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Followers</Text>
          </Pressable>

          <Pressable onPress={()=>router.push('/(access)/(user_stacks)/user_follows')}>
            <Text className='text-center text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.following_count}</Text>
            <Text className='text-center text-sm text-neutral-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Following</Text>
          </Pressable>
        </View>

        <View className='pt-5 flex-row items-center justify-between'>
          <View>
            <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.name}</Text>
            <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{storeData?.data?.description}</Text>
          </View>
        </View>

        <View className='flex-row items-center justify-between pt-5'>
          <View className='w-[100%]'>
            <SolidLightButton text='Share Profile'/>
          </View>
        </View>

        {/* Add some spacing before products */}
        <View className='pt-5' />
      </View>
    )

    // Empty state component
    const EmptyComponent = () => (
      <View className='justify-center items-center flex-1 pt-20'>
        <Image source={require('../../../../assets/images/save.png')} style={{width: 70, height: 70, justifyContent: 'center', margin: 'auto'}}/>
        <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>No product posted yet</Text>
      </View>
    )

  return (
    <SafeAreaView className='flex-1 bg-white px-8'>
        <StatusBar style='dark'/>
        <View className='flex-row items-center pt-5'>
          <DrawerHeaderMany onPress={openDrawer}/>
          <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Store</Text>

          <View className='bg-neutral-100 rounded-full p-3 flex'>
            <Ionicons name='share-outline' size={20} color={'black'}/>
          </View>
        </View>

        {isLoading || productLoading ? 
          <View className='justify-center items-center pt-20'>
            <ActivityIndicator size={'small'} color={'green'}/>
          </View> : 
          <FlatList
            className='pt-5'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 30,
              flexGrow: 1,
            }}
            ListHeaderComponent={ListHeaderComponent}
            data={userData || []}
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

export default Store