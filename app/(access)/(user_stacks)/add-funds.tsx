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

interface PaymentData {
  payment_method: string
  provider_name: string
}

const AddFunds = () => {
    const {mutate, isPending} = useFundWallet()
    const [showDialog, setShowDialog] = useState(false);
    const [showPaystack, setShowPaystack] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

    type PaymentResult = {
        payStackUrl: string;
        accessCode: string;
        reference: string;
    } | null;
    
    const [paymentData, setPaymentData] = useState<PaymentResult>(null);
    
    // Function to format amount with commas
    const formatAmount = (amount: string) => {
        if (!amount) return '';
        const numericValue = amount.replace(/[^0-9]/g, '');
        if (!numericValue) return '';
        return new Intl.NumberFormat('en-US').format(parseInt(numericValue));
    };

    // Payment method mapping
    const getPaymentMethodData = (methodId: string): PaymentData => {
        const paymentMethods: { [key: string]: PaymentData } = {
            card: {
                payment_method: "card",
                provider_name: "paystack",
            },
            transfer: {
                payment_method: "bank_transfer",
                provider_name: "paystack",
            },
        }
        return paymentMethods[methodId] || paymentMethods["card"]
    }

    const PaymentOption = ({ id, title, subtitle, icon, recommended = false }: any) => (
        <TouchableOpacity
            onPress={() => setSelectedPaymentMethod(id)}
            className={`flex-row items-center justify-between p-4 border rounded-lg mb-3 ${
                selectedPaymentMethod === id ? "border-orange-500" : "border-gray-200"
            }`}
        >
            <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                    <Text className="text-lg">{icon}</Text>
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center">
                        <Text className="text-base font-medium text-gray-900">{title}</Text>
                        {recommended && (
                            <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                                <Text className="text-xs text-green-600 font-medium">Recommended</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
                </View>
            </View>
            <View
                className={`w-5 h-5 rounded-full border-2 ${
                    selectedPaymentMethod === id ? "border-orange-500 bg-orange-500" : "border-gray-300"
                }`}
            >
                {selectedPaymentMethod === id && <View className="w-2 h-2 bg-white rounded-full m-auto" />}
            </View>
        </TouchableOpacity>
    )

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
        
        // Get payment method data
        const paymentMethodData = getPaymentMethodData(selectedPaymentMethod);
        
        const form_data = {
            amount: data.amount,
            provider_name: paymentMethodData.provider_name,
            payment_method: paymentMethodData.payment_method,
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
                        
                        {/* Payment Methods Section */}
                        <View className="mt-8 mb-6">
                            <Text className="text-lg font-semibold mb-4" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                                Payment Method
                            </Text>
                            <PaymentOption
                                id="card"
                                title="Card Payment"
                                subtitle="Make payment with bank debit cards"
                                icon="💳"
                                recommended={true}
                            />
                            <PaymentOption
                                id="transfer"
                                title="Bank Transfer"
                                subtitle="Make payment with bank transfer"
                                icon="🏦"
                            />
                        </View>

                        {/* Promotional Message */}
                        <View className="bg-orange-50 p-4 rounded-lg mb-6">
                            <Text className="text-orange-600 text-sm">
                                Add funds to your MovBay wallet—fast, safe, and fully protected!
                            </Text>
                        </View>

                        {/* Add Funds Button */}
                        <View className='mt-4'>
                            <SolidMainButton onPress={handlePress} text='Add Funds'/>
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