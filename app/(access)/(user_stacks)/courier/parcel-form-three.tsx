import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { router, useLocalSearchParams } from 'expo-router'

const deliveryOptions = [
    {
        id: 'bike',
        title: 'Bike',
        description: 'Faster, best for small items',
        icon: '🛵',
        price: 2500,
        estimatedTime: '15-25 mins'
    },
    {
        id: 'car',
        title: 'Car',
        description: 'For larger packages',
        icon: '🚘',
        price: 4000,
        estimatedTime: '20-35 mins'
    }
];

interface CombinedFormData {
  // Form One Data
  pickupAddress: string;
  dropOffAddress: string;
  recipientPhoneNumber: string;
  recipientName: string;
  alternativeDropOffAddress?: string;
  alternativeRecipientPhoneNumber?: string;
  alternativeRecipientName?: string;
  
  // Form Two Data
  packageType: string;
  packageDescription: string;
  additionalNotes?: string;
  packageImages: any[];
}

const ParcelFormThree = () => {
    const [selectedDelivery, setSelectedDelivery] = useState('bike');
    const [formData, setFormData] = useState<CombinedFormData | null>(null);
    const params = useLocalSearchParams();

    useEffect(() => {
        if (params.formData) {
            const data = JSON.parse(params.formData as string);
            setFormData(data);
            console.log('Combined Form Data:', data);
        }
    }, [params.formData]);

    const handleDeliverySelect = (deliveryId: string) => {
        setSelectedDelivery(deliveryId);
    };

    const handleBack = () => {
        router.back();
    };

    const handleProceed = () => {
        if (!formData) {
            console.error('No form data available');
            return;
        }

        const selectedOption = deliveryOptions.find(option => option.id === selectedDelivery);
        
        if (!selectedOption) {
            console.error('No delivery option selected');
            return;
        }

        // Create complete summary data
        const summaryData = {
            // Form One Data
            pickupAddress: formData.pickupAddress,
            dropOffAddress: formData.dropOffAddress,
            recipientPhoneNumber: formData.recipientPhoneNumber,
            recipientName: formData.recipientName,
            alternativeDropOffAddress: formData.alternativeDropOffAddress,
            alternativeRecipientPhoneNumber: formData.alternativeRecipientPhoneNumber,
            alternativeRecipientName: formData.alternativeRecipientName,
            
            // Form Two Data
            packageType: formData.packageType,
            packageDescription: formData.packageDescription,
            additionalNotes: formData.additionalNotes,
            packageImages: formData.packageImages,
            
            // Form Three Data (Courier Selection)
            courierType: selectedOption.id,
            courierTitle: selectedOption.title,
            courierIcon: selectedOption.icon,
            price: selectedOption.price,
            estimatedTime: selectedOption.estimatedTime,
        };

        console.log('Final Summary Data:', summaryData);

        // Navigate to summary screen
        router.push({
            pathname: "/(access)/(user_stacks)/courier/parcel-summary",
            params: {
                summaryData: JSON.stringify(summaryData)
            }
        });
    };

    if (!formData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar style="dark" />
                <View className="flex-1 justify-center items-center">
                    <Text>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />
            
            <View className="flex-1">
                {/* Main Content */}
                <View className="flex-1 px-7 pt-6">
                    {/* Header */}
                    <View className="mb-8">
                        <Text className="text-2xl mb-2" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                            How should we deliver it?
                        </Text>
                        <Text className="text-base text-gray-500" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                            Delivery fees are auto-calculated based on distance.
                        </Text>
                    </View>

                    {/* Delivery Options */}
                    <View className="gap-4">
                        {deliveryOptions.map((option) => (
                            <TouchableOpacity 
                                key={option.id}
                                onPress={() => handleDeliverySelect(option.id)}
                                style={[
                                    styles.deliveryOption,
                                    selectedDelivery === option.id && styles.selectedOption
                                ]}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        {/* Icon */}
                                        <View className="mr-4">
                                            <Text style={styles.deliveryIcon}>{option.icon}</Text>
                                        </View>
                                        
                                        {/* Content */}
                                        <View className="flex-1">
                                            <Text style={styles.deliveryTitle}>
                                                {option.title}
                                            </Text>
                                            <Text style={styles.deliveryDescription}>
                                                {option.description}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Price and Time */}
                                    <View className="items-end">
                                        <Text style={styles.deliveryPrice}>
                                            ₦{option.price}
                                        </Text>
                                        <Text style={styles.deliveryTime}>
                                            {option.estimatedTime}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bottom Action Buttons */}
                <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
                    <View className="flex-row items-center gap-4">
                        <View className='flex-1'>
                            <SolidLightButton 
                                onPress={handleBack}
                                text={"Back"}
                            />
                        </View>

                        <View className='flex-1'>
                            <SolidMainButton 
                                onPress={handleProceed}
                                text={"Proceed"}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default ParcelFormThree

const styles = StyleSheet.create({
    deliveryOption: {
        backgroundColor: '#F6F6F6',
        borderRadius: 12,
        padding: 20,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    
    selectedOption: {
        borderColor: '#F75F15',
        backgroundColor: '#FFF5F2',
    },
    
    deliveryIcon: {
        fontSize: 24,
    },
    
    deliveryTitle: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: '#000',
        marginBottom: 4,
    },
    
    deliveryDescription: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
    },

    deliveryPrice: {
        fontFamily: 'HankenGrotesk_600SemiBold',
        fontSize: 16,
        color: '#000',
        marginBottom: 2,
    },

    deliveryTime: {
        fontFamily: 'HankenGrotesk_400Regular',
        fontSize: 12,
        color: '#666',
    },
});