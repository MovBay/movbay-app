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
import { useToast } from "react-native-toast-notifications";
import AsyncStorage from '@react-native-async-storage/async-storage'
// import useLogin from '@/hooks/mutations/useLogin'

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const toast = useToast();

  // ========= REACT HOOK FORM =========
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {mutate, isPending, } = useLogin();
  // const loginMutation = useLogin();

  const onSubmit = (data: LoginFormData) => {
    try {
      mutate(data, {

        onSuccess: (response: any) => {
          AsyncStorage.setItem('movebay_token', response?.data?.token?.access);
          AsyncStorage.setItem('movebay_usertype', response?.data?.user_type);
          let userType = response?.data?.user_type
          console.log('Login successful:', response?.data?.user_type, response?.data?.token?.access);
          reset()

          if(userType === 'Rider') {
            toast.show('Login Successfull', { type: "success" });
            console.log('Login successful:', response?.data?.user_type, response?.data?.token?.access);
            router.replace('/(access)/(rider_tabs)/riderHome');
          }


          if(userType === 'User') {
            toast.show('Login Successful', { type: "success" });
            router.replace('/(access)/(user_tabs)/home');
          }
        },
        onError: (error: any) => {
          console.log('Login failed:', error.response.detail);
          
          let errorMessage = 'Login failed. Please try again.';
          let noAccountFound = error.response.data.error
          
          try {
            if (error?.response?.data?.detail) {
              errorMessage = error.response.data.detail;
            } 

            if (error?.response?.data?.message) {
              errorMessage = error.response.data.message;
            } 
            
            if (error?.message) {
              errorMessage = error.message;
            }
            
            if (noAccountFound) {
              errorMessage = 'Invalid Credentials';
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
      toast.show('An unexpected error occurred.', { type: "danger" });
    }
  };

  return (
    <SafeAreaView className='flex-1 flex w-full bg-white'>
      <StatusBar style='dark'/>
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isPending}  />

      <KeyboardAwareScrollView>
        <View className='px-7 mt-10'>
          <OnboardHeader text='Welcome back!' description="Login to shop, send or track—it's quick and free."/>
          <View className='pt-10'>

            <View className='mb-5'>
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
                    style={styles.inputStyle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isPending}
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
            </View>

            <View className='mb-5'>
              <Text style={styles.titleStyle}>Password</Text>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className='relative'>
                    <TextInput 
                      placeholder='*********'
                      placeholderTextColor={"#AFAFAF"}
                      style={styles.inputStyle}
                      secureTextEntry={!showPassword}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      editable={!isPending}
                    />

                    <View className='absolute right-0 top-0 justify-center items-center h-full w-20'>
                      <Button
                        type="clear"
                        size="sm"
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={isPending}
                      >
                        <Icon
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          type="ionicon"
                          size={20}
                          color={"#3A3541AD"}
                        />
                      </Button>
                    </View>
                  </View>
                )}
              />
              <ErrorMessage
                errors={errors}
                name="password"
                render={({ message }) => (
                  <Text className="pl-2 pt-3 text-sm text-red-600">
                    {message}
                  </Text>
                )}
              />
            </View>

            <View className='pb-10 flex-row items-center justify-between'>
              <Button
                type="clear"
                size="sm"
                onPress={() => router.push("/")}
                titleStyle={{
                  color: "#3A3541AD",
                  fontFamily: "HankenGrotesk_400Regular",
                  fontSize: 14,
                }}
                disabled={isPending}
              >
                Remember me
              </Button>

              <Button
                type="clear"
                size="sm"
                onPress={() => router.push("/forget-password")}
                titleStyle={{
                  color: "#3A3541AD",
                  fontFamily: "HankenGrotesk_400Regular",
                  fontSize: 14,
                }}
                disabled={isPending}
              >
                Forgot password?
              </Button>
            </View>

            <View className='flex-col gap-4'>
              <SolidMainButton 
                text={'Login'} 
                onPress={handleSubmit(onSubmit)}
              />
              <Text className='text-center text-neutral-400'> -- or with -- </Text>
              <GoogleButton 
                text='Google' 
                onPress={() => console.log('Google login pressed')}
              />
            </View>

            <View className='pt-5 flex-row gap-4 justify-center'>
              <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Don't have an account?</Text>

              <Button
                type="clear"
                size="sm"
                onPress={() => router.push("/user-role")}
                titleStyle={{
                  color: "#F75F15",
                  fontFamily: "HankenGrotesk_600SemiBold",
                  fontSize: 14,
                }}
                disabled={isPending}
              >
                Create an account
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default Login

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