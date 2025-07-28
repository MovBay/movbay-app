
import { View, Text, ActivityIndicator, Modal, Linking, Share, Platform } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeaderMany } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image } from 'react-native'
import { useGetStore } from '@/hooks/mutations/sellerAuth'
import { Pressable } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useProfile } from '@/hooks/mutations/auth'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'

// Custom Error Modal Component
const ErrorModal = ({ visible, title, message, onClose }: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 320,
          alignItems: 'center'
        }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#FEE2E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <MaterialIcons name='error-outline' size={30} color={'#DC2626'} />
          </View>
          
          <Text style={{
            fontSize: 18,
            fontFamily: 'HankenGrotesk_600SemiBold',
            textAlign: 'center',
            marginBottom: 8,
            color: '#111827'
          }}>
            {title}
          </Text>
          
          <Text style={{
            fontSize: 14,
            fontFamily: 'HankenGrotesk_400Regular',
            textAlign: 'center',
            color: '#6B7280',
            marginBottom: 24,
            lineHeight: 20
          }}>
            {message}
          </Text>
          
          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: '#F75F15',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
              width: '100%'
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontFamily: 'HankenGrotesk_600SemiBold',
              textAlign: 'center'
            }}>
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced Image Viewer Modal Component
const ImageViewerModal = ({ visible, imageUri, onClose }: {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Pressable
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
            padding: 8
          }}
          onPress={onClose}
        >
          <MaterialIcons name='close' size={24} color={'white'} />
        </Pressable>

        {imageUri && (
          <View style={{ width: '90%', height: '70%', justifyContent: 'center', alignItems: 'center' }}>
            {imageLoading && (
              <ActivityIndicator size="large" color="white" />
            )}
            
            {imageError ? (
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name='broken-image' size={60} color={'white'} />
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontFamily: 'HankenGrotesk_400Regular',
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  Failed to load image
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                resizeMode="contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

// Document Options Modal Component
const DocumentOptionsModal = ({ visible, onClose, onOpenExternal, onShare }: {
  visible: boolean;
  onClose: () => void;
  onOpenExternal: () => void;
  onShare: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 34,
          paddingTop: 20,
          paddingHorizontal: 20
        }}>
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: '#E5E7EB',
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 20
          }} />
          
          <Text style={{
            fontSize: 16,
            fontFamily: 'HankenGrotesk_600SemiBold',
            textAlign: 'center',
            marginBottom: 20,
            color: '#111827'
          }}>
            Open Document
          </Text>

          <Pressable
            onPress={onOpenExternal}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: '#F9FAFB',
              marginBottom: 12
            }}
          >
            <MaterialIcons name='open-in-new' size={20} color={'#F75F15'} />
            <Text style={{
              fontSize: 14,
              fontFamily: 'HankenGrotesk_500Medium',
              marginLeft: 12,
              color: '#111827'
            }}>
              Open in External App
            </Text>
          </Pressable>

          <Pressable
            onPress={onShare}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: '#F9FAFB',
              marginBottom: 20
            }}
          >
            <MaterialIcons name='share' size={20} color={'#F75F15'} />
            <Text style={{
              fontSize: 14,
              fontFamily: 'HankenGrotesk_500Medium',
              marginLeft: 12,
              color: '#111827'
            }}>
              Share Document
            </Text>
          </Pressable>


          <SolidMainButton text='Close' onPress={onClose}/>
        </View>
      </View>
    </Modal>
  );
};

