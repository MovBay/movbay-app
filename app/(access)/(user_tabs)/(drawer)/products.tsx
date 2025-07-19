import { View, Text, ActivityIndicator, Image, TextInput, Pressable, RefreshControl, TouchableOpacity } from 'react-native'
import React, { useState, useCallback, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeader } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useGetUserProducts } from '@/hooks/mutations/sellerAuth'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidMainButton } from '@/components/btns/CustomButtoms'
import { router } from 'expo-router'
import { StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import AllProductsSkeleton from '@/components/AllProductSkeleton'

const Products = () => {
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const navigation = useNavigation()

    const openDrawer = () => {
      navigation.dispatch(DrawerActions.openDrawer())
    }

    const {userProductData, isLoading, refetch} = useGetUserProducts()
    const userData = userProductData?.data?.results

    // Filter products based on search query
    const filteredProducts = useMemo(() => {
        if (!userData || !searchQuery.trim()) {
            return userData || []
        }

        const query = searchQuery.toLowerCase().trim()
        
        return userData.filter((product: any) => {
            const titleMatch = product?.title?.toLowerCase().includes(query)
            const categoryMatch = product?.category?.toLowerCase().includes(query)
            const conditionMatch = product?.condition?.toLowerCase().includes(query)
            const descriptionMatch = product?.description?.toLowerCase().includes(query)
            return titleMatch || categoryMatch || conditionMatch || descriptionMatch
        })
    }, [userData, searchQuery])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await refetch?.()
        } catch (error) {
            console.error('Error refreshing data:', error)
        } finally {
            setRefreshing(false)
        }
    }, [refetch])

    const handleSearchChange = (text: string) => {
        setSearchQuery(text)
    }

    const clearSearch = () => {
        setSearchQuery('')
    }


    const handleViewProduct = (id: string) =>{
      router.push(`/userProduct/${id}` as any)
    }
  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
        <StatusBar style='dark'/>
        <DrawerHeader onPress={openDrawer}/>

        <KeyboardAwareScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#F75F15']} // Android
                    tintColor='#F75F15' // iOS
                />
            }
        >

          {isLoading || userProductData?.data === undefined ? 

            <AllProductsSkeleton />
            
            :
            <>
              {userProductData?.data?.results?.length === 0 ? 
                <View className='flex-1'>
                  <View className='justify-center items-center flex-1 pt-40'>
                    <Image source={require('../../../../assets/images/save.png')} style={{width: 70, height: 70, justifyContent: 'center', margin: 'auto'}}/>
                    <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>No product posted yet</Text>
                    <View className='w-[50%] pt-5'>
                      <SolidMainButton text='Create Products' onPress={()=>router.push('/(access)/(user_stacks)/product-create')}/>
                    </View>
                  </View>
                </View> : 
                
                <View className='pt-5'>

                  <View className='relative'>
                    <TextInput 
                        placeholder='Search for products, stores, or categories'
                        placeholderTextColor={"#AFAFAF"}
                        onChangeText={handleSearchChange}
                        value={searchQuery}
                        keyboardType="default"
                        style={styles.inputStyle}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    
                    <View className='absolute right-6 top-4 flex-row items-center'>
                      {searchQuery.length > 0 && (
                        <Pressable onPress={clearSearch} className='mr-2'>
                          <Ionicons name='close-circle' size={20} color={'gray'}/>
                        </Pressable>
                      )}
                      <Ionicons name='search' size={20} color={'gray'}/>
                    </View>
                  </View>

                  {/* Search Results Info */}
                  {searchQuery.trim() && (
                    <View className='pt-3'>
                      <Text className='text-sm text-gray-600' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                        {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found for "{searchQuery}"
                      </Text>
                    </View>
                  )}

                  <View className='pt-4'>
                    <TouchableOpacity className='flex-row gap-4 p-3 px-4 rounded-3xl w-[100%] items-center bg-[#F75F15]' onPress={()=>router.push('/(access)/(user_stacks)/product-create')}>
                      <View className='bg-white p-3 rounded-2xl'>
                        <MaterialIcons name='add' size={25} color={'#F75F15'}/>
                      </View>
                      <View className=''>
                        <Text className='text-white text-lg ' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>Add New Product</Text>
                        <Text className='text-white text-sm ' style={{fontFamily:'HankenGrotesk_500Medium'}}>Click here to list new product </Text>
                      </View>
                    </TouchableOpacity>

                    {/* No Search Results */}
                    {searchQuery.trim() && filteredProducts.length === 0 ? (
                      <View className='justify-center items-center pt-20'>
                        <Ionicons name='search-outline' size={60} color={'#AFAFAF'}/>
                        <Text className='text-lg text-center pt-4 text-gray-400' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                          No products found
                        </Text>
                        <Text className='text-sm text-center pt-1 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                          Try searching with different keywords
                        </Text>
                        <Pressable onPress={clearSearch} className='mt-4'>
                          <Text className='text-[#F75F15] text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                            Clear Search
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View className='pt-5 flex-col gap-4 pb-10'>
                        
                        {filteredProducts.map((eachData:any, index:any)=>(
                          <Pressable onPress={()=>handleViewProduct(eachData?.id)} key={index}  className='border border-neutral-200 bg-white rounded-2xl'>
                            <View className='w-full h-[280px] overflow-hidden rounded-2xl'>
                              <Image source={{uri: eachData?.product_images[0]?.image_url}} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                            </View>

                            <View className=' p-5'>
                              <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{eachData?.title}</Text>

                              {/* Show category and condition if they exist */}

                              <View className='flex-row justify-between items-center'>

                                {(eachData?.category || eachData?.condition) && (
                                  <View className='flex-row gap-2 pt-1'>
                                    {eachData?.category && (
                                      <Text className='text-sm text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                        {eachData.category}
                                      </Text>
                                    )}
                                    {eachData?.category && eachData?.condition && (
                                      <Text className='text-sm text-gray-500'>•</Text>
                                    )}
                                    {eachData?.condition && (
                                      <Text className='text-sm text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                        {eachData.condition}
                                      </Text>
                                    )}
                                  </View>
                                )}
                                <View className='flex-row gap-3 items-center pt-2'>
                                  <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>₦{eachData?.original_price?.toLocaleString()}</Text>
                                  <Text className='text-base line-through text-gray-500 italic' style={{fontFamily: 'HankenGrotesk_400Regular'}}>₦{eachData?.discounted_price?.toLocaleString()}</Text>
                                </View>
                              </View>


                              <View className='flex-row justify-between pt-5'>
                                 <Pressable className='justify-center rounded-full w-[48%] flex-row items-center bg-[#FEEEE6]' onPress={()=>router.push('/(access)/(user_stacks)/product-create')}>
                                  <Ionicons name='trash-outline' size={16} color={'#A53F0E'}/>
                                  <Text className='text-[#A53F0E] text-base p-3' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>Delete</Text>
                                </Pressable>

                                <Pressable className='justify-center rounded-full w-[48%] flex-row items-center bg-[#F75F15]' onPress={()=>router.push('/(access)/(user_stacks)/product-create')}>
                                  <MaterialIcons name='edit' size={16} color={'white'}/>
                                  <Text className='text-white text-base p-3' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>Edit</Text>
                                </Pressable>
                              </View>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
            }
            </>
          }
        </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Products

const styles = StyleSheet.create({
    inputStyle: {
        borderRadius: 50,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingRight: 60,
        fontFamily: "HankenGrotesk_400Regular",
        backgroundColor: '#F6F6F6',
    },
})