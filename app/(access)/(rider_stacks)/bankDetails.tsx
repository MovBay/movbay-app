import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SolidMainButton } from '@/components/btns/CustomButtoms';

// Bank Details Display Screen (when bank exists)
const BankDetailsDisplay = () => {
  const [bankData] = useState({
    accountName: 'Sunday Kingsley Uchenna',
    accountNumber: '9022849307',
    bankName: 'GT Bank'
  });

  const copyAccountNumber = () => {
    // Copy to clipboard functionality
    console.log('Account number copied');
  };

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
      
      <View className='flex-1'>
        <KeyboardAwareScrollView 
          className='flex-1' 
          contentContainerStyle={{paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20}}
        >
          <View className=''>
            <View className='flex-row items-center gap-2 mb-8'>
              <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
              <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                Bank Details
              </Text>
            </View>

            {/* Bank Details Card */}
            <View className='border border-neutral-100 rounded-lg p-2 mb-6'>
              {/* Account Name */}
              <View className='mb-6'>
                <Text className='text-sm text-gray-600 mb-1' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Account Name</Text>
                <Text className='text-lg text-black' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                  {bankData.accountName}
                </Text>
              </View>

              {/* Account Number */}
              <View className='mb-6'>
                <Text className='text-sm text-gray-600 mb-1' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Account Number</Text>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-lg text-black' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    {bankData.accountNumber}
                  </Text>
                  <TouchableOpacity onPress={copyAccountNumber} className='ml-2'>
                    <Ionicons name="copy-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bank Name */}
              <View className='mb-6'>
                <Text className='text-sm text-gray-600 mb-1' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Bank Name</Text>
                <View className='flex-row items-center'>
                  <Text className='text-lg text-black' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                    {bankData.bankName}
                  </Text>
                </View>
              </View>

              {/* Edit Bank Details Button */}
              <TouchableOpacity 
                className='bg-[#FEEEE6] rounded-full p-3.5  flex-row items-center justify-center'
                onPress={() => router.push('/(access)/(rider_stacks)/bankEdit')}
              >
                <MaterialIcons name="edit" size={16} color="#A53F0E" />
                <Text className='text-[#A53F0E] ml-2' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                  Edit Bank Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* Edit Bank Button */}
        <View className='px-7 pb-8'>
          <SolidMainButton 
            text='Edit Bank' 
            onPress={() => router.push('/(access)/(rider_stacks)/bankEdit')} 
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

// Bank Details Edit/Add Screen


// Empty State Screen (when no bank details exist)
const BankDetailsEmpty = () => {
  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
      
      <View className='flex-1'>
        <View className='px-7 pt-6 pb-4'>
          <View className='flex-row items-center gap-2 mb-8'>
            <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
            <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              Bank Details
            </Text>
          </View>
        </View>

        {/* Empty State Content */}
        <View className='flex-1 justify-start mt-40 pt-40 items-center px-7'>
          <View className='items-center mb-8 w-full'>
            {/* Bank Icon */}
            <View className='w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4'>
              <Ionicons name="card-outline" size={40} color="#9CA3AF" />
            </View>
            
            {/* Empty State Text */}
            <Text className='text-xl text-center text-black mb-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
              No Bank Details Added
            </Text>
            <Text className='text-base text-center text-neutral-500 leading-6 w-[90%] m-auto' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
              Add your bank account details to receive payments and withdrawals seamlessly
            </Text>
                <View className='pt-5 w-[50%]'>
                    <SolidMainButton 
                        text='Add Bank Account' 
                        onPress={() => router.push('/(access)/(rider_stacks)/bankEdit')} 
                    />
                </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  )
}

// Main component that decides which screen to show
const BankDetails = () => {
  const [hasBankDetails] = useState(true);

  if (!hasBankDetails) {
    return <BankDetailsEmpty />;
  }

  return <BankDetailsDisplay />;
}

export default BankDetails;