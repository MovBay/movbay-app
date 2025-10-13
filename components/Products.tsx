import { View, Text, Image, Pressable } from "react-native"
import { memo } from "react"
import Animated, { FadeInDown } from "react-native-reanimated"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { router } from "expo-router"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorite-context"
import { useProfile } from "@/hooks/mutations/auth"
import { Toast } from "react-native-toast-notifications"
import { useGetStore } from "@/hooks/mutations/sellerAuth"

interface ProductsProps {
  id: string
  title: string
  original_price: number
  discounted_price: number
  description: string
  product_images: any[]
  store?: any
  stock_available?: number
}

const Products = memo(
  ({
    id,
    title,
    original_price,
    discounted_price,
    description,
    product_images,
    store,
    stock_available = 10,
  }: ProductsProps) => {
    const { addToCart, isItemAtStockLimit, getRemainingStock, getItemQuantity } = useCart()
    const { toggleFavorite, isItemInFavorites } = useFavorites()
    const { profile } = useProfile()

    const isOutOfStock = stock_available === 0
    const currentQuantity = getItemQuantity(id)
    const isAtStockLimit = isItemAtStockLimit(id, stock_available)
    const remainingStock = getRemainingStock(id, stock_available)
    const {storeData, refetch, isLoading} = useGetStore()
    
    
    // Check if current user is the owner of this product
    const isOwner = storeData?.data?.id === store?.id
    const handleViewProduct = (id: string) => {
      router.push(`/product/${id}` as any)
    }

    const handleAddToCart = async () => {
      // Don't allow owners to add their own products to cart
      if (isOwner) {
        Toast.show("You cannot add your own product to cart", { type: "warning" })
        return
      }

      // Check if product is out of stock
      if (isOutOfStock) {
        Toast.show("This product is currently out of stock", { type: "warning" })
        return
      }

      // Check if item is at stock limit
      if (isAtStockLimit) {
        Toast.show(`Only ${stock_available} ${stock_available === 1 ? 'item' : 'items'} available in stock`, { 
          type: "warning" 
        })
        return
      }

      try {
        const cartItem = {
          id,
          title,
          price: original_price,
          discounted_price,
          image: product_images[0]?.image_url || "",
          store: store || {},
          stock_available,
          isNewArrival: false,
        }
        
        const result = await addToCart(cartItem)
        
        if (result.success) {
          Toast.show(result.message, { type: "success" })
        } else {
          Toast.show(result.message, { type: "warning" })
        }
      } catch (error) {
        console.error("Error adding to cart:", error)
        Toast.show("Failed to add item to cart", {
          type: "error",
        })
      }
    }

    const handleToggleFavorite = async () => {
      try {
        const favoriteItem = {
          id,
          title,
          original_price,
          discounted_price,
          description,
          product_images,
        }
        await toggleFavorite(favoriteItem)

        const isCurrentlyFavorite = isItemInFavorites(id)
        Toast.show(`${title} has been ${isCurrentlyFavorite ? "removed from" : "added to"} your favorites`, {
          type: "success",
        })
      } catch (error) {
        console.error("Error toggling favorite:", error)
        Toast.show("Failed to update favorites", {
          type: "error",
        })
      }
    }

    const isInFavorites = isItemInFavorites(id)

    return (
      <View className="w-[50%] mb-4">
        <Pressable onPress={() => handleViewProduct(id)}>
          <Animated.View className="w-full relative" entering={FadeInDown.duration(200).delay(100).springify()}>
            <View className="w-full h-48 bg-slate-200 rounded-3xl relative">
              <Image
                source={{ uri: product_images[0]?.image_url }}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }}
              />
              
              {/* Stock Status Badge */}
              {isOutOfStock ? (
                <View className="absolute bottom-2 right-2 bg-[#F75F15] border-2 border-red-100 rounded-full px-3 py-1.5">
                  <Text className="text-white text-xs font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Out of Stock
                  </Text>
                </View>
              ) : (
                /* Cart Button */
                <Pressable
                  className={`absolute bottom-2 right-2 p-2.5 flex justify-center items-center rounded-full ${
                    isOwner || isAtStockLimit 
                      ? 'bg-gray-100 border-2 border-white shadow-sm' 
                      : 'bg-[#FEEEE6] border-2 border-white shadow-sm'
                  }`}
                  onPress={handleAddToCart}
                  disabled={isOwner || isAtStockLimit}
                >
                  <Ionicons 
                    name={isOwner ? "person" : "cart-outline"} 
                    size={20} 
                    color={isOwner || isAtStockLimit ? "#9CA3AF" : "#F75F15"} 
                  />
                </Pressable>
              )}

              {/* Stock limit reached badge */}
              {isAtStockLimit && !isOutOfStock && !isOwner && (
                <View className="absolute top-2 right-2 bg-[#F75F15] border-2 border-red-100 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Max in Cart
                  </Text>
                </View>
              )}

              {/* Low Stock Warning (only show if not at stock limit and not owner) */}
              {!isOutOfStock && !isAtStockLimit && !isOwner && remainingStock <= 5 && remainingStock > 0 && (
                <View className="absolute top-2 right-2 bg-[#FBBC05] border-2 border-gray-100 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-semibold" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    Only {remainingStock} left
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-blue-100 flex-row justify-center w-[80%] gap-2 items-center p-1.5 my-2 rounded-full">
              <MaterialIcons name="verified" size={15} color={"#4285F4"} />
              <Text className="text-[#4285F4] text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Verified Seller
              </Text>
            </View>
            
            <View>
              <View>
                {title.length > 35 ? (
                  <Text className={`text-sm ${isOutOfStock ? 'text-gray-500' : ''}`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {title.slice(0, 35)}...
                  </Text>
                ) : (
                  <Text className={`text-sm ${isOutOfStock ? 'text-gray-500' : ''}`} style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                    {title}
                  </Text>
                )}
                <View className="flex-row items-center gap-3">
                  <Text className={`text-sm pt-2 italic line-through text-neutral-500 ${isOutOfStock ? 'text-gray-500' : ''}`} style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                    ₦ {original_price.toLocaleString()}
                  </Text>
                  <Text
                    className={`text-base pt-2 ${isOutOfStock ? 'text-gray-400' : ''}`}
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  >
                    ₦ {discounted_price.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Favorite Button */}
            <Pressable
              className="absolute top-2 left-2 p-2.5 flex justify-center items-center rounded-full bg-[#FEEEE6] border-2 border-white shadow-sm"
              onPress={handleToggleFavorite}
            >
              <MaterialIcons name={isInFavorites ? "favorite" : "favorite-outline"} size={20} color={"#F75F15"} />
            </Pressable>
          </Animated.View>
        </Pressable>
      </View>
    )
  },
)

Products.displayName = "Products"

export default Products