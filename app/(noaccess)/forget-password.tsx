import { OnboardArrowHeader, OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import {StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'


const ForgetPassword = () => {

    // ========= REACT HOOK FORM =========
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


    const onSubmit = (data: any) => {
        console.log(data);
    }
  return (
    <SafeAreaView className='flex-1 flex w-full bg-white '>
        <StatusBar style='dark'/>

        <KeyboardAwareScrollView className='pt-5'>
            <View className='px-7'>
                <View className='flex-row items-center'>
                        <OnboardArrowHeader onPressBtn={()=>router.back()} />
                        <View className='flex-1'>
                            <Text className='text-2xl text-center' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Forget Password</Text>
                            <Text className='text-base text-center text-neutral-400' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Enter your valid email address</Text>
                        </View>
                </View>
                <View className='pt-5'>

                    <View className='mb-5'>
                        <Text style={styles.titleStyle}>Email Address</Text>
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: "Email is required",
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

                    <View className='flex-col gap-4'>
                        <SolidMainButton text='Continue' onPress={handleSubmit(onSubmit)}/>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default ForgetPassword

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

