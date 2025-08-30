import { View, Text, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import LoadingOverlay from '@/components/LoadingOverlay'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useRiderKYC } from '@/hooks/mutations/auth'

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
    const { riderKYC, isLoading } = useRiderKYC()
    console.log('Riders KYC Data:', riderKYC?.data)
    
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
      // Navigate to KYC form or handle KYC addition
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

    // Helper function to get verification status
    const getVerificationStatus = (field: string) => {
      // You can customize this based on your API response structure
      // For now, showing different statuses for demonstration
      if (field === 'nin') {
        return { label: 'Verified', color: 'green-600', bgColor: 'green-100', textColor: 'green-800' };
      } else if (field === 'proof_of_address') {
        return { label: 'Pending', color: 'orange-400', bgColor: 'orange-50', textColor: 'orange-700' };
      } else {
        return { label: 'Verified', color: 'green-600', bgColor: 'green-100', textColor: 'green-800' };
      }
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
              {/* KYC Documents Section */}
              <View className="mt-8 space-y-4">
                {/* Valid ID/NIN */}
                {kycData?.nin_url && (
                  <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="document-text-outline" size={24} color="#666" />
                      <View>
                        <View className="flex-row items-center gap-2">
                          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm font-medium text-gray-900">Valid ID/NIN</Text>
                          {(() => {
                            const status = getVerificationStatus('nin');
                            return (
                              <View className={`border border-${status.color} bg-${status.bgColor} px-2 py-1 rounded-full`}>
                                <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className={`text-${status.textColor} text-xs`}>{status.label}</Text>
                              </View>
                            );
                          })()}
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
                          {(() => {
                            const status = getVerificationStatus('proof_of_address');
                            return (
                              <View className={`border border-${status.color} bg-${status.bgColor} px-2 py-1 rounded-full`}>
                                <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className={`text-${status.textColor} text-xs`}>{status.label}</Text>
                              </View>
                            );
                          })()}
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
              {(kycData?.drivers_licence || kycData?.vehicle_type || kycData?.plate_number || kycData?.vehicle_color) && (
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
                            {(() => {
                              const status = getVerificationStatus('drivers_licence');
                              return (
                                <View className={`border border-${status.color} bg-${status.bgColor} px-2 py-1 rounded-full`}>
                                  <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className={`text-${status.textColor} text-xs`}>{status.label}</Text>
                                </View>
                              );
                            })()}
                          </View>
                          <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-sm text-gray-500">Document</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        className="p-2"
                        onPress={() => openImagePreview(kycData.drivers_licence, "Driver's License")}
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