import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextField } from "react-native-ui-lib";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"


const Login = () => {

    /*********************************************
     * REACT HOOK FORM
   * **********************************************/
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  return (
    <SafeAreaView className='flex-1 w-full bg-white'>
        <StatusBar style='dark'/>

        <View className='px-7 pt-10'>
            <OnboardHeader text='Welcome back!' description="Login to shop, send or track—it's quick and free."/>

            <View>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      placeholder="Joe@email.com"
                      keyboardType="email-address"
                      placeholderTextColor="#3A3541AD"
                      hideUnderline
                      autoCapitalize="none"
                      fieldStyle={[
                        styles.inputStyle,
                        { borderColor: errors.email ? "red" : "#3A35413B" },
                      ]}
                      label="Email"
                      labelStyle={[
                        styles.inputTitle,
                        { color: errors.email ? "red" : "#000" },
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />

                <ErrorMessage
                  errors={errors}
                  name="email"
                  render={({ message }) => (
                    <Text className="pl-2 pt-1 text-xs text-red-600">
                      {message}
                    </Text>
                  )}
                />
            </View>
        </View>

   
    </SafeAreaView>
  )
}

export default Login

const styles = StyleSheet.create({

   inputStyle: {
    borderWidth: 0.5,
    // borderColor: "#3A35413B",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  inputTitle: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    paddingBottom: 1,
  },
});

