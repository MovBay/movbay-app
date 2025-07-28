import { View, Text } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"

const TermsAndCondition = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View className="">
            <View className="flex-row items-center gap-2 mb-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl font-semibold text-gray-800 ml-4" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                T & C and Privacy Policy
              </Text>
            </View>

            <View className="space-y-6">
              {/* Problem Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Terms and Condition
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                    Lorem ipsum dolor sit amet consectetur. Turpis enim sed pulvinar id bibendum. Quis mi penatibus cursus vulputate 
                    sapien pellentesque integer ligula at. Tincidunt aliquet molestie leo consequat egestas. In tempor duis nibh felis 
                    leo neque lorem proin massa. Dui purus molestie pellentesque id tortor pharetra dignissim pellentesque at. Platea 
                    nullam fermentum a praesent nec. Eu molestie massa tempor ut mauris luctus. Risus et nulla sit ridiculus pulvinar. 
                    Aenean sed sed et dictum est vitae. Consectetur parturient tellus proin viverra bibendum consectetur ut magna dictum. 
                    Adipiscing sagittis consequat imperdiet quis. Vestibulum elementum nec auctor suspendisse auctor. Leo porttitor auctor 
                    fames dignissim commodo sed consectetur.
                    Augue suspendisse lorem auctor sapien et sapien risus. Arcu ante auctor amet tempus in cum elementum. In suspendisse sit fermentum ut. 
                    Vitae sit nec justo faucibus sodales diam enim nisi. Nibh mauris vitae sit sodales. Odio sapien luctus in aliquet malesuada id. Elementum 
                    nullam malesuada elit bibendum quam aliquet ornare. Fermentum tempus pellentesque vel rhoncus lacus libero.
                </Text>
              </View>

               <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Privacy Policy
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                    Lorem ipsum dolor sit amet consectetur. Turpis enim sed pulvinar id bibendum. Quis mi penatibus cursus vulputate 
                    sapien pellentesque integer ligula at. Tincidunt aliquet molestie leo consequat egestas. In tempor duis nibh felis 
                    leo neque lorem proin massa. Dui purus molestie pellentesque id tortor pharetra dignissim pellentesque at. Platea 
                    nullam fermentum a praesent nec. Eu molestie massa tempor ut mauris luctus. Risus et nulla sit ridiculus pulvinar. 
                    Aenean sed sed et dictum est vitae. Consectetur parturient tellus proin viverra bibendum consectetur ut magna dictum. 
                    Adipiscing sagittis consequat imperdiet quis. Vestibulum elementum nec auctor suspendisse auctor. Leo porttitor auctor 
                    fames dignissim commodo sed consectetur.
                    Augue suspendisse lorem auctor sapien et sapien risus. Arcu ante auctor amet tempus in cum elementum. In suspendisse sit fermentum ut. 
                    Vitae sit nec justo faucibus sodales diam enim nisi. Nibh mauris vitae sit sodales. Odio sapien luctus in aliquet malesuada id. Elementum 
                    nullam malesuada elit bibendum quam aliquet ornare. Fermentum tempus pellentesque vel rhoncus lacus libero.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default TermsAndCondition