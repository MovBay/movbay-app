import { View, ActivityIndicator, Text } from 'react-native'

interface LoadingFooterProps {
  isLoading: boolean
  hasMore: boolean
}

export const LoadingFooter = ({ isLoading, hasMore }: LoadingFooterProps) => {
  if (!isLoading && !hasMore) {
    return (
      <View className="py-4 items-center">
        <Text 
          className="text-gray-500 text-sm"
          style={{ fontFamily: "HankenGrotesk_500Medium" }}
        >
          No more products to load
        </Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#F75F15" />
        <Text 
          className="text-gray-500 text-sm mt-2"
          style={{ fontFamily: "HankenGrotesk_500Medium" }}
        >
          Loading more products...
        </Text>
      </View>
    )
  }

  return null
}
