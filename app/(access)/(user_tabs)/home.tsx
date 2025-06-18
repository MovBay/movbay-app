import Products from '@/components/Products'
import { products, shopCategory, statusShopData } from '@/constants/datas';
import { useProfile } from '@/hooks/mutations/auth';
import { useGetProducts } from '@/hooks/mutations/sellerAuth';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import {Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {

  const {profile, isLoading, refetch: refetchProfile} = useProfile()
  const {productData, isLoading: productLoading, refetch: refetchProducts} = useGetProducts()
  const allProducts = productData?.data?.results

  const [activeCategoryId, setActiveCategoryId] = useState(shopCategory[0]?.id);
  const [isRefetchingByUser, setIsRefetchingByUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const ItemSeparator = () => <View style={{ height: 15 }} />;
  const insets = useSafeAreaInsets();

  // Enhanced refresh function
  async function refetchByUser() {
    setIsRefetchingByUser(true);

    try {
      // Refetch both profile and products data
      await Promise.all([
        refetchProfile?.(),
        refetchProducts?.()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefetchingByUser(false);
    }
  }

  // Search and filter functionality
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    let filtered = allProducts;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product: any) => {
        return (
          product.title?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.condition?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.store?.name?.toLowerCase().includes(query) ||
          product.store?.store_name?.toLowerCase().includes(query)
        );
      });
  }

    // Filter by active category (if you want to implement category filtering)
    // You can uncomment this if your products have category field
    /*
    if (activeCategoryId && activeCategoryId !== shopCategory[0]?.id) {
      const activeCategory = shopCategory.find(cat => cat.id === activeCategoryId);
      if (activeCategory) {
        filtered = filtered.filter(product => 
          product.category?.toLowerCase() === activeCategory.name.toLowerCase()
        );
      }
    }
    */

    return filtered;
  }, [allProducts, searchQuery, activeCategoryId]);

  // Handle search input change
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Header component to be used in FlatList
  const ListHeaderComponent = () => (
    <View className='px-6 pt-5'>
      <View className='flex-row items-center justify-between'>

        {isLoading ? <View className='pt-4'><ActivityIndicator size={'small'} color={'#F75F15'}/></View> : 
          <View className='flex-row gap-4 items-center'>
            <Pressable onPress={()=>router.push('/profile')} className='flex w-12 h-12 rounded-full bg-gray-100 justify-center items-center overflow-hidden'>
              {profile?.data?.profile_picture === null ? 
                <MaterialIcons name='person-2' size={50} color={'gray'} />
                :
                <Image source={{uri: profile?.data?.profile_picture}} style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
              }
            </Pressable>
            <View>
              <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className='text-base'>Hi, {profile?.data?.fullname}</Text>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-sm text-neutral-500'>@{profile?.data?.username}</Text>
            </View>
          </View>
        }

        <View className='flex-row gap-3 items-center'>
          <Pressable className='bg-neutral-100 w-fit relative flex justify-center items-center rounded-full p-2.5'>
            <Ionicons name='notifications-outline' color={'#0F0F0F'} size={26}/>
            <View className='absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5'>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xs text-red-500'>0</Text>
            </View>
          </Pressable>

          <Pressable className='bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2.5'>
            <Ionicons name='cart-outline' color={'#0F0F0F'} size={26}/>
            <View className='absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5'>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xs text-red-500'>0</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View className='flex-row items-center gap-2 justify-between pt-5'>
        <View className='bg-[#F6F6F6] px-4 rounded-full w-[85%] relative'>
          <TextInput 
            placeholder='Search for products, stores, categories...'
            placeholderTextColor={"gray"}
            style={styles.inputStyle}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />

          <View className='absolute right-7 top-4 flex-row items-center gap-2'>
            {searchQuery.length > 0 && (
              <Pressable onPress={clearSearch}>
                <Ionicons name='close-circle' size={20} color={'gray'}/>
              </Pressable>
            )}
            <Ionicons name='search' size={20} color={'gray'}/>
          </View>
        </View>

        <Pressable className='bg-[#F6F6F6] justify-center items-center flex-col rounded-full p-3.5'>
          <Ionicons name='filter' size={20} color={'gray'}/>
        </Pressable>
      </View>

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View className='pt-3'>
          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-sm text-neutral-600'>
            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* Status Shop Data - Horizontal ScrollView */}
      {searchQuery.length === 0 && (
        <View className='pt-5'>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={statusShopData}
            keyExtractor={(item, index) => `status-${index}`}
            renderItem={({ item, index }) => (
              <Animated.View className='mr-5' entering={FadeInDown.duration(500).springify()}>
                <View className='w-24 h-24 border border-dashed border-red-500 p-1.5 rounded-full justify-center items-center flex'>
                  <Image 
                    source={item?.image}
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </View>
                <Text className='text-sm pt-2 text-neutral-600' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                  {item?.name.slice(0, 11)}...
                </Text>
              </Animated.View>
            )}
          />
        </View>
      )}

      {/* Shop Categories - Horizontal ScrollView */}
      {searchQuery.length === 0 && (
        <View className='pt-5 pb-5'>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={shopCategory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
                <Pressable
                  onPress={() => setActiveCategoryId(item.id)}
                  className={`mr-4 border p-3 px-6 rounded-full ${
                    activeCategoryId === item.id 
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-neutral-300'
                  }`}
                >
                  <Text 
                    className={`text-base ${
                      activeCategoryId === item.id ? 'text-orange-600' : 'text-neutral-700'
                    }`}
                    style={{ fontFamily: 'HankenGrotesk_500Medium' }}
                  >
                    {item?.name}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>

      {productLoading ? 
        <View className='pt-20'>
          <ActivityIndicator size={'small'} color={'#F75F15'}/>
        </View> :
      
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              colors={['#F75F15']} // Android
              tintColor={'#F75F15'} // iOS
            />
          }
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
          }}
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "center", gap: 16, paddingHorizontal: 24 }}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={({ item }) => (
            <Products
              id={item.id.toString()}
              title={item.title}
              original_price={item.original_price}
              product_images={item.product_images}
              description={item.description}
              discounted_price={item.discounted_price}
              // store={item.store}
              // reviews={item.reviews}
            />
          )}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={
            <View className="h-[30vh] w-full items-center justify-center">
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                }}
                className="text-lg text-gray-800"
              >
                {searchQuery.length > 0 ? `No results found for "${searchQuery}"` : "No item found"}
              </Text>
              {searchQuery.length > 0 && (
                <Pressable onPress={clearSearch} className="mt-2">
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                    }}
                    className="text-base text-orange-600"
                  >
                    Clear search
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      }
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    width: '100%'
  },
});