
import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { Button, Icon } from "@rneui/themed";
import { GoogleButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useLogin } from '@/hooks/mutations/auth'
// import useLogin from '@/hooks/mutations/useLogin'

interface OtpData {
  otp: string;
}

const OtpScreen = () => {

  // ========= REACT HOOK FORM =========
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OtpData>({
    defaultValues: {
      otp: "",
    },
  });

  const {mutate, isPending} = useLogin();

  const onSubmit = (data: OtpData) => {
    router.push('/verified');
  };

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      
      <KeyboardAwareScrollView>
        <View className='px-7 mt-10'>
          <OnboardHeader text='OTP Verification' description="Enter the 4 digit number sent to your email address provided earlier"/>
          <View className='pt-10'>

            <View className='mb-5'>
              <Controller
                name="otp"
                control={control}
                rules={{
                  required: "OTP is required",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput 
                    placeholder='E.g - 123456'
                    placeholderTextColor={"#AFAFAF"}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.inputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isPending}
                  />
                )}
              />

              <ErrorMessage
                errors={errors}
                name="otp"
                render={({ message }) => (
                  <Text className="pl-2 pt-3 text-sm text-red-600">
                    {message}
                  </Text>
                )}
              />
            </View>

            <View className='flex-col gap-4'>
              <SolidMainButton 
                text={isPending ? 'Verifying...' : 'Verify'} 
                onPress={handleSubmit(onSubmit)}
              />
            </View>

            <View className='pt-5 flex-row gap-4 justify-center'>
              <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Don't recieve code?</Text>

              <Button
                type="clear"
                size="sm"
                onPress={() => console.log('Resend code pressed')}
                titleStyle={{
                  color: "#F75F15",
                  fontFamily: "HankenGrotesk_600SemiBold",
                  fontSize: 14,
                }}
                disabled={isPending}
              >
                Resend Code
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default OtpScreen

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: '#F6F6F6',
  },
  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6
  }
});