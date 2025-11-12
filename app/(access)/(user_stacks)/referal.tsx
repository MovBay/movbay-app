import { View, Text, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useState, useMemo } from 'react'
import { useProfile } from "@/hooks/mutations/auth"
import { useGetReferralsDetails } from "@/hooks/mutations/sellerAuth"
import LoadingOverlay from "@/components/LoadingOverlay"

const Referral = () => {
    const [copied, setCopied] = useState(false)
    const {profile, isLoading} = useProfile()
    const {getReferrals, isLoading: referralLoading} = useGetReferralsDetails()
    const myReferralsData = getReferrals?.data?.data
    console.log('This is referral data', myReferralsData)
    const referralLink = profile?.data?.referral_code

    // Calculate total people referred and total earned
    const referralStats = useMemo(() => {
      if (!myReferralsData || !Array.isArray(myReferralsData)) {
        return { peopleReferred: 0, totalEarned: 0 }
      }

      const peopleReferred = myReferralsData.length
      const totalEarned = myReferralsData.reduce((sum, referral) => {
        return sum + (referral.bonus || 0)
      }, 0)

      return { peopleReferred, totalEarned }
    }, [myReferralsData])

    const handleCopyLink = async () => {
      await Clipboard.setStringAsync(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={referralLoading || isLoading}/>

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
                Referrals
              </Text>
            </View>

            <View className="space-y-6">
              {/* Invite & Earn Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-2 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Invite & Earn
                </Text>
                <Text className="text-base text-neutral-600 leading-6 mb-4" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  Share MovBay with your friends and earn wallet rewards!
                </Text>

                {/* Referral Link Box */}
                <View className="bg-gray-50 rounded-lg p-4 mb-3">
                  <View className="flex-row items-center m-auto justify-center">
                    <Ionicons name="link-outline" size={20} color="#666" />
                    <Text className="ml-2 text-neutral-600" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      {referralLink}
                    </Text>
                  </View>
                </View>

                {/* Copy Link Button */}
                <TouchableOpacity 
                  className="bg-orange-50 rounded-lg py-3 flex-row items-center justify-center"
                  onPress={handleCopyLink}
                >
                  <Ionicons name="copy-outline" size={20} color="#EA580C" />
                  <Text className="ml-2 text-orange-600 font-medium" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                    {copied ? 'Copied!' : 'Copy link'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Your Referral Stats Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Your Referral Stats
                </Text>
                
                <View className="flex-col gap-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base text-neutral-600" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      People Referred
                    </Text>
                    <Text className="text-base text-neutral-800 font-medium" style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                      {referralStats.peopleReferred}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center pb-3 pt-2 border-b border-gray-100">
                    <Text className="text-base font-semibold text-neutral-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                      Total Earned
                    </Text>
                    <Text className="text-lg font-bold text-neutral-800" style={{fontFamily: 'HankenGrotesk_700Bold'}}>
                      ₦{referralStats.totalEarned.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* How It Works Section */}
              <View>
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-5" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  How It Works
                </Text>
                
                <View className="flex-col gap-3">
                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      1.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      Invite your friends using your code.
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      2.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      They sign up and use MovBay for the first time.
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      3.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      You both get wallet rewards once they complete an order or delivery.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Referral Rules & Terms Section */}
              <View className="mb-6 pt-2 mt-5 border-t border-gray-100">
                <Text className="text-lg font-semibold text-neutral-800 mb-3 mt-2" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  Referral Rules & Terms
                </Text>
                
                <View className="flex-col gap-3">
                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      1.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      You earn ₦1,000 per successful referral.
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      2.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      Referrals are only valid for new users.
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      3.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      Bonuses are credited once your referral completes their first transaction.
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-base text-neutral-600 mr-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      4.
                    </Text>
                    <Text className="text-base text-neutral-600 flex-1" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                      Abuse of the referral program may result in account suspension.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  )
}

export default Referral