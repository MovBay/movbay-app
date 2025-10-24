import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import LoadingOverlay from '@/components/LoadingOverlay'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { useProfile } from '@/hooks/mutations/auth'

// Address interface
export interface Address {
  id: string
  label: string
  fullAddress: string
  city: string
  state: string
  country: string
  isDefault: boolean
}


const AddressBook = () => {
  const {profile, isLoading} = useProfile()
  const address = profile?.data?.address as any


  const EmptyAddressComponent = () => (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="location-outline" size={32} color="#9CA3AF" />
      </View>
      <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
        No addresses added
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
        Add your frequently used addresses for quick access
      </Text>
      <TouchableOpacity 
        className="bg-[#F75F15] px-6 py-3 rounded-2xl"
        onPress={() => router.push('/(access)/(user_stacks)/profile-edit')}
      >
        <Text className="text-white font-semibold text-base" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          Add Address
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingOverlay visible={false} />

        {/* Header */}
        <View className="">
            <View className="px-5 pt-3 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
                <OnboardArrowTextHeader onPressBtn={() => router.back()} />
                <Text className="text-xl text-center m-auto font-semibold text-gray-900">Address Book</Text>
            </View>
            </View>
        </View>



        {/* Address List or Empty State */}
        {!address ? 
            <EmptyAddressComponent /> : 
            <TouchableOpacity 
            className="bg-gray-50 mx-4 mb-3 rounded-2xl p-4 mt-5 border border-gray-100"
            >
            <View className="flex-row items-start justify-between">
                <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                    <Ionicons name="location" size={18} color="#F75F15" />
                    </View>
                    <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                        {address}
                        </Text>
                    </View>
                    </View>
                </View>
                </View>
            </View>
            </TouchableOpacity>
        }
    </SafeAreaView>
  )
}

export default AddressBook