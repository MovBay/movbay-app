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

export default function HomeScreen() {
  const { profile, isLoading, refetch: refetchProfile } = useProfile()
  const {
    productData,
    isLoading: productLoading,
    refetch: refetchProducts,
  } = useGetProductsOriginal()
  const { storeStatusData, isLoading: storeStatusLoading, refetch: storeRefetch } = useGetStoreStatus()

  console.log("Location", profile)


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

  const ItemSeparator = () => <View style={{ height: 15 }} />
  const insets = useSafeAreaInsets()

  const formatCategoryName = useCallback((name: string) => {
    return name.replace(/_/g, " ")
  }, [])

  // Silent background refetch when screen focused
  useFocusEffect(
    useCallback(() => {
      let timeoutId: NodeJS.Timeout
      let isCancelled = false

      const silentRefetch = async () => {
        if (isRefetchingRef.current || !isMountedRef.current) return

        timeoutId = setTimeout(async () => {
          if (isCancelled || !isMountedRef.current) return

          isRefetchingRef.current = true
          try {
            if (!isCancelled && typeof refetchProfile === "function") {
              try {
                await refetchProfile()
              } catch (err: any) {
                console.log("Background profile refetch failed (silent):", err?.message)
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 100))
            if (isCancelled) return

            if (!isCancelled && typeof refetchProducts === "function") {
              try {
                await refetchProducts()
              } catch (err: any) {
                console.log("Background products refetch failed (silent):", err?.message)
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 100))
            if (isCancelled) return

            if (!isCancelled && typeof storeRefetch === "function") {
              try {
                await storeRefetch()
              } catch (err: any) {
                console.log("Background store status refetch failed (silent):", err?.message)
              }
            }
          } catch (error) {
            console.log("Silent background refetch error:", error)
          } finally {
            if (!isCancelled) {
              isRefetchingRef.current = false
            }
          }
        }, 500)
      }

      silentRefetch()

      return () => {
        isCancelled = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        isRefetchingRef.current = false
      }
    }, [])
  )

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true

    const timer = setTimeout(() => {
      if (isMountedRef.current) setHasInitiallyLoaded(true)
    }, 100)

    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
    }
  }, [])

  // Pull to refresh manually by user
  async function refetchByUser() {
    if (!isMountedRef.current || isRefetchingRef.current) return

    isRefetchingRef.current = true
    setIsRefetchingByUser(true)

    try {
      const promises = []
      if (typeof refetchProfile === "function") promises.push(refetchProfile())
      if (typeof refetchProducts === "function") promises.push(refetchProducts())
      if (typeof storeRefetch === "function") promises.push(storeRefetch())

      await Promise.allSettled(promises)
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      if (isMountedRef.current) setIsRefetchingByUser(false)
      isRefetchingRef.current = false
    }
  }

  // Filter and sort products safely
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(allProducts)) return []

    let filtered = [...allProducts]

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((product: any) => {
        if (!product) return false
        return (
          product.title?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.condition?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.store?.name?.toLowerCase().includes(query) ||
          product.store?.store_name?.toLowerCase().includes(query)
        )
      })
    } else if (activeCategoryId) {
      const selectedCategory = shopCategory.find((cat) => cat.id === activeCategoryId)
      if (selectedCategory && selectedCategory.name.toLowerCase() !== "all") {
        filtered = filtered.filter(
          (product: any) =>
            product?.category?.toLowerCase() === selectedCategory.name.toLowerCase()
        )
      }
    }

    // Sort: in-stock first
    filtered.sort((a: any, b: any) => {
      const aInStock = (a?.stock_available ?? 0) > 0
      const bInStock = (b?.stock_available ?? 0) > 0

      if (aInStock && !bInStock) return -1
      if (!aInStock && bInStock) return 1
      return 0
    })

    return filtered
  }, [allProducts, searchQuery, activeCategoryId])

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

  const handleViewStatus = (id: string) => {
    if (id) {
      router.push(`/user_status_view/${id}` as any)
    }
  }

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
                  {profile?.data?.address.length > 15 ? (
                    <View>
                      <Text
                        style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                        className="text-base"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {profile?.data?.address.slice(0, 15) || "No Location"}...
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
          <View className="flex-row gap-3 items-center">
            <Pressable
              onPress={() => router.push("/(access)/(user_stacks)/notification")}
              className="bg-neutral-100 w-fit relative flex justify-center items-center rounded-full p-2.5"
            >
              <Ionicons name="notifications-outline" color={"#0F0F0F"} size={22} />
              <View className="absolute top-[-4px] right-[-2px]">
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-xs text-red-500"
                >
                  <MaterialIcons name="circle" size={10} />
                </Text>
              </View>
            </Pressable>
            <Pressable
              className="bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2.5"
              onPress={() => router.push("/(access)/(user_stacks)/saved-product")}
            >
              <MaterialIcons name="favorite-outline" color={"#0F0F0F"} size={22} />
              <View className="absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5">
                {favoritesUpdating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-xs text-red-500"
                  >
                    {favoritesLength || 0}
                  </Text>
                )}
              </View>
            </Pressable>
            <Pressable
              className="bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2.5"
              onPress={() => router.push("/(access)/(user_stacks)/cart")}
            >
              <Ionicons name="cart-outline" color={"#0F0F0F"} size={22} />
              <View className="absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5">
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-xs text-red-500"
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
            className="bg-[#F6F6F6] justify-center items-center flex-col rounded-full p-3.5"
          >
            <Ionicons name="filter" size={20} color={"gray"} />
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
      </View>
    ),
    [searchQuery, filteredProducts.length, handleSearchChange, clearSearch]
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
      <View className="h-[30vh] w-full items-center justify-center">
        <Text
          style={{
            fontFamily: "HankenGrotesk_500Medium",
          }}
          className="text-base text-gray-600"
        >
          {searchQuery.length > 0 ? `No results found for "${searchQuery}"` : "No item found"}
        </Text>
        {searchQuery.length > 0 && (
          <Pressable onPress={clearSearch} className="mt-2">
            <Text
              style={{
                fontFamily: "HankenGrotesk_500Medium",
              }}
              className="text-sm text-orange-600 bg-orange-50 p-2.5 px-5 rounded-full"
            >
              Clear search
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [searchQuery, clearSearch]
  )

  return (
    <SafeAreaView className="flex-1 flex w-full bg-white">
      <StatusBar style="dark" />
      {MemoizedFixedHeader}
      {MemoizedSearchHeader}
      {productLoading ? (
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    width: "100%",
  },
})
