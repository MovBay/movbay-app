import AllProductSkeleton2 from "@/components/AllProductSkeleton2"
import Products from "@/components/Products"
import { shopCategory, statusShopData } from "@/constants/datas"
import { useProfile } from "@/hooks/mutations/auth"
import { useCart } from "@/context/cart-context"
import { useGetProducts } from "@/hooks/mutations/sellerAuth"
import Ionicons from "@expo/vector-icons/Ionicons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useState, useMemo, useCallback, useRef } from "react"
import { ActivityIndicator, FlatList, RefreshControl } from "react-native"
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

export default function HomeScreen() {
  const { profile, isLoading, refetch: refetchProfile } = useProfile()
  const { productData, isLoading: productLoading, refetch: refetchProducts } = useGetProducts()
  const allProducts = productData?.data?.results

  const { cartLength, cartItems, isUpdating } = useCart()
  const [activeCategoryId, setActiveCategoryId] = useState(shopCategory[0]?.id)
  const [isRefetchingByUser, setIsRefetchingByUser] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const searchInputRef = useRef<TextInput>(null)

  const ItemSeparator = () => <View style={{ height: 15 }} />
  const insets = useSafeAreaInsets()

  async function refetchByUser() {
    setIsRefetchingByUser(true)

    try {
      await Promise.all([refetchProfile?.(), refetchProducts?.()])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefetchingByUser(false)
    }
  }

  const filteredProducts = useMemo(() => {
    if (!allProducts) return []

    let filtered = allProducts
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((product: any) => {
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
    }

    return filtered
  }, [allProducts, searchQuery])

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
    searchInputRef.current?.focus()
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
                {profile?.data?.profile_picture === null ? (
                  <MaterialIcons name="person-2" size={30} color={"gray"} />
                ) : (
                  <Image
                    source={{ uri: profile?.data?.profile_picture }}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                )}
              </Pressable>
              <View>
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-base">
                  Hi, {profile?.data?.fullname}
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-500">
                  @{profile?.data?.username}
                </Text>
              </View>
            </View>
          )}

          <View className="flex-row gap-3 items-center">
            <Pressable className="bg-neutral-100 w-fit relative flex justify-center items-center rounded-full p-2.5">
              <Ionicons name="notifications-outline" color={"#0F0F0F"} size={26} />
              <View className="absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-red-500">
                  0
                </Text>
              </View>
            </Pressable>

            <Pressable
              className="bg-neutral-100 w-fit flex justify-center relative items-center rounded-full p-2.5"
              onPress={() => router.push("/(access)/(user_stacks)/cart")}
            >
              <Ionicons name="cart-outline" color={"#0F0F0F"} size={26} />
              {/* Real-time cart length with loading indicator */}
              <View className="absolute top-[-4px] right-[-2px] bg-red-200 justify-center items-center rounded-full p-2 py-0.5">
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-red-500">
                    {cartLength}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [profile, isLoading, cartLength, isUpdating],
  ) // Added cart dependencies

  // Rest of your component remains the same...
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

          <Pressable className="bg-[#F6F6F6] justify-center items-center flex-col rounded-full p-3.5">
            <Ionicons name="filter" size={20} color={"gray"} />
          </Pressable>
        </View>

        {/* Search Results Info */}
        {searchQuery.length > 0 && (
          <View className="pt-3 pb-2">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-neutral-600">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "{searchQuery}"
            </Text>
          </View>
        )}
      </View>
    ),
    [searchQuery, handleSearchChange, clearSearch, filteredProducts],
  )

  // Content Header component for categories and status (only shown when not searching)
  const ContentHeader = useCallback(() => {
    if (searchQuery.length > 0) return null

    return (
      <View className="px-6 bg-white">
        {/* Status Shop Data - Horizontal FlatList */}
        <View className="pt-3">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={statusShopData}
            keyExtractor={(item, index) => `status-${item.name}-${index}`}
            renderItem={({ item }) => (
              <Animated.View className="mr-5" entering={FadeInDown.duration(500).springify()}>
                <View className="w-24 h-24 border border-dashed border-red-500 p-1.5 rounded-full justify-center items-center flex">
                  <Image source={item?.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </View>
                <Text className="text-sm pt-2 text-neutral-600" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  {item?.name.length > 11 ? `${item?.name.slice(0, 11)}...` : item?.name}
                </Text>
              </Animated.View>
            )}
            initialNumToRender={5}
            windowSize={5}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={30}
          />
        </View>

        {/* Shop Categories - Horizontal FlatList */}
        <View className="pt-5 pb-5">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={shopCategory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
                <Pressable
                  onPress={() => setActiveCategoryId(item.id)}
                  className={`mr-4 border p-3 px-6 rounded-full ${
                    activeCategoryId === item.id ? "border-orange-400 bg-orange-50" : "border-neutral-300"
                  }`}
                >
                  <Text
                    className={`text-base ${activeCategoryId === item.id ? "text-orange-600" : "text-neutral-700"}`}
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  >
                    {item?.name}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
            initialNumToRender={5}
            windowSize={5}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={30}
          />
        </View>
      </View>
    )
  }, [searchQuery, activeCategoryId])

  // Memoized render item to prevent unnecessary re-renders
  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <Products
        id={item.id.toString()}
        title={item.title}
        original_price={item.original_price}
        product_images={item.product_images}
        description={item.description}
        discounted_price={item.discounted_price}
      />
    ),
    [],
  )

  // Memoized empty component
  const EmptyComponent = useCallback(
    () => (
      <View className="h-[30vh] w-full items-center justify-center">
        <Text
          style={{
            fontFamily: "HankenGrotesk_500Medium",
          }}
          className="text-lg text-gray-800"
        >
          {searchQuery.length > 0 ? `No results found for "${searchQuery}"` : "No item found"}
        </Text>
        {searchQuery.length > 0 && (
          <Pressable onPress={clearSearch} className="mt-2">
            <Text
              style={{
                fontFamily: "HankenGrotesk_500Medium",
              }}
              className="text-base text-orange-600 bg-orange-50 p-2.5 px-5 rounded-full"
            >
              Clear search
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [searchQuery, clearSearch],
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
              colors={["#F75F15"]} // Android
              tintColor={"#F75F15"} // iOS
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
          }}
          data={filteredProducts}
          keyExtractor={(item) => `product-${item.id}`}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "center", gap: 16, paddingHorizontal: 24 }}
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
