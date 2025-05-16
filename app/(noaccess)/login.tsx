import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { Button, Icon } from "@rneui/themed";
import { GoogleButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

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

                    <View className='mb-5'>
                        <Text style={styles.titleStyle}>Password</Text>
                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: "Password is required",
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
                                    />

                                    <View className='absolute right-0 top-0 justify-center items-center h-full w-20'>
                                        <Button
                                                type="clear"
                                                size="sm"
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                            <Icon
                                                name={
                                                showPassword ? "eye-off-outline" : "eye-outline"
                                                }
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
                        >
                            Forgot password?
                        </Button>
                    </View>

                    <View className='flex-col gap-4'>
                        <SolidMainButton text='Login' onPress={handleSubmit(onSubmit)}/>
                        <Text className='text-center text-neutral-400'> -- or with -- </Text>
                        <GoogleButton text='Google' onPress={handleSubmit(onSubmit)}/>
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

