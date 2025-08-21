import { View, Text, Image, FlatList, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router';
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
import { useCreateStore } from '@/hooks/mutations/sellerAuth';
import { Alert } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// Expanded store categories
const storeCategories = [
    { label: "Everything", value: "everything" },
    { label: "Fashion & Clothing", value: "fashion" },
    { label: "Electronics & Gadgets", value: "electronics" },
    { label: "Beauty & Personal Care", value: "beauty" },
    { label: "Automotive & Cars", value: "car" },
    { label: "Sports & Fitness", value: "sport" },
    { label: "Shoes & Footwear", value: "shoes" },
    { label: "Bags & Luggage", value: "bags" },
    { label: "Home & Garden", value: "home_garden" },
    { label: "Books & Education", value: "books_education" },
    { label: "Health & Wellness", value: "health_wellness" },
    { label: "Food & Beverages", value: "food_beverages" },
    { label: "Baby & Kids", value: "baby_kids" },
    { label: "Jewelry & Accessories", value: "jewelry_accessories" },
    { label: "Art & Crafts", value: "art_crafts" },
    { label: "Pet Supplies", value: "pet_supplies" },
    { label: "Musical Instruments", value: "musical_instruments" },
    { label: "Office & Business", value: "office_business" },
    { label: "Travel & Outdoor", value: "travel_outdoor" },
    { label: "Gaming & Entertainment", value: "gaming_entertainment" },
    { label: "Tools & Hardware", value: "tools_hardware" },
    { label: "Toys & Games", value: "toys_games" },
    { label: "Photography & Video", value: "photography_video" },
    { label: "Furniture & Decor", value: "furniture_decor" },
    { label: "Other", value: "other" },
];

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
                        Store Created Successfully!
                    </Text>
                    <Text style={styles.modalDescription}>
                        You can now list products, promote your store, and receive orders.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <SolidMainButton 
                            text='Go to Seller Dashboard' 
                            onPress={() => {
                                onClose();
                                router.push('/(access)/(user_tabs)/(drawer)/sell');
                            }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

// Address Prediction Item Component
const AddressPredictionItem = ({ item, onPress }: { item: any; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.predictionItem}>
        <MaterialIcons name="location-on" size={20} color="#666" style={styles.locationIcon} />
        <View style={styles.predictionTextContainer}>
            <Text style={styles.predictionMainText}>{item.structured_formatting?.main_text || item.description}</Text>
            {item.structured_formatting?.secondary_text && (
                <Text style={styles.predictionSecondaryText}>{item.structured_formatting.secondary_text}</Text>
            )}
        </View>
    </TouchableOpacity>
);

const StoreCreate = () => {
    const [image, setImage] = useState<string | null>(null);
    const [CACDocument, setCACDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [NINImage, setNINImage] = useState<string | null>(null);
    
    // Address prediction states
    const [addressPredictions, setAddressPredictions] = useState<any[]>([]);
    const [showAddressPredictions, setShowAddressPredictions] = useState(false);
    const [address1Input, setAddress1Input] = useState('');
    const [address2Input, setAddress2Input] = useState('');

    const toast = useToast()

    const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
    const closeDialog = () => {
        setShowComingSoonDialog(false);
    };

    const { mutate, isPending } = useCreateStore()

    const fetchAddressPredictions = async (input: string) => {
        if (input.length < 3) {
            setAddressPredictions([])
            setShowAddressPredictions(false)
            return
        }
        if (!GOOGLE_PLACES_API_KEY) {
            console.error("Google Places API Key is not set.")
            return
        }
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    input,
                )}&key=${GOOGLE_PLACES_API_KEY}&types=address&components=country:ng`, // Restrict to Nigeria
            )

            const data = await response.json()

            if (data.predictions) {
                setAddressPredictions(data.predictions)
                setShowAddressPredictions(true)
            }
        } catch (error) {
            console.error("Error fetching address predictions:", error)
        }
    }

    const handleAddressSelection = (prediction: any, isAddress1: boolean) => {
        const selectedAddress = prediction.description;
        if (isAddress1) {
            setAddress1Input(selectedAddress);
            setValue('address1', selectedAddress);
        } else {
            setAddress2Input(selectedAddress);
            setValue('address2', selectedAddress);
        }
        setShowAddressPredictions(false);
        setAddressPredictions([]);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 4],
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
        if (image) {
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

                if(error?.response?.data?.address1){
                    toast.show('Address1 is needed', {type: 'danger'})
                }

                if(error?.response?.data?.address2){
                    toast.show('Address2 is needed', {type: 'danger'})
                }

                else if(error?.response?.data?.nin){
                    toast.show('No NIN Document submitted', {type: 'danger'})
                }
            }
        });
    };

    // Render address predictions using map instead of FlatList
    const renderAddressPredictions = () => {
        if (!showAddressPredictions || addressPredictions.length === 0) {
            return null;
        }

        return (
            <View style={styles.predictionsContainer}>
                <ScrollView 
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                >
                    {addressPredictions.map((item) => (
                        <AddressPredictionItem
                            key={item.place_id}
                            item={item}
                            onPress={() => handleAddressSelection(item, address1Input.length >= 3)}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    };

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
                    keyboardShouldPersistTaps="handled"
                >
                    <View className=''>
                        <View className='flex-row items-center gap-2'>
                            <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
                        </View>

                        <View className='pt-3'>
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Create Store</Text>
                            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Start selling in minutes. Create a store and reach thousands of buyers nearby.</Text>
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
                            <View className='mb-5'>
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

                            <View className='mb-5'>
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
                                                items={storeCategories}
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

                            <View className='mb-5'>
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

                            {/* Address 1 with Google Places Autocomplete */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Address</Text>
                                <View style={styles.addressContainer}>
                                    <Controller
                                        name="address1"
                                        control={control}
                                        rules={{
                                            required: "Address is required",
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='Enter Address:'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={(text) => {
                                                    onChange(text);
                                                    setAddress1Input(text);
                                                    fetchAddressPredictions(text);
                                                }}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="default"
                                                style={styles.inputStyle}
                                                autoCapitalize="words"
                                                autoCorrect={false}
                                                onFocus={() => {
                                                    if (address1Input.length >= 3) {
                                                        setShowAddressPredictions(true);
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                    {renderAddressPredictions()}
                                </View>

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

                            {/* Address 2 with Google Places Autocomplete */}
                            {/* <View className='mb-5'>
                                <Text style={styles.titleStyle}>Address 2 (Optional)</Text>
                                <View style={styles.addressContainer}>
                                    <Controller
                                        name="address2"
                                        control={control}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='Enter Address 2'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={(text) => {
                                                    onChange(text);
                                                    setAddress2Input(text);
                                                    fetchAddressPredictions(text);
                                                }}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="default"
                                                style={styles.inputStyle}
                                                autoCapitalize="words"
                                                autoCorrect={false}
                                                onFocus={() => {
                                                    if (address2Input.length >= 3) {
                                                        setShowAddressPredictions(true);
                                                    }
                                                }}
                                            />
                                        )}
                                    />

                                </View>
                            </View> */}

                            <View className='mb-5 pt-2'>
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

                            <View className='mb-5'>
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

                {/* Fixed Create Button at Bottom */}
                <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
                    <SolidMainButton
                        onPress={handleSubmit(onSubmit)}
                        text={'Create Store'}
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

export default StoreCreate

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

    // Address container for autocomplete
    addressContainer: {
        // position: 'relative',
        // zIndex: 1000,
    },

    // Address predictions styles
    predictionsContainer: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 7,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        maxHeight: 200,
        zIndex: 1500,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    predictionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',

    },

    locationIcon: {
        marginRight: 12,
    },

    predictionTextContainer: {
        flex: 1,
    },

    predictionMainText: {
        fontSize: 14,
        fontFamily: 'HankenGrotesk_500Medium',
        color: '#000',
        marginBottom: 2,
    },

    predictionSecondaryText: {
        fontSize: 12,
        fontFamily: 'HankenGrotesk_400Regular',
        color: '#666',
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
        borderRadius: '50%',
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
        width: '90%',
        alignSelf: 'center',
        marginTop: 24,
    },
});