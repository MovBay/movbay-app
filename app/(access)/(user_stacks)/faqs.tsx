import { View, Text, TouchableOpacity } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { MaterialIcons } from "@expo/vector-icons"

const FAQQuestions = () => {
  const [expandedIndex, setExpandedIndex] = useState(null)

  const faqData = [
    {
      question: "What problem does MovBay try to solve?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce magna orci suscipit orci cursus ullamcorper urna tempus quam. Phasellus cursus tristique ut efficitur. Suspendisse nisl. Elementum ni erat dictum faucibus sapien suscipit nec leo."
    },
    {
      question: "What Solution does MovBay bring?",
      answer: "MovBay provides innovative transportation solutions that connect riders with drivers efficiently and safely."
    },
    {
      question: "What is MovBay Mission?",
      answer: "Our mission is to revolutionize urban transportation by making it more accessible, affordable, and sustainable for everyone."
    },
    {
      question: "What is MovBay Vision?",
      answer: "To create a world where transportation is seamless, efficient, and accessible to all communities."
    },
    {
      question: "What is MovBay?",
      answer: "MovBay is a comprehensive ride-sharing platform that connects passengers with professional drivers for safe and reliable transportation."
    }
  ]

  const toggleExpanded = (index:any) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

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
              {faqData.map((item, index) => (
                <View key={index} className="mb-4">
                  <TouchableOpacity
                    onPress={() => toggleExpanded(index)}
                    className="flex-row items-center justify-between py-4 border-b border-gray-100"
                  >
                    <Text className="text-base font-medium text-gray-800 flex-1 pr-4" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                      {item.question}
                    </Text>
                    <MaterialIcons name="chevron-right" size={15}/>
                  </TouchableOpacity>
                  
                  {expandedIndex === index && (
                    <View className="px-4 py-3 bg-gray-50 rounded-lg mt-2">
                      <Text className="text-base text-gray-600 leading-8" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                        {item.answer}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default FAQQuestions