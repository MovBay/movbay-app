import { View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { MaterialIcons } from "@expo/vector-icons"

import type { ComponentProps } from "react";

const FAQAndSupport = () => {
  type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
  const menuItems: {
    icon: MaterialIconName;
    title: string;
    subtitle: string;
    onPress: () => void;
  }[] = [
    {
      icon: "question-mark",
      title: "FAQs",
      subtitle: "Answers to common questions",
      onPress: () => {
        router.push('/(access)/(rider_stacks)/ridersFAQs')
      }
    },
    {
      icon: "support-agent",
      title: "Contact Support",
      subtitle: "Reach out for help or feedback",
      onPress: () => {
        console.log("Navigate to Contact Support")
      }
    },
    {
      icon: "more-horiz",
      title: "Terms and Condition & Privacy Policy",
      subtitle: "Read terms and conditions & Privacy Policy",
      onPress: () => {
        router.push('/(access)/(user_stacks)/termsAndConsdition')
      }
    },
    {
      icon: "person-2",
      title: "About MovBay",
      subtitle: "Get to know about movbay",
      onPress: () => {
        router.push('/(access)/(user_stacks)/about')
      }
    }
  ]

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
            <View className="flex-row items-center gap-2 mb-3">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl font-semibold text-gray-800 ml-4" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                FAQ and Support
              </Text>
            </View>

            <View className="pt-4">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  className="flex-row items-center py-4 border-b border-gray-100"
                >
                  <View className="w-12 h-12 rounded-full bg-neutral-100 items-center justify-center mr-4">
                    <MaterialIcons name={item.icon} size={20}/>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800 mb-1" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      {item.subtitle}
                    </Text>
                  </View>
                  
                  <MaterialIcons name="chevron-right" size={15}/>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default FAQAndSupport