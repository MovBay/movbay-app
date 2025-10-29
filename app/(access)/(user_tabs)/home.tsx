import AllProductSkeleton2 from "@/components/AllProductSkeleton2"
import Products from "@/components/Products"
import { shopCategory } from "@/constants/datas"
import { useProfile } from "@/hooks/mutations/auth"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorite-context"
import { useGetProductsOriginal, useGetStoreStatus } from "@/hooks/mutations/sellerAuth"
import Ionicons from "@expo/vector-icons/Ionicons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { router, useFocusEffect } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { ActivityIndicator, FlatList, RefreshControl } from "react-native"
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useFilters } from "@/hooks/useFilter"

export default function HomeScreen() {
  const { profile, isLoading, refetch: refetchProfile } = useProfile()
  const {
    productData,
    isLoading: productLoading,
    refetch: refetchProducts,
  } = useGetProductsOriginal()
  const { storeStatusData, isLoading: storeStatusLoading, refetch: storeRefetch } = useGetStoreStatus()

  // Safely handle product data - make sure it's always an array
  const allProducts = useMemo(() => {
    try {
      const products = productData?.data?.results ?? productData?.data
      return Array.isArray(products) ? products : []
    } catch (error) {
      console.error("Error processing products:", error)
      return []
    }
  }, [productData])

  const { cartLength, isUpdating } = useCart()
  const { favoritesLength, isUpdating: favoritesUpdating } = useFavorites()
  const [activeCategoryId, setActiveCategoryId] = useState(shopCategory[0]?.id ?? null)
  const [isRefetchingByUser, setIsRefetchingByUser] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const searchInputRef = useRef<TextInput>(null)
  const categoryFlatListRef = useRef<FlatList>(null)
  const isMountedRef = useRef(true)
  const isRefetchingRef = useRef(false)

  const { filterSettings, isLoading: isLoadingFilters, hasActiveFilters, applyFilters, refreshFilters } = useFilters()

  const ItemSeparator = () => <View style={{ height: 15 }} />
  const insets = useSafeAreaInsets()

  const formatCategoryName = useCallback((name: string) => {
    return name.replace(/_/g, " ")
  }, [])

  // Track mount state - CRITICAL: Must run first
  useEffect(() => {
    isMountedRef.current = true
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setHasInitiallyLoaded(true)
      }
    }, 100)

    return () => {
      isMountedRef.current = false
      isRefetchingRef.current = false
      clearTimeout(timer)
    }
  }, [])

  // Refresh filters when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh filters from storage when returning to this screen
      refreshFilters()
    }, [refreshFilters])
  )

  // Silent background refetch when screen focused
  useFocusEffect(
    useCallback(() => {
      let timeoutId: NodeJS.Timeout | null = null
      let isCancelled = false

      const silentRefetch = async () => {
        // Check if already refetching or unmounted
        if (isRefetchingRef.current || !isMountedRef.current) {
          return
        }

        timeoutId = setTimeout(async () => {
          if (isCancelled || !isMountedRef.current) return

          isRefetchingRef.current = true

          try {
            // Refetch profile with error handling
            if (!isCancelled && isMountedRef.current && typeof refetchProfile === "function") {
              try {
                await refetchProfile()
              } catch (err: any) {
                if (isMountedRef.current) {
                  console.log("Background profile refetch failed:", err?.message)
                }
              }
            }

            // Small delay between requests
            await new Promise((resolve) => setTimeout(resolve, 100))
            if (isCancelled || !isMountedRef.current) return

            // Refetch products with error handling
            if (!isCancelled && isMountedRef.current && typeof refetchProducts === "function") {
              try {
                await refetchProducts()
              } catch (err: any) {
                if (isMountedRef.current) {
                  console.log("Background products refetch failed:", err?.message)
                }
              }
            }

            // Small delay between requests
            await new Promise((resolve) => setTimeout(resolve, 100))
            if (isCancelled || !isMountedRef.current) return

            // Refetch store status with error handling
            if (!isCancelled && isMountedRef.current && typeof storeRefetch === "function") {
              try {
                await storeRefetch()
              } catch (err: any) {
                if (isMountedRef.current) {
                  console.log("Background store status refetch failed:", err?.message)
                }
              }
            }
          } catch (error) {
            if (isMountedRef.current) {
              console.log("Silent background refetch error:", error)
            }
          } finally {
            if (isMountedRef.current) {
              isRefetchingRef.current = false
            }
          }
        }, 500)
      }

      // Start the refetch
      silentRefetch()

      // Cleanup function
      return () => {
        isCancelled = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [refetchProfile, refetchProducts, storeRefetch])
  )

  // Pull to refresh manually by user
  const refetchByUser = useCallback(async () => {
    if (!isMountedRef.current || isRefetchingRef.current) {
      return
    }

    isRefetchingRef.current = true
    
    if (isMountedRef.current) {
      setIsRefetchingByUser(true)
    }

    try {
      const promises = []
      
      if (isMountedRef.current && typeof refetchProfile === "function") {
        promises.push(
          refetchProfile().catch((err) => {
            console.log("Manual profile refetch failed:", err?.message)
          })
        )
      }
      
      if (isMountedRef.current && typeof refetchProducts === "function") {
        promises.push(
          refetchProducts().catch((err) => {
            console.log("Manual products refetch failed:", err?.message)
          })
        )
      }
      
      if (isMountedRef.current && typeof storeRefetch === "function") {
        promises.push(
          storeRefetch().catch((err) => {
            console.log("Manual store refetch failed:", err?.message)
          })
        )
      }

      // Also refresh filters
      if (isMountedRef.current && typeof refreshFilters === "function") {
        promises.push(
          refreshFilters().catch((err) => {
            console.log("Manual filters refresh failed:", err?.message)
          })
        )
      }

      await Promise.allSettled(promises)
    } catch (error) {
      if (isMountedRef.current) {
        console.error("Error refreshing data:", error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefetchingByUser(false)
      }
      isRefetchingRef.current = false
    }
  }, [refetchProfile, refetchProducts, storeRefetch, refreshFilters])

  // Filter and sort products with all filters applied
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      return []
    }

    let filtered = [...allProducts]

    // 1. Apply search query first
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((product: any) => {
        if (!product) return false
        try {
          return (
            product.title?.toLowerCase().includes(query) ||
            product.category?.toLowerCase().includes(query) ||
            product.condition?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query) ||
            product.brand?.toLowerCase().includes(query) ||
            product.store?.name?.toLowerCase().includes(query) ||
            product.store?.store_name?.toLowerCase().includes(query)
          )
        } catch (err) {
          console.error("Error filtering product:", err)
          return false
        }
      })
    } 
    // 2. Apply category filter if no search query
    else if (activeCategoryId) {
      const selectedCategory = shopCategory.find((cat) => cat.id === activeCategoryId)
      if (selectedCategory && selectedCategory.name.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (product: any) =>
            product?.category?.toLowerCase() === selectedCategory.name.toLowerCase()
        )
      }
    }

    // 3. Apply saved filters from filter settings
    if (hasActiveFilters && !isLoadingFilters) {
      try {
        // Filter by condition
        if (filterSettings.selectedConditions.length > 0) {
          filtered = filtered.filter((product: any) =>
            filterSettings.selectedConditions.some(
              (condition) => product?.condition?.toLowerCase() === condition.toLowerCase()
            )
          )
        }

        // Filter by brand
        if (filterSettings.selectedBrands.length > 0) {
          filtered = filtered.filter((product: any) =>
            filterSettings.selectedBrands.some(
              (brand) => product?.brand?.toLowerCase() === brand.toLowerCase()
            )
          )
        }

        // Filter by state
        if (filterSettings.selectedStates.length > 0) {
          filtered = filtered.filter((product: any) =>
            filterSettings.selectedStates.some(
              (state) => product?.store?.state?.toLowerCase() === state.toLowerCase()
            )
          )
        }

        // Filter by category (from filter settings, combined with category tabs)
        if (filterSettings.selectedCategories.length > 0) {
          filtered = filtered.filter((product: any) =>
            filterSettings.selectedCategories.some(
              (category) => product?.category?.toLowerCase() === category.toLowerCase()
            )
          )
        }

        // Filter by price range
        const minPrice = parseFloat(filterSettings.minPrice.replace(/,/g, '')) || 0
        const maxPrice = parseFloat(filterSettings.maxPrice.replace(/,/g, '')) || Infinity
        
        filtered = filtered.filter((product: any) => {
          const itemPrice = parseFloat(
            (product?.discounted_price || product?.original_price || 0)
              .toString()
              .replace(/,/g, '')
          ) || 0
          return itemPrice >= minPrice && itemPrice <= maxPrice
        })

        // Filter by verified sellers only
        if (filterSettings.filters.verifiedSellersOnly) {
          filtered = filtered.filter((product: any) => 
            product?.store?.is_verified === true
          )
        }

        // Filter by pickup only
        if (filterSettings.filters.pickupOnly) {
          filtered = filtered.filter((product: any) => 
            product?.pickup_available === true
          )
        }

        // Filter by delivery only
        if (filterSettings.filters.deliveryOnly) {
          filtered = filtered.filter((product: any) => 
            product?.delivery_available === true
          )
        }

        // Note: sellers near me would require location implementation
        if (filterSettings.filters.sellersNearMe) {
          console.log('Sellers near me filter active - requires location implementation')
        }
      } catch (error) {
        console.error('Error applying filters:', error)
      }
    }

    // 4. Sort: in-stock first, then by relevance
    filtered.sort((a: any, b: any) => {
      const aInStock = (a?.stock_available ?? 0) > 0
      const bInStock = (b?.stock_available ?? 0) > 0

      if (aInStock && !bInStock) return -1
      if (!aInStock && bInStock) return 1
      
      // If both in stock or both out of stock, maintain order
      return 0
    })

    return filtered
  }, [
    allProducts, 
    searchQuery, 
    activeCategoryId, 
    hasActiveFilters, 
    filterSettings, 
    isLoadingFilters
  ])

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
    searchInputRef.current?.focus()
  }, [])

  const handleCategoryPress = useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId)
  }, [])

  const handleViewStatus = useCallback((id: string) => {
    if (id && isMountedRef.current) {
      router.push(`/user_status_view/${id}` as any)
    }
  }, [])

  const MemoizedFixedHeader = useMemo(
    () => (
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          {isLoading ? (
            <View className="pt-4">
              <ActivityIndicator size={"small"} color={"gray"} />
            </View>
          ) : (
            <View className="flex-row gap-4 items-center">
              <Pressable
                onPress={() => router.push("/profile")}
                className="flex w-12 h-12 rounded-full bg-gray-100 justify-center items-center overflow-hidden"
              >
                {profile?.data?.profile_picture == null ? (
                  <MaterialIcons name="person-2" size={30} color={"gray"} />
                ) : (
                  <Image
                    source={{ uri: profile.data.profile_picture ?? "" }}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                )}
              </Pressable>
              <Pressable onPress={() => router.push("/profile")}>
                  {profile?.data?.address && profile.data.address.length > 15 ? (
                    <View>
                      <Text
                        style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                        className="text-base"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {profile.data.address.slice(0, 15)}...
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text
                        style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                        className="text-base"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {profile?.data?.address || "No Location"}
                      </Text>
                    </View>
                  )}
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-sm text-neutral-500"
                >
                  @{profile?.data?.username || "username"}
                </Text>
              </Pressable>
            </View>
          )}
          <View className="flex-row gap-2 items-center">
            <Pressable
              onPress={() => router.push("/(access)/(user_stacks)/notification")}
              className="bg-neutral-100 w-fit relative flex justify-center items-center rounded-full p-2"
            >
              <Ionicons name="notifications-outline" color={"#0F0F0F"} size={20} />
              <View className="absolute top-[-4px] right-[-2px]">
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-xs text-red-600"
                >
                  <MaterialIcons name="circle" size={8} />
                </Text>
              </View>
            </Pressable>
            <Pressable
              className="bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2"
              onPress={() => router.push("/(access)/(user_stacks)/saved-product")}
            >
              <MaterialIcons name="favorite-outline" color={"#0F0F0F"} size={20} />
              <View className="absolute top-[-8px] right-[-2px] bg-red-100 border-2 border-white justify-center items-center rounded-full p-1.5 py-0.5">
                {favoritesUpdating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-[10px] text-red-600"
                  >
                    {favoritesLength || 0}
                  </Text>
                )}
              </View>
            </Pressable>
            <Pressable
              className="bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2"
              onPress={() => router.push("/(access)/(user_stacks)/cart")}
            >
              <Ionicons name="cart-outline" color={"#0F0F0F"} size={20} />
              <View className="absolute top-[-8px] right-[-2px] bg-red-100 border-2 border-white justify-center items-center rounded-full p-1.5 py-0.5">
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-[10px] text-red-600"
                  >
                    {cartLength || 0}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [profile, isLoading, cartLength, isUpdating, favoritesLength, favoritesUpdating]
  )

  const MemoizedSearchHeader = useMemo(
    () => (
      <View className="px-6 pt-3 pb-3 bg-white">
        <View className="flex-row items-center gap-2 justify-between">
          <View className="bg-[#F6F6F6] px-4 rounded-full w-[85%] relative">
            <TextInput
              ref={searchInputRef}
              placeholder="Search for products, stores..."
              placeholderTextColor={"gray"}
              style={styles.inputStyle}
              className="text-base"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <View className="absolute right-7 top-4 justify-center items-center flex-row gap-2">
              {searchQuery.length > 0 && (
                <Pressable onPress={clearSearch} className="items-center justify-center w-10">
                  <Ionicons name="close-circle" size={25} color={"gray"} />
                </Pressable>
              )}
              <Ionicons name="search" size={20} color={"gray"} />
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/(access)/(user_stacks)/filterOptions")}
            className="bg-[#F6F6F6] justify-center items-center flex-col rounded-full p-3.5 relative"
          >
            <Ionicons name="filter" size={20} color={"gray"} />
            {hasActiveFilters && (
              <View className="absolute top-1 right-1 bg-orange-500 rounded-full w-2 h-2" />
            )}
          </Pressable>
        </View>
        {searchQuery.length > 0 && (
          <View className="pt-3 pb-2">
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-sm text-neutral-600"
            >
              {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "
              {searchQuery}"
            </Text>
          </View>
        )}
        {hasActiveFilters && searchQuery.length === 0 && (
          <View className="pt-3">
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-sm text-green-700"
            >
              Filters active • {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    ),
    [searchQuery, filteredProducts.length, hasActiveFilters, handleSearchChange, clearSearch]
  )

  const ContentHeader = useCallback(() => {
    if (searchQuery.length > 0) return null

    const storeData = Array.isArray(storeStatusData?.data?.results)
      ? storeStatusData.data.results
      : Array.isArray(storeStatusData?.data)
      ? storeStatusData.data
      : []

    const storesWithStatus = storeData.filter((item: any) => Array.isArray(item?.statuses) && item?.statuses.length > 0)

    return (
      <View className="px-6 bg-white">
        <View className="pt-1">
          {storeStatusLoading ? (
            <View className="flex-row items-center justify-center py-4">
              <ActivityIndicator size="small" color="#F75F15" />
              <Text
                className="ml-2 text-neutral-500"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                Loading stores...
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={storesWithStatus}
                keyExtractor={(item, index) =>
                  `status-${item?.id ?? item?.name ?? index}-${index}`
                }
                renderItem={({ item, index }) => {
                  const statusCount = Array.isArray(item?.statuses) ? item.statuses.length : 0
                  return (
                    <Pressable
                      onPress={() => item?.statuses?.[0]?.store && handleViewStatus(item.statuses[0].store)}
                      className="mr-3 items-center"
                    >
                      <View className="relative">
                        <View
                          className="w-20 h-20 rounded-full overflow-hidden justify-center items-center flex"
                          style={{
                            borderWidth: statusCount > 0 ? 2 : 0,
                            borderColor: statusCount > 0 ? "#34A853" : "gray",
                            borderStyle: "dotted",
                          }}
                        >
                          {item?.store_image ? (
                            <Image
                              source={{ uri: item.store_image ?? "" }}
                              className="rounded-full w-full h-full"
                              style={{
                                width: statusCount > 0 ? "90%" : "100%",
                                height: statusCount > 0 ? "90%" : "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <View className="w-full h-full bg-gray-200 rounded-full justify-center items-center">
                              <MaterialIcons name="store" size={30} color="gray" />
                            </View>
                          )}
                        </View>
                        {statusCount > 0 && (
                          <View className="absolute top-1 -right-0 rounded-full bg-white p-0.5 justify-center items-center">
                            <MaterialIcons name="circle" color={"#F75F15"} size={7} />
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-xs pt-2 text-neutral-600 text-center"
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item?.name ?? "Unknown Store"}
                      </Text>
                    </Pressable>
                  )
                }}
                ListEmptyComponent={() => (
                  <View className="justify-center m-auto w-full">
                    <View className="py-3 flex-row items-center gap-3">
                      <MaterialIcons name="info" size={20} color="gray" />
                      <Text
                        className="text-neutral-600 text-sm"
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                      >
                        No status available
                      </Text>
                    </View>
                  </View>
                )}
                initialNumToRender={5}
                windowSize={5}
                maxToRenderPerBatch={5}
                updateCellsBatchingPeriod={30}
              />
            </>
          )}
        </View>
        <View className="pt-5 pb-5">
          <FlatList
            ref={categoryFlatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={shopCategory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const AnimationWrapper = !hasInitiallyLoaded ? Animated.View : View
              const animationProps = !hasInitiallyLoaded
                ? { entering: FadeInDown.duration(500).delay(200).springify() }
                : {}
              return (
                <AnimationWrapper {...animationProps}>
                  <Pressable
                    onPress={() => handleCategoryPress(item.id)}
                    className={`mr-2.5 border p-2 px-4 rounded-full ${
                      activeCategoryId === item.id ? "border-orange-400 bg-orange-50" : "border-neutral-300"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        activeCategoryId === item.id ? "text-orange-600" : "text-neutral-700"
                      }`}
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {formatCategoryName(item?.name ?? "")}
                    </Text>
                  </Pressable>
                </AnimationWrapper>
              )
            }}
            initialNumToRender={5}
            windowSize={5}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={30}
          />
        </View>
      </View>
    )
  }, [
    searchQuery,
    activeCategoryId,
    hasInitiallyLoaded,
    storeStatusData,
    storeStatusLoading,
    formatCategoryName,
    handleViewStatus,
    handleCategoryPress,
  ])

  const renderProduct = useCallback(
    ({ item }: { item: any }) => {
      if (!item || !item.id) return null
      return (
        <Products
          id={String(item.id)}
          title={item.title ?? ""}
          original_price={item.original_price ?? 0}
          product_images={Array.isArray(item.product_images) ? item.product_images : []}
          description={item.description ?? ""}
          discounted_price={item.discounted_price ?? 0}
          stock_available={item.stock_available ?? 0}
          store={item.store ?? null}
        />
      )
    },
    []
  )

  const EmptyComponent = useCallback(
    () => (
      <View className="h-[30vh] w-full items-center justify-center px-6">
        <MaterialIcons name="search-off" size={48} color="#d1d5db" />
        <Text
          style={{
            fontFamily: "HankenGrotesk_600SemiBold",
          }}
          className="text-lg text-gray-700 mt-4 text-center"
        >
          {searchQuery.length > 0 
            ? "No products found" 
            : hasActiveFilters 
            ? "No products match your filters"
            : "No products available"
          }
        </Text>
        <Text
          style={{
            fontFamily: "HankenGrotesk_500Medium",
          }}
          className="text-sm text-gray-500 mt-2 text-center"
        >
          {searchQuery.length > 0 
            ? `Try searching for something else`
            : hasActiveFilters
            ? "Try adjusting your filters"
            : "Check back later for new products"
          }
        </Text>
        {(searchQuery.length > 0 || hasActiveFilters) && (
          <Pressable 
            onPress={searchQuery.length > 0 ? clearSearch : () => router.push("/(access)/(user_stacks)/filterOptions")} 
            className="mt-4"
          >
            <Text
              style={{
                fontFamily: "HankenGrotesk_500Medium",
              }}
              className="text-sm text-green-700 bg-orange-50 p-2.5 px-5 rounded-full"
            >
              {searchQuery.length > 0 ? "Clear search" : "Adjust filters"}
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [searchQuery, hasActiveFilters, clearSearch]
  )

  return (
    <SafeAreaView className="flex-1 flex w-full bg-white">
      <StatusBar style="dark" />
      {MemoizedFixedHeader}
      {MemoizedSearchHeader}
      {productLoading && !hasInitiallyLoaded ? (
        <AllProductSkeleton2 />
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              colors={["#F75F15"]}
              tintColor={"#F75F15"}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
          }}
          data={filteredProducts}
          keyExtractor={(item, index) => `product-${item?.id ?? index}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", gap: 10, paddingHorizontal: 18 }}
          ListHeaderComponent={ContentHeader}
          renderItem={renderProduct}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={EmptyComponent}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "HankenGrotesk_400Regular",
    width: "100%",
  },
})