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
import { useUpdateStore, useGetStore } from '@/hooks/mutations/sellerAuth';
import { Alert } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

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
                        Store Updated Successfully!
                    </Text>
                    <Text style={styles.modalDescription}>
                        Your store information has been updated successfully.
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
                                text='Back to Store' 
                                onPress={() => {
                                    onClose();
                                    router.push('/(access)/(user_tabs)/(drawer)/profile-s');
                                }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const StoreEdit = () => {
    // Get the store ID from route params
    const { storeId } = useLocalSearchParams();
    
    const [image, setImage] = useState<string | null>(null);
    const [CACDocument, setCACDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [NINImage, setNINImage] = useState<string | null>(null);
    const toast = useToast()
    const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
    
    // Use the update hook instead of create
    const { mutate, isPending } = useUpdateStore(storeId);
    const { storeData, isLoading: isLoadingStore } = useGetStore();
    
    const closeDialog = () => {
        setShowComingSoonDialog(false);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const pickCAC = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setCACDocument(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document. Please try again.');
            console.error('Document picker error:', error);
        }
    };

    const pickNIN = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setNINImage(result.assets[0].uri);
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
            name: "",
            category: "",
            description: "",
            phone_number: "",
            email: "",
            address1: "",
            address2: "",
        },
    });

    // Pre-populate form with existing store data
    useEffect(() => {
        if (storeData?.data) {
            const store = storeData.data;
            setValue('name', store.name || '');
            setValue('category', store.category || '');
            setValue('description', store.description || '');
            setValue('phone_number', store.phone_number || '');
            setValue('email', store.email || '');
            setValue('address1', store.address1 || '');
            setValue('address2', store.address2 || '');
            
            // Set existing image if available
            if (store.store_image) {
                setImage(store.store_image);
            }
        }
    }, [storeData, setValue]);

    const onSubmit = (data: any) => {
        // Create FormData object
        const formData = new FormData();
        
        // Add text fields
        Object.keys(data).forEach(key => {
            if (data[key]) {
                formData.append(key, data[key]);
            }
        });

        // Add store logo if selected
        if (image && !image.startsWith('http')) {
            // Only append if it's a new local image, not the existing URL
            const imageUri = image;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            formData.append('store_image', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        }

        // Add CAC document if selected (PDF)
        if (CACDocument) {
            formData.append('cac', {
                uri: CACDocument.uri,
                name: CACDocument.name,
                type: CACDocument.mimeType || 'application/pdf',
            } as any);
        }

        // Add NIN document if selected
        if (NINImage) {
            const imageUri = NINImage;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            formData.append('nin', {
                uri: imageUri,
                name: filename,
                type,
            } as any);
        }

        // Submit the form
        mutate(formData, {
            onSuccess: (response) => {
                setShowComingSoonDialog(true)
                console.log(response)
            },
            onError: (error: any) => {
                console.log(error?.response?.data)
                if(error?.response?.data?.cac){
                    toast.show('No CAC Document submitted', {type: 'danger'})
                }
                else if(error?.response?.data?.nin){
                    toast.show('No NIN Document submitted', {type: 'danger'})
                }
                else {
                    toast.show('Failed to update store. Please try again.', {type: 'danger'})
                }
            }
        });
    };

    if (isLoadingStore) {
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
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Edit Store Profile</Text>
                            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Update your store information to keep your profile current.</Text>
                        </View>
                        
                        <View className='flex-row gap-3 items-center mt-6'>
                            <View className='flex w-24 h-24 rounded-full bg-gray-300 items-center mt-4 relative'>
                                <View className='w-full h-full rounded-full overflow-hidden'>
                                    {image ? (
                                        <Image source={{uri: image}} style={{objectFit: 'cover', width: '100%', height: '100%'}}/>
                                    ) : (
                                        <View className='w-full h-full bg-gray-200 items-center justify-center'>
                                            <MaterialIcons name='store' size={30} color={'#AFAFAF'}/>
                                        </View>
                                    )}
                                </View>
                                <Pressable 
                                    onPress={pickImage}
                                    className='absolute bottom-0 right-0 bg-[#FEEEE6] rounded-full p-1.5'>
                                    <MaterialIcons name='drive-folder-upload' size={25} color={'#F75F15'}/>
                                </Pressable> 
                            </View>
                            <View>
                                <Text className='text-base mt-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Upload Store Logo</Text>
                                <Text className='text-sm text-gray-500 ' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Store logo for easy identification</Text>
                            </View>
                        </View>

                        <View className='mt-6 flex-col'>
                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Store Name</Text>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{
                                        required: "Store Name is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='E.g - Chidi Collections'
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
                                    name="name"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Store Category</Text>
                                <Controller
                                    name="category"
                                    control={control}
                                    rules={{
                                        required: "Store Category is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className='relative'>
                                            <RNPickerSelect
                                                onValueChange={(itemValue) => onChange(itemValue)}
                                                value={value}
                                                items={[
                                                    { label: "Everything", value: "everything" },
                                                    { label: "Fashion", value: "fashion" },
                                                    { label: "Electronics", value: "electronics" },
                                                    { label: "Beauty", value: "beauty" },
                                                    { label: "Car", value: "car" },
                                                    { label: "Sport", value: "sport" },
                                                    { label: "Shoes", value: "shoes" },
                                                    { label: "Bags", value: "bags" },
                                                    { label: "Other", value: "other" },
                                                ]}
                                                placeholder={{
                                                    label: "Select a Store Category",
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
                                <ErrorMessage
                                    errors={errors}
                                    name="category"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Store Description</Text>
                                <Controller
                                    name="description"
                                    control={control}
                                    rules={{
                                        required: "Store Description is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='Write a short description'
                                            placeholderTextColor={"#AFAFAF"}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            value={value}
                                            keyboardType="default"
                                            multiline
                                            numberOfLines={4}
                                            style={[styles.inputStyle, { height: 100, textAlignVertical: 'top' }]}
                                            autoCapitalize="sentences"
                                            autoCorrect={true}
                                        />
                                    )}
                                />
                                <ErrorMessage
                                    errors={errors}
                                    name="description"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Address 1</Text>
                                <Controller
                                    name="address1"
                                    control={control}
                                    rules={{
                                        required: "Address 1 is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='Enter Address 1'
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
                                    name="address1"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Address 2 (Optional)</Text>
                                <Controller
                                    name="address2"
                                    control={control}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='Enter Address 2'
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
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Upload CAC PDF (Optional for Verification)</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload PDF' onPress={pickCAC}/>
                                    </View>
                                    {CACDocument ? 
                                        <View className='flex-row items-center gap-2'>
                                            <MaterialIcons name='picture-as-pdf' size={24} color={'#F75F15'}/>
                                            <Text 
                                                style={{
                                                    fontFamily: 'HankenGrotesk_400Regular', 
                                                    color: '#000',
                                                    fontSize: 12,
                                                    maxWidth: 120
                                                }}
                                                numberOfLines={2}
                                            >
                                                {CACDocument.name}
                                            </Text>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No PDF chosen</Text>
                                    }
                                </View>
                            </View>

                            <View className='mb-6'>
                                <Text style={styles.titleStyle}>Upload NIN (Optional for Verification)</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload' onPress={pickNIN}/>
                                    </View>
                                    {NINImage ? 
                                        <View className='w-20 h-14 rounded-lg overflow-hidden'>
                                            <Image source={{uri: NINImage}} style={{width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover'}}/>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No file chosen</Text>
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {/* Fixed Update Button at Bottom */}
                <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
                    <SolidMainButton
                        onPress={handleSubmit(onSubmit)}
                        text={'Update Store'}
                    />
                </View>

                {/* Custom Modal */}
                <CustomSuccessModal 
                    visible={showComingSoonDialog} 
                    onClose={closeDialog} 
                />
            </View>
        </SafeAreaView>
    )
}

export default StoreEdit

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