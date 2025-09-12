import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router, useLocalSearchParams } from 'expo-router'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useToast } from 'react-native-toast-notifications'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

interface SummaryData {
  // Form One Data
  pickupAddress: string;
  dropOffAddress: string;
  recipientPhoneNumber: string;
  recipientName: string;
  alternativeDropOffAddress?: string;
  alternativeRecipientPhoneNumber?: string;
  alternativeRecipientName?: string;
  
  // Form Two Data
  packageType: string;
  packageDescription: string;
  additionalNotes?: string;
  packageImages: any[];

  fare_amount: string;
  duration_minutes: string;
  distance_km: string;
}

const ParcelSummary = () => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const params = useLocalSearchParams();
  const toast = useToast();

  useEffect(() => {
    if (params.summaryData) {
      try {
        const data = JSON.parse(params.summaryData as string);
        setSummaryData(data);
        console.log('Summary Data:', data);
      } catch (error) {
        console.error('Error parsing summary data:', error);
        toast.show('Error loading summary data', { type: 'danger' });
      }
    }
  }, [params.summaryData]);

  const handleBack = () => {
    router.back();
  };

  const handleFindRides = () => {
    if (!summaryData) return;
    
    // Navigate to available riders screen with summary data
    router.push({
      pathname: "/(access)/(user_stacks)/courier/parcel-available-riders",
      params: {
        summaryData: JSON.stringify(summaryData)
      }
    });
  };

  const formatPackageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!summaryData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-gray-600" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
            Loading summary...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1">
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 20
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl text-gray-800 mb-2" style={{fontFamily: 'HankenGrotesk_700Bold'}}>
              Summary
            </Text>
            <Text className="text-base text-gray-500 leading-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
              View Details of your courier order
            </Text>
          </View>

          {/* Order Details Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
            {/* Pickup and Drop-off */}
            <View className="">
              <View className="mb-6">
                <View className="flex-row gap-1 items-center">
                  <MaterialIcons name='location-pin' size={20} color={'green'}/>
                  <Text className="text-base text-green-950 pt-0 mt-0" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    Pickup Address
                  </Text>
                </View>
                <Text className="text-sm text-gray-400 leading-5 ml-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  {summaryData.pickupAddress}
                </Text>
              </View>

              <View className="">
                <View className="flex-row gap-1 items-center">
                  <MaterialIcons name='location-pin' size={20} color={'green'}/>
                  <Text className="text-base text-green-950 pt-0 mt-0" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    Drop off Address
                  </Text>
                </View>
                <Text className="text-sm text-gray-400 leading-5 ml-6" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                  {summaryData.dropOffAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Recipient Details */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm shadow-black/5">
            <Text className="text-lg text-gray-800 mb-1" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              Recipient Details
            </Text>
            
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Name:</Text>
                <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.recipientName}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Phone Number:</Text>
                <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.recipientPhoneNumber}</Text>
              </View>
            </View>
          </View>

          {/* Alternative Recipient Details */}
          {(summaryData.alternativeRecipientName || summaryData.alternativeRecipientPhoneNumber || summaryData.alternativeDropOffAddress) && (
            <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm shadow-black/5">
              <Text className="text-lg text-gray-800 mb-1" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                Alternative Recipient Details
              </Text>
              
              <View className="mt-4">
                {summaryData.alternativeRecipientName && (
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Name:</Text>
                    <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.alternativeRecipientName}</Text>
                  </View>
                )}

                {summaryData.alternativeRecipientPhoneNumber && (
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Phone Number:</Text>
                    <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.alternativeRecipientPhoneNumber}</Text>
                  </View>
                )}

                {summaryData.alternativeDropOffAddress && (
                  <View className="flex-row justify-between items-start mb-3">
                    <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Address:</Text>
                    <Text className="flex-1 text-right text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                      {summaryData.alternativeDropOffAddress}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Package Description */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm shadow-black/5">
            <Text className="text-lg text-gray-800 mb-1" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              Package Information
            </Text>
            
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Description:</Text>
                <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.packageDescription}</Text>
              </View>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Type:</Text>
                <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  {formatPackageType(summaryData.packageType)}
                </Text>
              </View>

              {summaryData.packageImages && summaryData.packageImages.length > 0 && (
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Photos:</Text>
                  <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{summaryData.packageImages.length} image(s)</Text>
                </View>
              )}

               {summaryData.additionalNotes && (
                <View className="flex-cols gap-2 pt-4 border-t border-gray-100 mt-2">
                  <Text className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_500Medium'}}>Special Notes</Text>
                  <Text className="text-sm text-gray-800" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    {summaryData.additionalNotes || 'This is special notice for the rider.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View className="px-6 pb-4 pt-2 bg-white border-t border-gray-100">
          <View className="flex-row items-center gap-4">
            <View className='flex-1'>
              <SolidLightButton 
                onPress={handleBack}
                text={"Back"}
              />
            </View>

            <View className='flex-1'>
              <SolidMainButton 
                onPress={handleFindRides}
                text="Find Rides"
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ParcelSummary