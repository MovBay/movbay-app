import { View, Text, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms';
import { TextInput } from 'react-native';
import { ErrorMessage } from '@hookform/error-message';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import RNPickerSelect from "react-native-picker-select";
import { useToast } from 'react-native-toast-notifications';
// Import your KYC hooks here - adjust the import path as needed
import { useUpdateRiderKYC, useRiderKYC } from '@/hooks/mutations/auth';

// Custom Modal Component
const CustomSuccessModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    if (!visible) return null;
    
    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Image 
                        source={require('../../../assets/images/success.png')} 
                        style={styles.successImage}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.modalTitle}>
                        KYC Updated Successfully!
                    </Text>
                    <Text style={styles.modalDescription}>
                        Your KYC information has been updated successfully and is under review.
                    </Text>
                    
                    <View className='flex-row items-center justify-between'>
                        <View style={styles.buttonContainer}>
                            <SolidLightButton 
                                text='Close' 
                                onPress={() => {
                                    onClose();
                                }}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <SolidMainButton 
                                text='Back to Profile' 
                                onPress={() => {
                                    onClose();
                                    router.back();
                                }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const KycUpdate = () => {
    // Document states
    const [ninImage, setNinImage] = useState<string | null>(null);
    const [proofOfAddressImage, setProofOfAddressImage] = useState<string | null>(null);
    const [driversLicenceImage, setDriversLicenceImage] = useState<string | null>(null);
    
    const toast = useToast();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // Uncomment and adjust these hooks based on your implementation
    const { mutate: updateKYC, isPending } = useUpdateRiderKYC();
    const { riderKYC, isLoading: isLoadingKYC } = useRiderKYC();
    console.log('Riders KYC Data:', driversLicenceImage)

    
    const closeModal = () => {
        setShowSuccessModal(false);
    };

    // Image picker for NIN
    const pickNinImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setNinImage(result.assets[0].uri);
        }
    };

    // Image picker for Proof of Address
    const pickProofOfAddress = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setProofOfAddressImage(result.assets[0].uri);
        }
    };

    // Image picker for Driver's License
    const pickDriversLicence = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setDriversLicenceImage(result.assets[0].uri);
        }
    };

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        defaultValues: {
            vehicle_type: "",
            plate_number: "",
            vehicle_color: "",
        },
    });

    // Pre-populate form with existing KYC data
    useEffect(() => {
        if (riderKYC?.data) {
            const kyc = riderKYC.data;
            setValue('vehicle_type', kyc.vehicle_type || '');
            setValue('plate_number', kyc.plate_number || '');
            setValue('vehicle_color', kyc.vehicle_color || '');
            
            // Set existing images if available - using correct field names
            if (kyc.nin_url) {
                setNinImage(kyc.nin_url);
            }
            if (kyc.poa_url) {
                setProofOfAddressImage(kyc.poa_url);
            }
            if (kyc.drivers_licence_url) {
                setDriversLicenceImage(kyc.drivers_licence_url);
            }
        }
    }, [riderKYC, setValue]);

    const onSubmit = (data: any) => {
        // Create FormData object
        const formData = new FormData();
        
        // Add text fields
        Object.keys(data).forEach(key => {
            if (data[key]) {
                formData.append(key, data[key]);
            }
        });

        // Add NIN image if selected (only if it's a new image, not existing URL)
        if (ninImage && !ninImage.startsWith('http')) {
            const imageUri = ninImage;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            formData.append('nin', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        }

        // Add Proof of Address image if selected (only if it's a new image, not existing URL)
        if (proofOfAddressImage && !proofOfAddressImage.startsWith('http')) {
            const imageUri = proofOfAddressImage;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            formData.append('proof_of_address', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        }

        // Add Driver's License image if selected (only if it's a new image, not existing URL)
        if (driversLicenceImage && !driversLicenceImage.startsWith('http')) {
            const imageUri = driversLicenceImage;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            formData.append('drivers_licence', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        }

        // Submit the form
        updateKYC(formData, {
            onSuccess: (response) => {
                setShowSuccessModal(true);
                console.log(response);
            },
            onError: (error: any) => {
                console.log(error?.response?.data);
                if(error?.response?.data?.nin){
                    toast.show('Invalid NIN document', {type: 'danger'});
                }
                else if(error?.response?.data?.proof_of_address){
                    toast.show('Invalid proof of address document', {type: 'danger'});
                }
                else if(error?.response?.data?.drivers_licence){
                    toast.show('Invalid driver\'s license document', {type: 'danger'});
                }
                else {
                    toast.show('Failed to update KYC. Please try again.', {type: 'danger'});
                }
            }
        });
    };

    if (isLoadingKYC) {
        return (
            <SafeAreaView className='flex-1 bg-white'>
                <View className='flex-1 justify-center items-center'>
                    <LoadingOverlay visible={true} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <StatusBar style='dark'/>
            <LoadingOverlay visible={isPending} />
            <View className='flex-1'>
                <KeyboardAwareScrollView 
                    className='flex-1'
                    contentContainerStyle={{
                        paddingHorizontal: 28, 
                        paddingTop: 24, 
                        paddingBottom: 20
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className=''>
                        <View className='flex-row items-center gap-2'>
                            <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
                        </View>
                        <View className='pt-3'>
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>KYC Verification</Text>
                            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Upload the document's below for KYC verification</Text>
                        </View>

                        <View className='mt-6 flex-col'>
                            {/* Upload Valid ID / NIN */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Upload Valid ID / NIN (For Verification)</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload' onPress={pickNinImage}/>
                                    </View>
                                    {ninImage ? 
                                        <View className='w-20 h-14 rounded-lg overflow-hidden'>
                                            <Image source={{uri: ninImage}} style={{width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover'}}/>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No file chosen</Text>
                                    }
                                </View>
                            </View>

                            {/* Upload Proof of Address */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Upload Proof of Address</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload' onPress={pickProofOfAddress}/>
                                    </View>
                                    {proofOfAddressImage ? 
                                        <View className='w-20 h-14 rounded-lg overflow-hidden'>
                                            <Image source={{uri: proofOfAddressImage}} style={{width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover'}}/>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No file chosen</Text>
                                    }
                                </View>
                            </View>

                            {/* Vehicle Details Section */}
                            <View className='mb-4'>
                                <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Vehicle details</Text>
                            </View>

                            {/* Driver's License Upload */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Driver's License (Car/Bike)</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload' onPress={pickDriversLicence}/>
                                    </View>
                                    {driversLicenceImage ? 
                                        <View className='w-20 h-14 rounded-lg overflow-hidden'>
                                            <Image source={{uri: driversLicenceImage}} style={{width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover'}}/>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No file chosen</Text>
                                    }
                                </View>
                            </View>

                            {/* Vehicle Type */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Vehicle Type</Text>
                                <Controller
                                    name="vehicle_type"
                                    control={control}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className='relative'>
                                            <RNPickerSelect
                                                onValueChange={(itemValue) => onChange(itemValue)}
                                                value={value}
                                                items={[
                                                    { label: "Car", value: "car" },
                                                    { label: "Motorcycle", value: "motorcycle" },
                                                    { label: "Bicycle", value: "bicycle" },
                                                    { label: "Van", value: "van" },
                                                    { label: "Truck", value: "truck" },
                                                ]}
                                                placeholder={{
                                                    label: "Select",
                                                    value: "",
                                                }}
                                                style={{
                                                    inputIOS: {
                                                        fontFamily: "HankenGrotesk_400Regular",
                                                        color: "#000",
                                                        paddingVertical: 16,
                                                        paddingHorizontal: 16,
                                                        borderRadius: 7,
                                                        backgroundColor: '#F6F6F6',
                                                        height: 56,
                                                    },
                                                    inputAndroid: {
                                                        fontFamily: "HankenGrotesk_400Regular",
                                                        color: "#000",
                                                        paddingVertical: 16,
                                                        paddingHorizontal: 16,
                                                        borderRadius: 7,
                                                        backgroundColor: '#F6F6F6',
                                                        height: 56,
                                                    },
                                                    placeholder: {
                                                        color: "#AFAFAF",
                                                    }
                                                }}
                                                useNativeAndroidPickerStyle={false}
                                            />
                                            
                                            <View className='absolute right-6 top-4'>
                                                <MaterialIcons name='arrow-drop-down' size={25} color={'gray'}/>
                                            </View>
                                        </View>
                                    )}
                                />
                            </View>

                            {/* Vehicle License/Plate Number */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Vehicle License</Text>
                                <Controller
                                    name="plate_number"
                                    control={control}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='Enter Vehicle License'
                                            placeholderTextColor={"#AFAFAF"}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                            keyboardType="default"
                                            style={styles.inputStyle}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                        />
                                    )}
                                />
                            </View>

                            {/* Vehicle Color */}
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Vehicle Color</Text>
                                <Controller
                                    name="vehicle_color"
                                    control={control}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className='relative'>
                                            <RNPickerSelect
                                                onValueChange={(itemValue) => onChange(itemValue)}
                                                value={value}
                                                items={[
                                                    { label: "White", value: "white" },
                                                    { label: "Black", value: "black" },
                                                    { label: "Silver", value: "silver" },
                                                    { label: "Red", value: "red" },
                                                    { label: "Blue", value: "blue" },
                                                    { label: "Green", value: "green" },
                                                    { label: "Yellow", value: "yellow" },
                                                    { label: "Orange", value: "orange" },
                                                    { label: "Brown", value: "brown" },
                                                    { label: "Gray", value: "gray" },
                                                    { label: "Other", value: "other" },
                                                ]}
                                                placeholder={{
                                                    label: "Select",
                                                    value: "",
                                                }}
                                                style={{
                                                    inputIOS: {
                                                        fontFamily: "HankenGrotesk_400Regular",
                                                        color: "#000",
                                                        paddingVertical: 16,
                                                        paddingHorizontal: 16,
                                                        borderRadius: 7,
                                                        backgroundColor: '#F6F6F6',
                                                        height: 56,
                                                    },
                                                    inputAndroid: {
                                                        fontFamily: "HankenGrotesk_400Regular",
                                                        color: "#000",
                                                        paddingVertical: 16,
                                                        paddingHorizontal: 16,
                                                        borderRadius: 7,
                                                        backgroundColor: '#F6F6F6',
                                                        height: 56,
                                                    },
                                                    placeholder: {
                                                        color: "#AFAFAF",
                                                    }
                                                }}
                                                useNativeAndroidPickerStyle={false}
                                            />
                                            
                                            <View className='absolute right-6 top-4'>
                                                <MaterialIcons name='arrow-drop-down' size={25} color={'gray'}/>
                                            </View>
                                        </View>
                                    )}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {/* Fixed Submit Button at Bottom */}
                <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
                    <SolidMainButton
                        onPress={handleSubmit(onSubmit)}
                        text={'Submit'}
                    />
                </View>

                {/* Custom Modal */}
                <CustomSuccessModal 
                    visible={showSuccessModal} 
                    onClose={closeModal} 
                />
            </View>
        </SafeAreaView>
    )
}

export default KycUpdate

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
        fontSize: 14,
        color: "#3A3541",
        paddingBottom: 8,
        paddingTop: 6
    },
    // Custom Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContainer: {
        backgroundColor: 'white',
        width: '85%',
        borderRadius: 24,
        padding: 20,
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginBottom: 8,
        backgroundColor: 'gray',
        borderRadius: 50,
        padding: 5
    },
    modalContent: {
        alignItems: 'center',
    },
    successImage: {
        width: 150,
        height: 150,
    },
    textContainer: {
        marginTop: 16,
    },
    modalTitle: {
        fontSize: 20,
        textAlign: 'center',
        fontFamily: 'HankenGrotesk_600SemiBold',
    },
    modalDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        width: '90%',
        alignSelf: 'center',
        paddingTop: 8,
        fontFamily: 'HankenGrotesk_400Regular',
    },
    buttonContainer: {
        width: '48%',
        alignSelf: 'center',
        marginTop: 24,
    },
});