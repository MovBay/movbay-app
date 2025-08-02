import { View, Text, Image, TextInput, Pressable, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useCallback, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeader } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useFavorites } from '@/context/favorite-context'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'

const SavedProduct = () => {
    const [refreshing, setRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const navigation = useNavigation()

    const { 
        favoriteItems, 
        isLoading, 
        removeFromFavorites, 
        clearFavorites, 
        loadFavorites 
    } = useFavorites()

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer())
    }

    // Filter saved products based on search query
    const filteredProducts = useMemo(() => {
        if (!favoriteItems || !searchQuery.trim()) {
            return favoriteItems || []
        }

        const query = searchQuery.toLowerCase().trim()
        
        return favoriteItems.filter((product) => {
            const titleMatch = product?.title?.toLowerCase().includes(query)
            const descriptionMatch = product?.description?.toLowerCase().includes(query)
            return titleMatch || descriptionMatch
        })
    }, [favoriteItems, searchQuery])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await loadFavorites()
        } catch (error) {
            console.error('Error refreshing saved products:', error)
        } finally {
            setRefreshing(false)
        }
    }, [loadFavorites])

    const handleSearchChange = (text: string) => {
        setSearchQuery(text)
    }

    const clearSearch = () => {
        setSearchQuery('')
    }

    const handleRemoveFromFavorites = (productId: string, productTitle: string) => {
        Alert.alert(
            'Remove from Saved',
            `Are you sure you want to remove "${productTitle}" from your saved products?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeFromFavorites(productId),
                },
            ]
        )
    }

    const handleClearAllFavorites = () => {
        if (favoriteItems.length === 0) return

        Alert.alert(
            'Clear All Saved Products',
            'Are you sure you want to remove all saved products? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: clearFavorites,
                },
            ]
        )
    }

    const handleViewProduct = (id: string) => {
        router.push(`/product/${id}` as any) // Adjust route as needed
    }

    if (isLoading) {
        return (
            <SafeAreaView className='flex-1 bg-white px-5'>
                <StatusBar style='dark'/>
                <View className="flex-row items-center gap-2">
                  <OnboardArrowTextHeader onPressBtn={() => router.back()} />
                  <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Saved Products
                  </Text>
                </View>
                
                <View className='flex-1 justify-center items-center'>
                    <Text className='text-base text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                        Loading saved products...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-white px-5'>
            <StatusBar style='dark'/>
            <View className="flex-row items-center gap-2">
                <OnboardArrowTextHeader onPressBtn={() => router.back()} />
                <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                  Saved Products
                </Text>
              </View>

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
                {favoriteItems.length === 0 ? 
                    <View className='flex-1'>
                        <View className='justify-center items-center flex-1 pt-40'>
                            <MaterialIcons name='favorite-outline' size={60} color={'#AFAFAF'}/>
                            <Text className='text-base text-center pt-2 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                No saved products yet
                            </Text>
                            <Text className='text-sm text-center pt-1 text-gray-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                Browse products and save your favorites
                            </Text>
                        </View>
                    </View> 
                    : 
                    <View className='pt-5'>
                        {/* Search Bar */}
                        <View className='relative'>
                            <TextInput 
                                placeholder='Search saved products...'
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

                        {/* Clear All Button */}
                        {favoriteItems.length > 0 && (
                            <View className='pt-4'>
                                <TouchableOpacity 
                                    className='flex-row gap-4 p-3 px-4 rounded-3xl w-[100%] items-center bg-red-500' 
                                    onPress={handleClearAllFavorites}
                                >
                                    <View className='bg-white p-3 rounded-2xl'>
                                        <Ionicons name='trash-outline' size={25} color={'#EF4444'}/>
                                    </View>
                                    <View className=''>
                                        <Text className='text-white text-lg ' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>
                                            Clear All Saved
                                        </Text>
                                        <Text className='text-white text-sm ' style={{fontFamily:'HankenGrotesk_500Medium'}}>
                                            Remove all saved products
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* No Search Results */}
                        {searchQuery.trim() && filteredProducts.length === 0 ? (
                            <View className='justify-center items-center pt-20'>
                                <Ionicons name='search-outline' size={60} color={'#AFAFAF'}/>
                                <Text className='text-lg text-center pt-4 text-gray-400' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                                    No saved products found
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
                                {filteredProducts.map((eachData, index) => (
                                    <Pressable 
                                        onPress={() => handleViewProduct(eachData?.id)} 
                                        key={index}  
                                        className='border border-neutral-200 bg-white rounded-2xl'
                                    >
                                        <View className='w-full h-[280px] overflow-hidden rounded-t-2xl'>
                                            <Image 
                                                source={{uri: eachData?.product_images?.[0]?.image_url || eachData?.product_images?.[0]}} 
                                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                            />
                                        </View>

                                        <View className='p-5'>
                                            <Text className='text-xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                                {eachData?.title}
                                            </Text>

                                            {/* Date Added */}
                                            <Text className='text-sm text-gray-500 pt-1' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                                Saved on {new Date(eachData?.dateAdded).toLocaleDateString()}
                                            </Text>

                                            {/* Price Section */}
                                            <View className='flex-row justify-between items-center pt-2'>
                                                <View className='flex-row gap-3 items-center'>
                                                    <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                                        ₦{eachData?.original_price?.toLocaleString()}
                                                    </Text>
                                                    {eachData?.discounted_price && eachData?.discounted_price !== eachData?.original_price && (
                                                        <Text className='text-base line-through text-gray-500 italic' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                                                            ₦{eachData?.discounted_price?.toLocaleString()}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Description Preview */}
                                            {eachData?.description && (
                                                <Text 
                                                    className='text-sm text-gray-600 pt-2' 
                                                    style={{fontFamily: 'HankenGrotesk_400Regular'}}
                                                    numberOfLines={2}
                                                >
                                                    {eachData.description}
                                                </Text>
                                            )}

                                            {/* Action Buttons */}
                                            <View className='flex-row justify-between pt-5'>
                                                <Pressable 
                                                    className='justify-center rounded-full w-[48%] flex-row items-center bg-[#FEEEE6]' 
                                                    onPress={() => handleRemoveFromFavorites(eachData.id, eachData.title)}
                                                >
                                                    <Ionicons name='heart-dislike-outline' size={16} color={'#A53F0E'}/>
                                                    <Text className='text-[#A53F0E] text-base p-3' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>
                                                        Remove
                                                    </Text>
                                                </Pressable>

                                                <Pressable 
                                                    className='justify-center rounded-full w-[48%] flex-row items-center bg-[#F75F15]' 
                                                    onPress={() => handleViewProduct(eachData?.id)}
                                                >
                                                    <MaterialIcons name='visibility' size={16} color={'white'}/>
                                                    <Text className='text-white text-base p-3' style={{fontFamily:'HankenGrotesk_600SemiBold'}}>
                                                        View
                                                    </Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                }
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}

export default SavedProduct

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