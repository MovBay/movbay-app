"use client"

import { View, Text, Switch } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { Ionicons } from "@expo/vector-icons"
import { SolidMainButton } from "@/components/btns/CustomButtoms"

const DeliveryPreference = () => {
  // Set all fields to true by default, except night mode which is disabled
  const [autoAcceptNearby, setAutoAcceptNearby] = useState(true)
  const [nightModeAvailability, setNightModeAvailability] = useState(false)
  const [deliveryNotifications, setDeliveryNotifications] = useState(true)

  const handleSave = () => {
    // Handle save logic here
    console.log("Preferences saved:", {
      autoAcceptNearby,
      nightModeAvailability,
      deliveryNotifications,
    })
    router.back()
  }

  const PreferenceItem = ({ icon, title, value, onValueChange, disabled = false, subtitle = null }: any) => (
    <View className="flex-row items-center justify-between py-4 px-1">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
          <Ionicons name={icon} size={20} color={disabled ? "#9CA3AF" : "#374151"} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base ${disabled ? "text-gray-400" : "text-gray-800"}`}
            style={{ fontFamily: "HankenGrotesk_500Medium" }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-gray-400 mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        trackColor={{ false: "#E5E7EB", true: "#F75F15" }}
        thumbColor={value ? "#FFFFFF" : "#FFFFFF"}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      />
    </View>
  )

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
          showsVerticalScrollIndicator={false}
        >
          <View className="">
            <View className="pt-3 flex-row items-center ">
              <View className="flex-row items-center gap-2">
                <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              </View>
              <Text className="text-xl m-auto justify-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Delivery Preference
              </Text>
            </View>

            {/* Preference Options */}
            <View className="mt-8">
              <PreferenceItem
                icon="location-outline"
                title="Auto-accept nearby deliveries"
                value={autoAcceptNearby}
                onValueChange={setAutoAcceptNearby}
              />

              <View className="border-b border-gray-100" />

              <PreferenceItem
                icon="moon-outline"
                title="Night mode availability"
                subtitle="Feature not available yet"
                value={nightModeAvailability}
                onValueChange={setNightModeAvailability}
                disabled={true}
              />

              <View className="border-b border-gray-100" />

              <PreferenceItem
                icon="notifications-outline"
                title="Delivery notifications"
                value={deliveryNotifications}
                onValueChange={setDeliveryNotifications}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Save Button */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton text="Save Preferences" onPress={() => handleSave()} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DeliveryPreference
