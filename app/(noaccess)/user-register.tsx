import { OnboardHeader } from '@/components/btns/OnboardHeader'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message"
import { Button, Icon } from "@rneui/themed";
import { SolidMainButton } from '@/components/btns/CustomButtoms'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { Toast } from 'react-native-toast-notifications'
import { useRegistration } from '@/hooks/mutations/auth'
import LoadingOverlay from '@/components/LoadingOverlay'


const UserRegister = () => {
  const [showPassword, setShowPassword] = useState(false);

  const registrationMutation = useRegistration();

    // Function to format phone number for backend
    const formatPhoneNumber = (phoneNumber: any) => {
        let cleanNumber = phoneNumber.replace(/\D/g, '');
        if (cleanNumber.startsWith('0')) {
            cleanNumber = cleanNumber.substring(1);
        }
        return `+234${cleanNumber}`;
    };

    // ========= REACT HOOK FORM =========
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            fullname: "",
            username: "",
            email: "",
            phone_number: "",
            password: "",
            password2: "",
        },
    });


    const onSubmit = (data: any) => {
        const form_data = {
            fullname: data.fullname,
            username: data.username,
            email: data.email,
            phone_number: formatPhoneNumber(data.phone_number), // Format phone number here
            password: data.password,
            password2: data.password2,
            user_type: "User",
        };

        try{
        registrationMutation.mutate(form_data, {
            onSuccess: async (response) => {
                Toast.show("Registration successful!", {
                    type: "success",
                });
                // Pass the email as a parameter to the OTP screen
                router.replace({
                    pathname: "/otp-screen",
                    params: { email: data.email }
                });
                console.log(response);
            },

            onError: (error: any) => {
                console.log(error.response);
                if (error.response.data.email) {
                    Toast.show(error.response.data.email, {
                        type: "danger",
                    });
                } 

                if (error.response.data.password) {
                    Toast.show(error.response.data.password, {
                        type: "danger",
                    });
                } 


                if (error.response.data.phone_number) {
                    Toast.show(error.response.data.phone_number, {
                        type: "danger",
                    });
                } 

                
                // if (error.request) {
                //     Toast.show("Network error, please try again later.", {
                //         type: "danger",
                //     });
                // } else {
                //     Toast.show("An unexpected error occurred.", {
                //         type: "danger",
                //     });
                // }
            },
        });
        }catch(error){
            console.log(error);
        }
    }
  return (
    <SafeAreaView className='flex-1 flex w-full bg-white '>
        <StatusBar style='dark'/>
        <LoadingOverlay visible={registrationMutation.isPending}/>

        <KeyboardAwareScrollView>
            <View className='px-7 mt-10 pb-10'>
                <OnboardHeader text="Welcome! Let's Get You Started." description="Sign up to shop, send or track—it's quick and free."/>
                <View className='pt-10'>

                    <View className='mb-5'>
                        <Text style={styles.titleStyle}>Full Name</Text>
                        <Controller
                            name="fullname"
                            control={control}
                            rules={{
                                required: "Full name is required",
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (

                                <TextInput 
                                    placeholder='E.g - John Doe'
                                    placeholderTextColor={"#AFAFAF"}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    keyboardType="default"
                                    style={styles.inputStyle}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            )}
                        />

                        <ErrorMessage
                        errors={errors}
                        name="fullname"
                        render={({ message }) => (
                            <Text className="pl-2 pt-3 text-sm text-red-600">
                            {message}
                            </Text>
                        )}
                        />
                    </View>

                      <View className='mb-5'>
                        <Text style={styles.titleStyle}>Username</Text>
                        <Controller
                            name="username"
                            control={control}
                            rules={{
                                required: "Username is required",
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (

                                <TextInput 
                                    placeholder='E.g - @bigJoe'
                                    placeholderTextColor={"#AFAFAF"}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    keyboardType="default"
                                    style={styles.inputStyle}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                />
                            )}
                        />

                        <ErrorMessage
                        errors={errors}
                        name="username"
                        render={({ message }) => (
                            <Text className="pl-2 pt-3 text-sm text-red-600">
                            {message}
                            </Text>
                        )}
                        />
                    </View>

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
                        <Text style={styles.titleStyle}>Phone Number</Text>
                        <Controller
                            name="phone_number"
                            control={control}
                            rules={{
                                required: "Phone Number is required",
                                pattern: {
                                    value: /^[0-9]{10,11}$/,
                                    message: "Please enter a valid Nigerian phone number"
                                }
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View className='relative'>
                                    <View className='absolute z-10 left-0 top-0 justify-center items-center h-full px-4 bg-gray-100 rounded-l-md border-r border-gray-200'>
                                        <Text className='text-[#3A3541] font-medium '>+234</Text>
                                    </View>
                                    <TextInput 
                                        placeholder='8094422763'
                                        placeholderTextColor={"#AFAFAF"}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        keyboardType="phone-pad"
                                        style={[styles.inputStyle, { paddingLeft: 70 }]}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        maxLength={11}
                                    />
                                </View>
                            )}
                        />

                        <ErrorMessage
                        errors={errors}
                        name="phone_number"
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

                    <View className='mb-5'>
                        <Text style={styles.titleStyle}>Confirm Password</Text>
                        <Controller
                            name="password2"
                            control={control}
                            rules={{
                                required: "Confirm password is required",
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
                            name="password2"
                            render={({ message }) => (
                                <Text className="pl-2 pt-3 text-sm text-red-600">
                                    {message}
                                </Text>
                            )}
                        />
                    </View>


                    <View className='flex-col gap-4'>
                        <SolidMainButton text='Signup' onPress={handleSubmit(onSubmit)}/>
                       
                    </View>

                    <View className='pt-5 flex-row gap-4 justify-center'>

                        <Text className='text-[#3A3541] text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Don't have an account?</Text>

                        <Button
                            type="clear"
                            size="sm"
                            onPress={() => router.push("/login")}
                                titleStyle={{
                                color: "#F75F15",
                                fontFamily: "HankenGrotesk_600SemiBold",
                                fontSize: 14,
                            }}
                        >
                            Log in here
                        </Button>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

export default UserRegister

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