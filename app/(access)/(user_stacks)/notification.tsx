import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useDeleteNotification, useGetNotification } from '@/hooks/mutations/sellerAuth'
import { OnboardArrowHeader } from '@/components/btns/OnboardHeader'
import { router } from 'expo-router'
import { Toast } from 'react-native-toast-notifications'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import LoadingOverlay from '@/components/LoadingOverlay'


const Notification = () => {
    const [refreshing, setRefreshing] = useState(false)

    const {getNotification, isLoading, refetch} = useGetNotification()
    const myNotification = getNotification?.data?.data
    // console.log('Notification', myNotification)

    const [showDialog, setShowDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
    const handlePress = () => {
      setShowDialog(true);
    };
  
    const closeDialog = () => {
      setShowDialog(false);
    };
  
    const { mutate: deleteNotification, isPending } = useDeleteNotification(selectedItem?.id)
    
    const handleDeleteNotification = async () => {
      try {
        closeDialog()
        await deleteNotification(selectedItem?.id, {
          onSuccess: (res) => {
            setSelectedItem(null)
            Toast.show('Notification Deleted Successfully', {type: 'success'})
            
            refetch()
            console.log('Notification deleted successfully:', res)
          },

        onError: (error) => {
            console.error('Error deleting Notification:', error)
          }
        })
      
      } catch (error) {
        console.error("Error deleting Notification:", error)
      }
    }

    const onRefresh = () => {
      setRefreshing(true)
      refetch()
      setRefreshing(false)
    }



  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading || isPending}/>
      
      {/* Header */}
      <View className="px-5 py-4 pb-0 border-b border-gray-100">
        <View className="flex-row items-center">
          <View>
            <OnboardArrowHeader onPressBtn={()=>router.back()}/>
          </View>
        </View>
      </View>

        <Text
          style={{ fontFamily: "HankenGrotesk_500Medium" }}
          className="text-xl font-bold text-neutral-900 px-5 pt-5"
        >
          Notifications
        </Text>

      {/* Notifications List */}
      {myNotification && myNotification?.length > 0 ? (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="px-5 py-2">
            {myNotification && myNotification.map((notification: any) => {
              return (
                <TouchableOpacity
                  key={notification.id}
                  className='mb-3 p-4 rounded-2xl border bg-gray-50 border-gray-100'
                >
                  <View className="flex-row items-start">
                    {/* Icon */}
                    <View 
                      className="w-12 h-12 rounded-full items-center bg-orange-100 justify-center mr-3"
                    >
                      <Ionicons 
                        name={'notifications'} 
                        size={24} 
                        color={'#F59E0B'} 
                      />
                    </View>
                    
                    {/* Content */}
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          style={{ fontFamily: "HankenGrotesk_700Bold" }}
                          className="text-base font-semibold text-green-900"
                        >
                          {notification.title}
                        </Text>
                      </View>
                      
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-sm mb-2 text-neutral-600"
                      >
                        {notification.message}
                      </Text>
                      
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-xs text-neutral-400"
                      >
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    
                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={()=>{setSelectedItem(notification); handlePress()}}
                      className="p-2 rounded-full h-fit bg-red-50"
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
          
          {/* Bottom padding */}
          <View className="h-20" />
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-gray-100 w-24 h-24 rounded-full items-center justify-center mb-6">
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
          </View>
          
          <Text
            style={{ fontFamily: "HankenGrotesk_500Medium" }}
            className="text-xl font-bold text-neutral-900 mb-3 text-center"
          >
            No Notifications Yet
          </Text>
          
          <Text
            style={{ fontFamily: "HankenGrotesk_500Medium" }}
            className="text-neutral-600 text-center text-base leading-6 mb-8"
          >
            You're all caught up! Notifications about your rides, payments, and updates will appear here.
          </Text>
        </View>
      )}


      <Modal
          visible={showDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={closeDialog}
        >
          <View className='flex-1 justify-center items-center bg-black/50'>
            <View className='bg-white rounded-2xl p-8 mx-6 w-[90%]'>
              <View className='items-center justify-center m-auto rounded-full p-5 bg-neutral-100 w-fit mb-5'>
                <Ionicons name="trash-sharp" size={30} color={'gray'}/>
              </View>
              <Text className='text-xl text-center mb-2' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>
                Delete Notification
              </Text>
              <Text className='text-neutral-500 text-center mb-6 w-[90%] m-auto text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Are you sure you want to proceed?
              </Text>

              <View className='flex-row items-center justify-between'>
                <View className='w-[49%]'>
                  <SolidLightButton onPress={closeDialog} text='No'/>
                </View>

                <View className='w-[49%]'>
                  <SolidMainButton onPress={handleDeleteNotification} text='Yes'/>
                </View>
              </View>
            </View>
          </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Notification