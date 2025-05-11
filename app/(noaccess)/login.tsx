import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView, TextField } from "react-native-ui-lib";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { Button, Icon } from "@rneui/themed";
import { SolidMainButton } from '@/components/btns/CustomButtoms'


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
    <View className='flex-1 flex w-full bg-white '>
        <StatusBar style='dark'/>

        <KeyboardAwareScrollView>
            <View className='px-7 mt-10'>
                <OnboardHeader text='Welcome back!' description="Login to shop, send or track—it's quick and free."/>
                <View className='pt-10'>

                    <View className='mb-6'>
                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: "Email is required",
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    placeholder="Enter email address"
                                    keyboardType="email-address"
                                    placeholderTextColor="#3A3541AD"
                                    hideUnderline
                                    autoCapitalize="none"
                                    fieldStyle={[
                                        styles.inputStyle,
                                        { borderColor: errors.email ? "red" : "#3A35413B" },
                                    ]}
                                    label="Email Address"
                                    labelStyle={[
                                        styles.inputTitle,
                                        { color: errors.email ? "#000" : "#000" },
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
                            <Text className="pl-2 pt-3 text-sm text-red-600">
                            {message}
                            </Text>
                        )}
                        />
                    </View>

                    <View className='mb-5'>
                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: "Password is required",
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextField
                                    placeholder="*******"
                                    autoCapitalize="none"
                                    placeholderTextColor="#AFAFAF"
                                    hideUnderline
                                    fieldStyle={[
                                        styles.inputStyle2,
                                        { borderColor: errors.password ? "red" : "#3A35413B" },
                                    ]}
                                    label="Password"
                                    labelStyle={[
                                        styles.inputTitle,
                                        { color: errors.password ? "#000" : "#000" },
                                    ]}
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    secureTextEntry={!showPassword}
                                    trailingAccessory={
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
                                    }
                                />
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


                    <View className='pb-10 flex-row justify-between'>

                        <TouchableOpacity>
                            <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Remember me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity>
                            <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <SolidMainButton text='Login' onPress={handleSubmit(onSubmit)}/>
                    </View>

                    <View className='pt-5 flex-row gap-4 justify-center'>

                        <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Don't have an account?</Text>

                        <TouchableOpacity>
                            <Text className='text-[#F75F15] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Create an account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    </View>
  )
}

export default Login

const styles = StyleSheet.create({

   inputStyle: {
        borderRadius: 7,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F6F6F6'
    },


    inputStyle2: {
        borderRadius: 7,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: '#F6F6F6'
    },

  inputTitle: {
    fontSize: 16,
    fontFamily: "HankenGrotesk_600SemiBold",
    paddingBottom: 5,
  },
});

