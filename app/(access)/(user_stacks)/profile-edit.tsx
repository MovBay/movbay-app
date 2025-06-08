import { View, Text, Image } from 'react-native'
import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query';
import { useLogout } from '@/hooks/mutations/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { OnboardArrowHeader, OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { SolidMainButton } from '@/components/btns/CustomButtoms';
import { TextInput } from 'react-native';
import { ErrorMessage } from '@hookform/error-message';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


const ProfileEdit = () => {
  const {mutate, isPending} = useLogout();

    const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

    const {
          control,
          handleSubmit,
          formState: { errors },
          reset,
      } = useForm({
          defaultValues: {
              fullname: "",
              username: "",
              phone_number: "",
          },
    });

    const onSubmit = (data: any) => {
        console.log(data);
    }


  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar style='dark'/>
        <LoadingOverlay visible={isPending}  />

        <View className='flex-1'>
          <KeyboardAwareScrollView className='flex-1' contentContainerStyle={{paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20}}>
            <View className=''>

            <View className='flex-row items-center gap-2'>
                <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
                <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Edit Profile</Text>
            </View>

              <View className='flex-row gap-3 items-center mt-6'>
                <View className='flex w-24 h-24 rounded-full bg-gray-300  items-center mt-4 relative'>
                  <Image source={{uri: image}} style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
                    <Pressable 
                        onPress={pickImage} 
                        className='absolute bottom-0 right-0 bg-[#FEEEE6] rounded-full p-1.5'>
                        <MaterialIcons name='drive-folder-upload' size={25} color={'#F75F15'}/>
                    </Pressable> 
                </View>
                <View>
                  <Text className='text-base mt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Upload</Text>
                  <Text className='text-sm text-gray-500 ' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Image should be in Jpeg, jpg, png.</Text>
                </View>
              </View>

              <View className='mt-6 flex-col'>
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
                    <Text style={styles.titleStyle}>Phone Number</Text>
                    <Controller
                        name="phone_number"
                        control={control}
                        rules={{
                            required: "Phone Number is required",
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (

                            <TextInput 
                                placeholder='E.g - +2348094422763'
                                placeholderTextColor={"#AFAFAF"}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                keyboardType="phone-pad"
                                style={styles.inputStyle}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
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

              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Fixed Delete Button at Bottom */}
          <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100 mb-5'>
            <SolidMainButton
              onPress={handleSubmit(onSubmit)}
              text='Save'
            />
          </View>
        </View>
    </SafeAreaView>
  )
}

export default ProfileEdit


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