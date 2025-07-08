import { View, Text, Image } from 'react-native'
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
import { TextInput, ScrollView, Switch } from 'react-native';
import { ErrorMessage } from '@hookform/error-message';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import RNPickerSelect from "react-native-picker-select";
import { useCreateProduct } from '@/hooks/mutations/sellerAuth';
import { Alert } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

// Custom Success Modal Component
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
                        Product Created Successfully!
                    </Text>
                    <Text style={styles.modalDescription}>
                        Your product has been listed and is now available for buyers to discover.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <SolidMainButton 
                            text='Go to My Products' 
                            onPress={() => {
                                onClose();
                                router.push('/(access)/(user_tabs)/(drawer)/products');
                            }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

// Toggle Switch Component
const ToggleSwitch = ({ value, onValueChange, label }: { value: boolean; onValueChange: (value: boolean) => void; label: string }) => (
    <View className='flex-row items-center justify-between py-3'>
        <Text style={styles.titleStyle}>{label}</Text>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#F75F15' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
        />
    </View>
);

// Image Grid Component for Product Images
const ProductImageGrid = ({ images, onAddImage, onRemoveImage }: { 
    images: string[]; 
    onAddImage: () => void; 
    onRemoveImage: (index: number) => void; 
}) => (
    <View className=''>
        <Text style={styles.titleStyle}>Product Images (Max 4)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mt-2'>
            <View className='flex-row gap-3'>
                {/* Add Image Button */}
                {images.length < 4 && (
                    <Pressable 
                        onPress={onAddImage}
                        className='w-20 h-20 bg-gray-200 rounded-lg items-center justify-center border-2 border-dashed border-gray-300'
                    >
                        <MaterialIcons name='add-photo-alternate' size={30} color='#AFAFAF' />
                        <Text className='text-xs text-gray-500 mt-1' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
                            Add Photo
                        </Text>
                    </Pressable>
                )}
                
                {/* Display Selected Images */}
                {images.map((image, index) => (
                    <View key={index} className='relative'>
                        <View className='w-20 h-20 overflow-hidden rounded-lg border border-neutral-300'>
                            <Image 
                                source={{uri: image}} 
                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            />
                        </View>
                        <Pressable 
                            onPress={() => onRemoveImage(index)}
                            className='absolute top-1 -right-3 bg-red-500 rounded-full p-1'
                        >
                            <MaterialIcons name='close' size={14} color='white' />
                        </Pressable>
                    </View>
                ))}
            </View>
        </ScrollView>
        <Text className='text-xs text-gray-500 mt-2' style={{fontFamily: 'HankenGrotesk_400Regular'}}>
            {images.length}/4 images selected
        </Text>
    </View>
);

const ProductCreate = () => {
    const [productImages, setProductImages] = useState<string[]>([]);
    const [productVideo, setProductVideo] = useState<string | null>(null);
    const [pickupAvailable, setPickupAvailable] = useState(false);
    const [deliveryAvailable, setDeliveryAvailable] = useState(false);
    const [autoPostToStory, setAutoPostToStory] = useState(false);

    const toast = useToast();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { mutate, isPending } = useCreateProduct();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch
    } = useForm({
        defaultValues: {
            title: "",
            category: "",
            brand: "",
            description: "",
            original_price: "",
            discounted_price: "",
            condition: "",
            stock_available: "",
            size: "",
            delivery_type: "",
        },
    });

    const watchedDeliveryAvailable = deliveryAvailable;

    const pickProductImages = async () => {
        const remainingSlots = 4 - productImages.length;
        if (remainingSlots <= 0) {
            toast.show('Maximum 4 images allowed', { type: 'warning' });
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
            selectionLimit: remainingSlots,
        });

        if (!result.canceled && result.assets) {
            const newImageUris = result.assets.map(asset => asset.uri);
            setProductImages(prev => [...prev, ...newImageUris]);
            const count = newImageUris.length;
            toast.show(`${count} image${count > 1 ? 's' : ''} added successfully`, { 
                type: 'success' 
            });
        }
    };

    const removeProductImage = (index: number) => {
        setProductImages(prev => prev.filter((_, i) => i !== index));
    };

const pickProductVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
        const videoAsset = result.assets[0];
        const videoSizeInBytes = videoAsset.fileSize;
        
        // Check if fileSize exists and convert to MB
        if (videoSizeInBytes) {
            const videoSizeInMB = videoSizeInBytes / (1024 * 1024);
            
            if (videoSizeInMB > 10) {
                toast.show('Video size must be less than 10MB. Please select a smaller video.', { 
                    type: 'danger' 
                });
                return;
            }
        }
        
        setProductVideo(videoAsset.uri);
        toast.show('Video added successfully', { type: 'success' });
    }
};

    const onSubmit = (data: any) => {
        if (productImages.length === 0) {
            toast.show('Please add at least one product image', { type: 'danger' });
            return;
        }
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] && data[key] !== "") {
                formData.append(key, data[key]);
            }
        });

        formData.append('pickup_available', pickupAvailable.toString());
        formData.append('delivery_available', deliveryAvailable.toString());
        formData.append('auto_post_to_story', autoPostToStory.toString());

        productImages.forEach((imageUri, index) => {
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';
            
            const imageFile = {
                uri: imageUri,
                name: filename || `image_${index}`,
                type,
            } as any;
            
            // Append to both fields to match the payload structure
            formData.append('images', imageFile);
            formData.append('product_images', imageFile);
        });

        // Add product video if selected
        if (productVideo) {
            const filename = productVideo.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `video/${match[1]}` : 'video';
            
            formData.append('product_video', {
                uri: productVideo,
                name: filename || 'video',
                type,
            } as any);
        }

        // Submit the form
        mutate(formData, {
            onSuccess: (response) => {
                setShowSuccessModal(true);
                console.log('Product created successfully:', response);
                // Reset form
                reset();
                setProductImages([]);
                setProductVideo(null);
                setPickupAvailable(false);
                setDeliveryAvailable(false);
                setAutoPostToStory(false);
            },
            onError: (error: any) => {
                console.log('Error creating product:', error?.response?.data);
                if (error?.response?.data?.message) {
                    toast.show(error.response.data.message, { type: 'danger' });
                } 

                if(error?.response?.data?.title){
                    toast.show(error?.response?.data?.title, {type: 'danger'})
                }
                
                else {
                    toast.show('Failed to create product. Please try again.', { type: 'danger' });
                }
            }
        });
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
                        paddingTop: 2, 
                        paddingBottom: 20
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className=''>
                        <View className='flex-row items-center gap-2'>
                            <OnboardArrowTextHeader onPressBtn={()=>router.back()}/>
                        </View>

                        <View className='pt-3'>
                            <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Create Product</Text>
                            <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>List your product and start selling to thousands of buyers.</Text>
                        </View>

                        

                        <View className='mt-6 flex-col'>
                           <Text className='text-xl pt-4 pb-3' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Basic Info</Text>

                            {/* Product Title */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Product Title</Text>
                                <Controller
                                    name="title"
                                    control={control}
                                    rules={{
                                        required: "Product title is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='E.g - iPhone 13 Pro Max'
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
                                    name="title"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>

                            {/* Category */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Category</Text>
                                <Controller
                                    name="category"
                                    control={control}
                                    rules={{
                                        required: "Category is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className='relative'>
                                            <RNPickerSelect
                                                onValueChange={(itemValue) => onChange(itemValue)}
                                                value={value}
                                                items={[
                                                    { label: "Electronics", value: "electronics" },
                                                    { label: "Fashion", value: "fashion" },
                                                    { label: "Beauty", value: "beauty" },
                                                    { label: "Car", value: "car" },
                                                    { label: "Sport", value: "sport" },
                                                    { label: "Shoes", value: "shoes" },
                                                    { label: "Bags", value: "bags" },
                                                    { label: "Home & Garden", value: "home_garden" },
                                                    { label: "Books", value: "books" },
                                                    { label: "Other", value: "other" },
                                                ]}
                                                placeholder={{
                                                    label: "Select a Category",
                                                    value: "",
                                                }}
                                                style={pickerSelectStyles}
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

                            {/* Brand */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Brand (Optional)</Text>
                                <Controller
                                    name="brand"
                                    control={control}
                                    rules={{
                                        required: "Brand is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='E.g - Apple, Samsung, Nike'
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
                                    name="brand"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>
                            
                            {/* Condition */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Product Condition</Text>
                                <Controller
                                    name="condition"
                                    control={control}
                                    rules={{
                                        required: "Condition is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <View className='relative'>
                                            <RNPickerSelect
                                                onValueChange={(itemValue) => onChange(itemValue)}
                                                value={value}
                                                items={[
                                                    { label: "New", value: "New" },
                                                    { label: "Used", value: "Used" },
                                                    { label: "Refurbished", value: "Refurbished" },
                                                ]}
                                                placeholder={{
                                                    label: "Select Condition",
                                                    value: "",
                                                }}
                                                style={pickerSelectStyles}
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
                                    name="condition"
                                    render={({ message }) => (
                                        <Text className="pl-2 pt-3 text-sm text-red-600">
                                            {message}
                                        </Text>
                                    )}
                                />
                            </View>


                            {/* Description */}
                            <View className='mb-5'>
                                <Text style={styles.titleStyle}>Description</Text>
                                <Controller
                                    name="description"
                                    control={control}
                                    rules={{
                                        required: "Description is required",
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput 
                                            placeholder='Describe your product in detail'
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

                            
                           <Text className='text-xl pt-4 pb-3 border-t border-neutral-200' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Pricing & Stock</Text>

                            {/* Pricing */}
                            <View className='flex-row gap-3 mb-5'>
                                <View className='flex-1'>
                                    <Text style={styles.titleStyle}>Original Price (₦)</Text>
                                    <Controller
                                        name="original_price"
                                        control={control}
                                        rules={{
                                            required: "Original price is required",
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='e.g. 7,500'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="number-pad"
                                                style={styles.inputStyle}
                                            />
                                        )}
                                    />
                                    <ErrorMessage
                                        errors={errors}
                                        name="original_price"
                                        render={({ message }) => (
                                            <Text className="pl-2 pt-3 text-sm text-red-600">
                                                {message}
                                            </Text>
                                        )}
                                    />
                                </View>

                                <View className='flex-1'>
                                    <Text style={styles.titleStyle}>Discounted Price (₦)</Text>
                                    <Controller
                                        name="discounted_price"
                                        control={control}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='e.g. 6,500'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="number-pad"
                                                style={styles.inputStyle}
                                            />
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Stock & Size */}
                            <View className='flex-row gap-3 mb-5'>
                                <View className='flex-1'>
                                    <Text style={styles.titleStyle}>Stock Available</Text>
                                    <Controller
                                        name="stock_available"
                                        control={control}
                                        rules={{
                                            required: "Stock quantity is required",
                                        }}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='e.g. 20'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="number-pad"
                                                style={styles.inputStyle}
                                            />
                                        )}
                                    />
                                    <ErrorMessage
                                        errors={errors}
                                        name="stock_available"
                                        render={({ message }) => (
                                            <Text className="pl-2 pt-3 text-sm text-red-600">
                                                {message}
                                            </Text>
                                        )}
                                    />
                                </View>

                                <View className='flex-1'>
                                    <Text style={styles.titleStyle}>Size (Optional)</Text>
                                    <Controller
                                        name="size"
                                        control={control}
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput 
                                                placeholder='E.g - XL, S, L'
                                                placeholderTextColor={"#AFAFAF"}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                value={value}
                                                keyboardType="default"
                                                style={styles.inputStyle}
                                            />
                                        )}
                                    />
                                </View>
                            </View>

                           
                           <Text className='text-xl pt-4 pb-3 border-t border-neutral-200' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Product Media</Text>
                            {/* Product Images Section */}
                            <ProductImageGrid 
                                images={productImages}
                                onAddImage={pickProductImages}
                                onRemoveImage={removeProductImage}
                            />

                            {/* Product Video Section */}
                            <View className='my-6'>
                                <Text style={styles.titleStyle}>Product Video (Optional)</Text>
                                <View className='flex-row gap-3 items-center mt-2'>
                                    <View className='w-[40%]'>
                                        <SolidLightButton text='Upload Video' onPress={pickProductVideo}/>
                                    </View>

                                    {productVideo ? 
                                        <View className='flex-row items-center gap-2'>
                                            <MaterialIcons name='videocam' size={24} color={'#F75F15'}/>
                                            <Text 
                                                style={{
                                                    fontFamily: 'HankenGrotesk_400Regular', 
                                                    color: '#000',
                                                    fontSize: 12,
                                                    maxWidth: 120
                                                }}
                                                numberOfLines={2}
                                            >
                                                Video Selected
                                            </Text>
                                        </View> :
                                        <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: '#AFAFAF'}}>No video chosen</Text>
                                    }
                                </View>
                            </View>

                             {/* Toggle Switches */}
                            <View className='mb-5 border-t border-gray-200 pt-4'>
                                <Text className='text-lg mb-3' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Availability Options</Text>
                                
                                <ToggleSwitch 
                                    value={pickupAvailable}
                                    onValueChange={setPickupAvailable}
                                    label="Pickup Available"
                                />
                                
                                <ToggleSwitch 
                                    value={deliveryAvailable}
                                    onValueChange={setDeliveryAvailable}
                                    label="Delivery Available"
                                />

                                {/* Delivery Type - Only show if delivery is available */}
                                {watchedDeliveryAvailable && (
                                    <View className='mb-5 ml-4'>
                                        <Text style={styles.titleStyle}>Delivery Type</Text>
                                        <Controller
                                            name="delivery_type"
                                            control={control}
                                            rules={{
                                                required: deliveryAvailable ? "Delivery type is required when delivery is available" : false,
                                            }}
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <View className='relative'>
                                                    <RNPickerSelect
                                                        onValueChange={(itemValue) => onChange(itemValue)}
                                                        value={value}
                                                        items={[
                                                            { label: "Movebay Express", value: "Movbay_Express" },
                                                            { label: "Speedy Dispatch", value: "Speedy_Dispatch" },
                                                            { label: "Pickup Hub", value: "Pickup_Hub" },
                                                        ]}
                                                        placeholder={{
                                                            label: "Select Delivery Type",
                                                            value: "",
                                                        }}
                                                        style={pickerSelectStyles}
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
                                            name="delivery_type"
                                            render={({ message }) => (
                                                <Text className="pl-2 pt-3 text-sm text-red-600">
                                                    {message}
                                                </Text>
                                            )}
                                        />
                                    </View>
                                )}
                                
                                <ToggleSwitch 
                                    value={autoPostToStory}
                                    onValueChange={setAutoPostToStory}
                                    label="Auto Post to Story"
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {/* Fixed Create Button at Bottom */}
                <View className='px-7 pb-4 pt-2 bg-white border-t border-gray-100'>
                    <SolidMainButton
                        onPress={handleSubmit(onSubmit)}
                        text={'Create Product'}
                    />
                </View>

                {/* Success Modal */}
                <CustomSuccessModal 
                    visible={showSuccessModal} 
                    onClose={() => setShowSuccessModal(false)} 
                />
            </View>
        </SafeAreaView>
    )
}

export default ProductCreate

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

const pickerSelectStyles = {
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
};