const StoreProfile = () => {
  const navigation = useNavigation()
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });
  const [documentOptionsVisible, setDocumentOptionsVisible] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState<string | null>(null);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  const {storeData, isLoading} = useGetStore()
  const {profile} = useProfile()

  console.log('This is the data', storeData?.data)

  const handleRedirect = () => {
    router.push({
      pathname: '/(access)/(user_stacks)/store-edit',
      params: { storeId: storeData?.data?.id }
    })
  }

  const showError = (title: string, message: string) => {
    setErrorModalData({ title, message });
    setErrorModalVisible(true);
  };

  const handleViewCAC = () => {
    const cacUrl = storeData?.data?.cac;

    if (!cacUrl) {
      showError('No Document', 'CAC document is not available');
      return;
    }

    setCurrentDocumentUrl(cacUrl);
    setDocumentOptionsVisible(true);
  };

  const handleOpenCACExternal = async () => {
    setDocumentOptionsVisible(false);
    
    if (!currentDocumentUrl) return;

    try {
      const supported = await Linking.canOpenURL(currentDocumentUrl);
      
      if (supported) {
        await Linking.openURL(currentDocumentUrl);
      } else {
        showError(
          'Cannot Open', 
          'Unable to open the CAC document. Please check if you have a PDF viewer installed.'
        );
      }
    } catch (error) {
      console.error('Error opening CAC document:', error);
      showError('Error', 'Failed to open the CAC document');
    }
  };

  const handleShareCAC = async () => {
    setDocumentOptionsVisible(false);
    
    if (!currentDocumentUrl) return;

    try {
      if (Platform.OS === 'ios') {
        await Share.share({
          url: currentDocumentUrl,
          title: 'CAC Document'
        });
      } else {
        await Share.share({
          message: currentDocumentUrl,
          title: 'CAC Document'
        });
      }
    } catch (error) {
      console.error('Error sharing CAC document:', error);
      showError('Error', 'Failed to share the CAC document');
    }
  };

  const handleViewNIN = () => {
    const ninUrl = storeData?.data?.nin;

    if (!ninUrl) {
      showError('No Document', 'NIN document is not available');
      return;
    }

    setSelectedImageUri(ninUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUri(null);
  };

  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
      <StatusBar style='dark'/>
      <DrawerHeaderMany onPress={openDrawer}/>
      {isLoading ? 
        <View className='justify-center items-center pt-20'>
          <ActivityIndicator size={'small'} color={'green'}/>
        </View> : 
        <KeyboardAwareScrollView className='pt-5'>
          <View className=''>
            <View className='w-20 h-20 object-cover overflow-hidden m-auto flex rounded-full border-2 border-green-800 p-1'>
              <Image source={{uri: storeData?.data?.store_image}} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50}}/>
            </View>
            <Text className='text-xl text-center pt-3' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.name}</Text>
            <Text className='text-base text-center text-gray-500' style={{fontFamily: 'HankenGrotesk_400Regular'}}>{storeData?.data?.description}</Text>
            <Pressable className='flex-row items-center gap-1 p-2.5 m-auto mt-2 px-6 rounded-full bg-[#FEEEE6]' onPress={handleRedirect}>
              <MaterialIcons name='edit' size={20} color={'#A53F0E'}/>
              <Text className='text-base text-[#A53F0E]' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Edit Store</Text>
            </Pressable>
          </View>
          <View className='pt-5 flex-col gap-2'>
            <View className='p-4 border border-neutral-200 rounded-xl'>
              <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Username</Text>
              <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>@{profile?.data?.username}</Text>
            </View>
            <View className='p-4 border border-neutral-200 rounded-xl'>
              <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Phone</Text>
              <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{profile?.data?.phone_number}</Text>
            </View>
            <View className='p-4 border border-neutral-200 rounded-xl'>
              <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Address</Text>
              <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.address1}</Text>
            </View>
            <View className='p-4 border border-neutral-200 rounded-xl'>
              <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Address 2</Text>
              <Text className='text-lg pt-1' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{storeData?.data?.address2}</Text>
            </View>
            <View className='p-4 border border-neutral-200 rounded-xl'>
              <Text className='text-base text-gray-500' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Documents</Text>
              <View className='pt-2 gap-3'>
                {/* CAC Document */}
                <Pressable 
                  onPress={handleViewCAC}
                  className='flex-row items-center gap-2 p-2 rounded-lg bg-gray-50'
                  disabled={!storeData?.data?.cac}
                >
                  <MaterialIcons 
                    name='picture-as-pdf' 
                    size={24} 
                    color={storeData?.data?.cac ? '#F75F15' : '#AFAFAF'}
                  />
                  <View className='flex-1'>
                    <Text 
                      className='text-base' 
                      style={{
                        fontFamily: 'HankenGrotesk_600SemiBold',
                        color: storeData?.data?.cac ? '#000' : '#AFAFAF'
                      }}
                    >
                      CAC Document.pdf
                    </Text>
                    <Text 
                      className='text-sm' 
                      style={{
                        fontFamily: 'HankenGrotesk_400Regular',
                        color: storeData?.data?.cac ? '#6B7280' : '#AFAFAF'
                      }}
                    >
                      {storeData?.data?.cac ? 'Tap to view' : 'Not uploaded'}
                    </Text>
                  </View>
                  {storeData?.data?.cac && (
                    <MaterialIcons name='visibility' size={20} color={'#6B7280'}/>
                  )}
                </Pressable>

                {/* NIN Document */}
                <Pressable 
                  onPress={handleViewNIN}
                  className='flex-row items-center gap-2 p-2 rounded-lg bg-gray-50'
                  disabled={!storeData?.data?.nin}
                >
                  <MaterialIcons 
                    name='image' 
                    size={24} 
                    color={storeData?.data?.nin ? '#F75F15' : '#AFAFAF'}
                  />
                  <View className='flex-1'>
                    <Text 
                      className='text-base' 
                      style={{
                        fontFamily: 'HankenGrotesk_600SemiBold',
                        color: storeData?.data?.nin ? '#000' : '#AFAFAF'
                      }}
                    >
                      NIN Document.jpg
                    </Text>
                    <Text 
                      className='text-sm' 
                      style={{
                        fontFamily: 'HankenGrotesk_400Regular',
                        color: storeData?.data?.nin ? '#6B7280' : '#AFAFAF'
                      }}
                    >
                      {storeData?.data?.nin ? 'Tap to view' : 'Not uploaded'}
                    </Text>
                  </View>
                  {storeData?.data?.nin && (
                    <MaterialIcons name='visibility' size={20} color={'#6B7280'}/>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      }

      {/* Enhanced Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={closeImageViewer}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        title={errorModalData.title}
        message={errorModalData.message}
        onClose={() => setErrorModalVisible(false)}
      />

      {/* Document Options Modal */}
      <DocumentOptionsModal
        visible={documentOptionsVisible}
        onClose={() => setDocumentOptionsVisible(false)}
        onOpenExternal={handleOpenCACExternal}
        onShare={handleShareCAC}
      />
    </SafeAreaView>
  )
}

export default StoreProfile;