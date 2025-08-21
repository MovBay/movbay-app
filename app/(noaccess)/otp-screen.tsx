import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { Button, Icon } from "@rneui/themed";
import { GoogleButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useActivate, useLogin } from '@/hooks/mutations/auth'
import { Toast, useToast } from 'react-native-toast-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
// import useLogin from '@/hooks/mutations/useLogin'

interface OtpData {
  otp: string;
  email: string;
}

const OtpScreen = () => {

  const toast = useToast();
  
  // Get the email parameter from the navigation
  const { email: passedEmail } = useLocalSearchParams<{ email: string }>();

  // ========= REACT HOOK FORM =========
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<OtpData>({
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  // Set the email when component mounts if it was passed from registration
  useEffect(() => {
    if (passedEmail) {
      setValue('email', passedEmail);
    }
  }, [passedEmail, setValue]);

  const {mutate, isPending} = useActivate();

  const onSubmit = (data: OtpData) => {
    try {
      mutate(data, {

        onSuccess: (response: any) => {
          // console.log('Login successful:', response?.data);
          toast.show('Verified successfully!', { type: "success" });
            AsyncStorage.setItem('movebay_token', response?.data?.token?.access);
            AsyncStorage.setItem('movebay_usertype', response?.data?.user_type);
            // console.log('Login successful:', response?.data?.user_type, response?.data?.token?.access);
            if(response?.data?.user_type === 'Rider') {
              toast.show('Welcome to Movbay', { type: "success" });
              console.log('Login successful:', response?.data?.user_type, response?.data?.token?.access);
              router.replace('/(access)/(rider_tabs)/riderHome');
            }
  
            if(response?.data?.user_type === 'User') {
              toast.show('Welcome to Movbay', { type: "success" });
              router.replace('/(access)/(user_tabs)/home');
            }
          reset();
        },
        onError: (error: any) => {
          console.log('Login failed:', error.response.data);
          
          let errorMessage = 'Login failed. Please try again.';
          
          try {
            if (error?.response?.data?.message) {
              errorMessage = error.response.data.message;
            } 

            if (typeof errorMessage !== 'string') {
              errorMessage = 'Login failed. Please try again.';
            }
            
            toast.show(errorMessage, { type: "danger" });
          } catch (toastError) {
            console.error('Toast error:', toastError);
            toast.show('Login failed. Please try again.', { type: "danger" });
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      Toast.show('An unexpected error occurred.', { type: "danger" });
    }
    // router.push('/verified');
  };

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isPending}  />
      
      <KeyboardAwareScrollView>
        <View className='px-7 mt-10 '>
          <OnboardHeader 
            text='OTP Verification' 
            description={`Enter the 5 digit number sent to ${passedEmail ? passedEmail : 'your email address'}`}
          />
          <View className='pt-10'>

            {/* <View className='mb-5'>
              <Text style={styles.titleStyle}>Email Address</Text>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput 
                    placeholder='E.g - johndoe@gmail.com'
                    placeholderTextColor={"#AFAFAF"}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    keyboardType="email-address"
                    style={[
                      styles.inputStyle, 
                      passedEmail && { backgroundColor: '#F0F0F0', color: '#666' }
                    ]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isPending && !passedEmail} // Make it non-editable if email was passed
                  />
                )}
              />
            
              <ErrorMessage
                errors={errors}
                name="email"
                render={({ message }) => (
                  <Text className="pl-2 pt-3 text-sm text-red-600">
                    {message}
                  </Text>
                )}
              />
            </View> */}

            <View className='mb-5'>
              <Text style={styles.titleStyle}>OTP Code</Text>
              <Controller
                name="otp"
                control={control}
                rules={{
                  required: "OTP is required",
                  minLength: {
                    value: 5,
                    message: "OTP must be 5 digits"
                  },
                  maxLength: {
                    value: 5,
                    message: "OTP must be 5 digits"
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput 
                    placeholder='E.g - 12345'
                    placeholderTextColor={"#AFAFAF"}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    keyboardType="number-pad"
                    maxLength={5}
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
                text={'Verify'} 
                onPress={handleSubmit(onSubmit)}
              />
            </View>

            <View className='pt-5 flex-row gap-4 justify-center'>
              <Text className='text-[#3A3541] text-sm' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Don't receive code?</Text>

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
    fontSize: 13,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6
  }
});