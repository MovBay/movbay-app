import { View, Text, TouchableOpacity, Image, Modal, StyleSheet, Pressable } from 'react-native'
import React, { useState } from 'react'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import LoadingOverlay from '@/components/LoadingOverlay'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useRiderKYC, useRiderProfile } from '@/hooks/mutations/auth'
import { useGetVerifiedStatus } from '@/hooks/mutations/ridersAuth'

// Image Preview Modal Component
const ImagePreviewModal = ({ 
  visible, 
  imageUrl, 
  onClose, 
  title 
}: { 
  visible: boolean; 
  imageUrl: string | null; 
  onClose: () => void; 
  title: string;
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.previewModalOverlay}>
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.previewCloseButton}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {imageUrl && (
            <View style={styles.previewImageContainer}>
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          )}

          <SolidLightButton text='Close' onPress={onClose}/>
        </View>
      </View>
    </Modal>
  );
};

const RiderKYC = () => {
    const { riderKYC, isLoading, refetch } = useRiderKYC()
    const {isLoading: isRiderLoading, profile} = useRiderProfile()  
    const {isRiderVerified, isLoading: isRiderVerifiedLoading} = useGetVerifiedStatus()
    const isMyAccountVerified = isRiderVerified?.data?.verified

    // console.log('Riders KYC Data:', riderKYC?.data)
    
    // Image preview states
    const [previewModal, setPreviewModal] = useState({
      visible: false,
      imageUrl: null as string | null,
      title: ''
    });
    
    // Check if KYC data exists and has values
    const kycData = riderKYC?.data
    const hasKYCData = kycData && (
      kycData.nin || 
      kycData.proof_of_address || 
      kycData.drivers_licence || 
      kycData.vehicle_type || 
      kycData.plate_number || 
      kycData.vehicle_color
    )

    const handleAddKYC = () => {
      router.push('/(access)/(rider_stacks)/kycUpdate') // Adjust route as needed
    }

    // Function to open image preview
    const openImagePreview = (imageUrl: string, title: string) => {
      setPreviewModal({
        visible: true,
        imageUrl,
        title
      });
    };

    // Function to close image preview
    const closeImagePreview = () => {
      setPreviewModal({
        visible: false,
        imageUrl: null,
        title: ''
      });
    };


  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading} />

      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View className="">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                KYC Verification
              </Text>
            </View>
          </View>

          
              

          {!hasKYCData ? (
            // Empty KYC State
            <View className="flex-1 justify-center items-center " style={{marginTop: 100}}>
              <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center mb-6">
                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
              </View>
              
              <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className="text-xl text-gray-900 mb-2 text-center">
                Complete your KYC
              </Text>
              
              <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className="text-base text-gray-500 text-center mb-8 px-4">
                You need to complete your KYC verification to start using our services
              </Text>
              
              <View className='w-[50%]'>
                <SolidMainButton 
                    text='Add KYC Documents' 
                    onPress={handleAddKYC}
                />
              </View>
            </View>
          ) : (
            // Existing KYC Data Display
            <>
            <View className="flex-row items-center mt-6 ">
              {/* <Pressable
                onPress={() => router.push("/(access)/(rider_tabs)/riderProfile")}
                className="flex w-14 h-14 mr-2 rounded-full justify-center items-center overflow-hidden relative"
              >
                {profile?.data?.profile_picture === null ? (
                  <MaterialIcons name="person-4" size={35} color={"gray"} style={{padding: 3}}/>
                ) : (
                  <Image
                    source={{ uri: profile?.data?.profile_picture }}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                )}
              </Pressable>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <View>
                    <View className="flex-row items-center">
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-black font-semibold text-base"
                      >
                        {profile?.data?.fullname}
                      </Text>
                      {!isMyAccountVerified && !isRiderVerifiedLoading ? (
                        <View className="">
                          <MaterialIcons name="error-outline" size={14} color="red" style={{ marginLeft: 2 }} />
                        </View>
                      ): 
                        <View className="">
                          <MaterialIcons name="verified" size={14} color="green" style={{ marginLeft: 2 }} />
                        </View>
                      }
                    </View>
                    <Text
                      style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 12 }}
                      className="text-gray-500 font-semibold mr-2"
                    >
                      @{profile?.data?.username}
                    </Text>
                  </View>
                </View>
              </View> */}
        
            </View>
            
            {!isMyAccountVerified === true && (
              <View className='bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4'>
                <Text className='text-sm text-yellow-600 text-center'>Your account has not been verified</Text>
              </View>
            )}
              {/* KYC Documents Section */}
              <View className="mt-6 space-y-4">
                {/* Valid ID/NIN */}
                {kycData?.nin_url && (
                  <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="document-text-outline" size={24} color="#666" />
                      <View>
                        <View className="flex-row items-center gap-2">
                          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-900">Valid ID/NIN</Text>
                        </View>
                        <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm text-gray-500">Document</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="p-2"
                      onPress={() => openImagePreview(kycData.nin_url, 'Valid ID/NIN')}
                    >
                      <Ionicons name="eye-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Proof of Address */}
                {kycData?.poa_url && (
                  <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="document-text-outline" size={24} color="#666" />
                      <View>
                        <View className="flex-row items-center gap-2">
                          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-medium text-gray-900">Proof of Address</Text>
                        </View>
                        <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm text-gray-500">Document</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="p-2"
                      onPress={() => openImagePreview(kycData.poa_url, 'Proof of Address')}
                    >
                      <Ionicons name="eye-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Vehicle Details Section */}
              {(kycData?.drivers_licence_url || kycData?.vehicle_type || kycData?.plate_number || kycData?.vehicle_color) && (
                <View className="mt-8">
                  <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-lg font-semibold text-gray-900 mb-4">Vehicle details</Text>
                  
                  {/* Driver's License */}
                  {kycData?.drivers_licence_url && (
                    <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="document-text-outline" size={24} color="#666" />
                        <View>
                          <View className="flex-row items-center gap-2">
                            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-900">Driver's License</Text>
                          </View>
                          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm text-gray-500">Document</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        className="p-2"
                        onPress={() => openImagePreview(kycData.drivers_licence_url, "Driver's License")}
                      >
                        <Ionicons name="eye-outline" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Vehicle Type */}
                  {kycData?.vehicle_type && (
                    <View className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-600 mb-1">Vehicle Type</Text>
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base text-gray-900 capitalize">{kycData.vehicle_type}</Text>
                    </View>
                  )}

                  {/* Plate Number */}
                  {kycData?.plate_number && (
                    <View className="p-4 bg-gray-50 rounded-lg mb-4">
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-600 mb-1">Plate Number</Text>
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-bold text-gray-900 uppercase">{kycData.plate_number}</Text>
                    </View>
                  )}

                  {/* Vehicle Color */}
                  {kycData?.vehicle_color && (
                    <View className="p-4 bg-gray-50 rounded-lg mb-8">
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-600 mb-1">Vehicle Color</Text>
                      <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-bold text-gray-900 capitalize">{kycData.vehicle_color}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Complete KYC Button */}

            
              
              <SolidMainButton text='Update KYC' onPress={handleAddKYC}/>
              {/* <SolidMainButton text='Refresh' onPress={handleRefresh}/> */}
            </>
          )}
        </KeyboardAwareScrollView>
      </View>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModal.visible}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        onClose={closeImagePreview}
      />
    </SafeAreaView>
  )
}

export default RiderKYC

const styles = StyleSheet.create({
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk_600SemiBold',
    color: '#333',
  },
  previewCloseButton: {
    padding: 4,
  },
  previewImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  previewCloseTextButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 50,
    alignItems: 'center',
  },
  previewCloseText: {
    fontSize: 16,
    fontFamily: 'HankenGrotesk_500Medium',
    color: '#333',
  },
});