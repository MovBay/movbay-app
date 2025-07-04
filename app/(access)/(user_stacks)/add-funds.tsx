import { View, Text, Linking, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Ionicons from '@expo/vector-icons/Ionicons';
import {OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { StyleSheet } from 'react-native';
import { Image } from 'react-native';
import { useFundWallet } from '@/hooks/mutations/sellerAuth';
import { Toast } from 'react-native-toast-notifications';
import {Controller, useForm } from "react-hook-form";
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms';
import { TextInput } from 'react-native';
import { ErrorMessage } from '@hookform/error-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const AddFunds = () => {
    const {mutate, isPending} = useFundWallet()
    const [showDialog, setShowDialog] = useState(false);
    const [showPaystack, setShowPaystack] = useState(false);

    type PaymentData = {
        payStackUrl: string;
        accessCode: string;
        reference: string;
    } | null;
    
    const [paymentData, setPaymentData] = useState<PaymentData>(null);
    
    // Function to format amount with commas
    const formatAmount = (amount: string) => {
        if (!amount) return '';
        const numericValue = amount.replace(/[^0-9]/g, '');
        if (!numericValue) return '';
        return new Intl.NumberFormat('en-US').format(parseInt(numericValue));
    };

    const handlePress = () => {
        setShowDialog(true);
    };
    
    const closeDialog = () => {
        setShowDialog(false);
    };

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            amount: ""
        },
    });

    // Watch the amount field to get real-time updates
    const watchedAmount = watch("amount");

    const onSubmit = (data: any) => {
        closeDialog()
        const form_data = {
            amount: data.amount,
            provider_name: 'paystack',
            payment_method: 'card',
        };
        
        try{
        mutate(form_data, {
            onSuccess: async (response) => {
                closeDialog()
                console.log(response.data);
                setShowPaystack(true)
                const payStackUrl = response.data.data.authorization_url;
                const accessCode = response.data.data.access_code;
                const reference = response.data.data.reference;
                if(payStackUrl && accessCode){
                    AsyncStorage.setItem("movbay_access_code", accessCode);
                    AsyncStorage.setItem("movbay_payment_reference", reference);
                    setPaymentData({
                        payStackUrl: payStackUrl,
                        accessCode: accessCode,
                        reference: reference,
                    });
                }
            },
            onError: (error: any) => {
                closeDialog()
                console.log(error.response.data);
            },
        });
        }catch(error){
            console.log(error);
        }
    }

    const handlePaymentCancel = () => {
        console.log('Payment cancelled');
        router.push('/wallet')
        // Toast.show("Funding Successfull", {type: 'success'})
    };

    // If showing Paystack, render full-screen WebView
    if (showPaystack && paymentData) {
        return (
            <SafeAreaView style={styles.fullScreenContainer}>
                <StatusBar style='dark'/>
                {/* Header with close button */}
                <View style={styles.webViewHeader}>
                    <TouchableOpacity 
                        onPress={handlePaymentCancel}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={20} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Complete Payment</Text>
                    <View style={styles.headerSpacer} />
                </View>
                
                <WebView
                    style={styles.fullScreenWebView}
                    source={{ uri: paymentData.payStackUrl }}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mixedContentMode="compatibility"
                />
            </SafeAreaView>
        );
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
                            <Text className='text-2xl text-center m-auto' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Add Funds</Text>
                        </View>
                        <View className='mt-8 flex-col gap-4'>
                            <TouchableOpacity onPress={handlePress} className='flex-row items-center justify-between border-t border-neutral-100 pt-5'>
                                <View className='flex-row gap-3 items-center'>
                                    <View>
                                        <MaterialIcons name='credit-card' size={25}/>
                                    </View>
                                    <Text className='text-lg font-semibold' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Card</Text>
                                </View>
                                <Ionicons name='chevron-forward' size={17} color={'gray'}/>
                            </TouchableOpacity>  
                            <TouchableOpacity className='flex-row justify-between border-y border-neutral-100 py-5'>
                                <View className='flex-row gap-3 items-center'>
                                    <MaterialIcons name='document-scanner' size={25}/>
                                    <Text className='text-lg font-semibold' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Bank Transfer</Text>
                                </View>
                                <Ionicons name='chevron-forward' size={17} color={'gray'}/>
                            </TouchableOpacity>             
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {showDialog && (
                    <View style={styles.modalOverlay}>
                        <Pressable style={styles.modalBackdrop} onPress={closeDialog} />
                        <View className='bg-white rounded-2xl p-6 mx-6 w-[90%]'>
                            <Text className='text-xl text-center mb-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                Enter Amount
                            </Text>
                            <View className=''>
                                <Controller
                                    name="amount"
                                    control={control}
                                    rules={{
                                        required: "Amount is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='e.g. 100,000'
                                            placeholderTextColor={"#AFAFAF"}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                            keyboardType="number-pad"
                                            style={styles.inputStyle}
                                            className='border border-neutral-200'
                                        />
                                    )}
                                />
                                
                                {/* Formatted amount display */}
                                {watchedAmount && (
                                    <View className='mt-2 px-2 ml-auto'>
                                        <Text className='text-base font-semibold text-gray-600' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                                            ₦{formatAmount(watchedAmount)}.00
                                        </Text>
                                    </View>
                                )}
                                
                                <ErrorMessage
                                    errors={errors}
                                    name="amount"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>
                            <View className='flex-row items-center justify-between mt-5'>
                                <View className='w-[48%]'>
                                    <SolidLightButton onPress={closeDialog} text='Cancel'/>
                                </View>
                                <View className='w-[48%]'>
                                    <SolidMainButton onPress={handleSubmit(onSubmit)} text='Add Funds'/>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

export default AddFunds

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'white',
    },

    fullScreenWebView: {
        flex: 1,
    },

    webViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: 'white',
    },

    closeButton: {
        padding: 8,
    },

    headerTitle: {
        fontSize: 15,
        fontFamily: 'HankenGrotesk_600SemiBold',
        color: '#000',
    },

    headerSpacer: {
        width: 40, // Same width as close button to center the title
    },

    container: {
        flex: 1,
    },
    
    inputStyle: {
        borderRadius: 7,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontFamily: "HankenGrotesk_400Regular",
        backgroundColor: '#F6F6F6',
    },
    
    titleStyle: {
        fontFamily: "HankenGrotesk_500Medium",
        fontSize: 14,
        color: "#3A3541",
        paddingBottom: 8,
        paddingTop: 6
    },

    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});