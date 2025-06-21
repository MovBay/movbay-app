import { View, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"

const { width: screenWidth } = Dimensions.get("window")

// Skeleton shimmer component
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
  <View
    style={[
      {
        width,
        height,
        backgroundColor: "#E5E7EB",
        borderRadius: 8,
      },
      style,
    ]}
    className="animate-pulse"
  />
)

const ProductSkeleton = () => {
  return (
    <View className="bg-white flex-1">
      <KeyboardAwareScrollView className="">
        <View className="pb-10">
          {/* Hero Image Skeleton */}
          <View className="w-full h-[350px] relative bg-gray-200">
            <SkeletonBox width="100%" height={350} style={{ borderRadius: 0 }} />

            {/* Back button skeleton */}
            <View className="absolute top-4 left-5 bg-white p-3 rounded-full">
              <SkeletonBox width={25} height={25} />
            </View>

            {/* Question mark button skeleton */}
            <View className="absolute top-4 right-5 bg-white p-3 rounded-full">
              <SkeletonBox width={22} height={22} />
            </View>

            {/* Stock count skeleton */}
            <View className="bg-white rounded-full p-3 px-4 right-3 bottom-3 absolute">
              <SkeletonBox width={30} height={20} />
            </View>
          </View>

          <View className="px-5 pt-3">
            {/* Location and Verification Badge */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row gap-2 items-center">
                <SkeletonBox width={20} height={20} />
                <SkeletonBox width={120} height={16} />
              </View>

              <View className="bg-gray-100 flex-row justify-center gap-2 items-center p-1.5 px-2 my-2 rounded-full">
                <SkeletonBox width={15} height={15} style={{ borderRadius: 50 }} />
                <SkeletonBox width={80} height={14} />
              </View>
            </View>

            <View className="pt-2">
              {/* Product Title */}
              <SkeletonBox width="80%" height={24} style={{ marginBottom: 12 }} />

              {/* Price and Share Button */}
              <View className="flex-row justify-between pt-3 items-center">
                <View className="flex-row items-center gap-3">
                  <SkeletonBox width={100} height={28} />
                  <SkeletonBox width={80} height={24} />
                </View>

                <View className="bg-gray-100 p-3 rounded-full">
                  <SkeletonBox width={25} height={25} />
                </View>
              </View>

              {/* Rating Section */}
              <View className="flex-row gap-3 pt-2 border-b border-neutral-200 pb-3 items-center">
                <View className="flex-row gap-1">
                  {[...Array(4)].map((_, index) => (
                    <SkeletonBox key={index} width={20} height={20} />
                  ))}
                </View>
                <SkeletonBox width={50} height={16} />
              </View>

              {/* Image Gallery Skeleton */}
              <View className="py-4">
                <View className="flex-row flex-wrap gap-2">
                  {[...Array(6)].map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: (screenWidth - 50) / 3 - 5,
                        height: 100,
                        marginBottom: 8,
                      }}
                      className="overflow-hidden rounded-md bg-gray-100"
                    >
                      <SkeletonBox width="100%" height={100} style={{ borderRadius: 6 }} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}

export default ProductSkeleton
