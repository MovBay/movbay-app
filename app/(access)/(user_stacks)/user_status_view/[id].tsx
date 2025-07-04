import { View, Text, Image, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { TextInput } from "react-native-gesture-handler"
import { StyleSheet } from "react-native"
import { useGetSingleStatus } from "@/hooks/mutations/sellerAuth"
import { useLocalSearchParams } from "expo-router"



const UserStatusView = () => {
    const { id } = useLocalSearchParams<{ id: string }>()
    const {singleStatusData, isLoading} = useGetSingleStatus(id)

    console.log('This is status data', singleStatusData?.data)
    console.log('This is status data', id)
    
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
      >
        {/* Progress indicators */}
        <View className="flex-row items-center pt-5 gap-2 px-5">
          <View className="w-14 h-1.5 bg-black rounded-full"></View>
          <View className="w-14 h-1.5 bg-black rounded-full"></View>
          <View className="w-14 h-1.5 bg-neutral-300 rounded-full"></View>
          <View className="w-14 h-1.5 bg-neutral-300 rounded-full"></View>
          <View className="w-14 h-1.5 bg-neutral-300 rounded-full"></View>
          <View className="w-14 h-1.5 bg-neutral-300 rounded-full"></View>
        </View>

        {/* Header with profile and follow button */}
        <View className="flex-row justify-between items-center px-5 mt-5 mb-4">
          <View className="flex-row items-center gap-2">
            <View className="relative">
              <View className="flex w-[45px] h-[45px] rounded-full bg-gray-100 justify-center items-center overflow-hidden">
                <Image
                  source={require("../../../../assets/images/profile.png")}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </View>
              <View className="absolute rounded-full right-0 bg-white top-0">
                <MaterialIcons name="verified" color={"#4285F4"} size={15} />
              </View>
            </View>
            <View>
              <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                KBK Shoes
              </Text>
            </View>
          </View>
          <View>
            <SolidLightButton text="Follow" />
          </View>
        </View>

        {/* Main content area - image and description filling the screen */}
        <View className="flex-1 px-5">
          <View className="flex-1 mb-4">
            <Image source={require("../../../../assets/images/big.png")} style={styles.fullImage} resizeMode="cover" />
          </View>
          <View className="flex-row justify-between ">
            <View className="w-[48%]">
              <SolidMainButton text="Buy Now" />
            </View>
            <View className="w-[48%]">
              <SolidLightButton text="Add to Cart" />
            </View>
          </View>

          {/* Description overlay or below image */}
          <View className="py-5">
            <Text className="text-black text-base text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Step up your style with these vibrant, multi-color sneakers – where comfort meets bold design. Perfect for
              everyday wear and standout moments.
            </Text>
          </View>
        </View>
        {/* Fixed bottom input area */}
        <View className="pb-5 pt-5 flex-row justify-between items-center border-t border-gray-100 px-5 bg-white">
            <View className="w-[83%]">
            <TextInput
                placeholder="Send a Message"
                placeholderTextColor={"gray"}
                style={styles.inputStyle}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
            />
            </View>
            <TouchableOpacity className="w-[13%] bg-[#F75F15] rounded-full flex-row justify-center items-center py-3.5">
            <MaterialIcons name="send" size={20} color={"white"} />
            </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

    </SafeAreaView>
  )
}

export default UserStatusView

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    width: "100%",
    backgroundColor: "#F6F6F6",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
})
