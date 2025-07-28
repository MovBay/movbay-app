import { View, Text } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"

const RidersAboutMovBay = () => {
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
                About MovBay
              </Text>
            </View>

            <View className="space-y-6">
              {/* Problem Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Problem
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Transportation in Nigeria and Africa faces several challenges, including high costs, inefficiencies, and lack of comfort. Traditional vehicles contribute to pollution, and public transportation options often fail to provide a reliable or premium experience for users. These issues create a demand for more affordable, eco-friendly, and comfortable transportation solutions.
                </Text>
              </View>

              {/* Solution Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Solution
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Ethive addresses these problems by promoting electric vehicles (Evs), offering a service that combines affordability and luxury and makes sustainable transportation accessible. This helps lower transportation costs, improve efficiency, and deliver a premium experience, all while reducing the environmental impact of traditional fuel-based vehicles.
                </Text>
              </View>

              {/* What Ethive is About Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  What Ethive is About
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Ethive is a brand focused on transforming transportation through innovation by promoting the use of electric vehicles (Evs). Their mission is to make transportation affordable, comfortable, and luxurious, while addressing the environmental challenges posed by traditional fuel-based vehicles. By integrating high-tech solutions with a focus on sustainability, Ethive aims to provide a premium yet cost-effective experience for users, which in the process facilitates an eco-friendly initiative.
                </Text>
              </View>

              {/* Mission Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Mission
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Ethive's mission is to use electric vehicles to solve transportation problems in Nigeria and Africa, making transport more affordable, comfortable, and luxurious.
                </Text>
              </View>

              {/* Vision Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Vision
                </Text>
                <Text className="text-base text-neutral-600 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  The vision of Ethive is to promote electric vehicles as a way to make transportation accessible and luxurious throughout Africa.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default RidersAboutMovBay