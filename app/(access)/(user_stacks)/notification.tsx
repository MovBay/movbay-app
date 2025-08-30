import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "New Ride Request",
    message: "You have a new delivery request from Downtown Store to Ikeja",
    type: "ride_request",
    timestamp: "2 minutes ago",
    isRead: false,
    icon: "bicycle"
  },
  {
    id: 2,
    title: "Ride Completed",
    message: "Great job! You've successfully completed a delivery to Victoria Island",
    type: "ride_completed",
    timestamp: "1 hour ago",
    isRead: true,
    icon: "checkmark-circle"
  },
  {
    id: 3,
    title: "Payment Received",
    message: "₦2,500 has been added to your wallet for completed deliveries",
    type: "payment",
    timestamp: "3 hours ago",
    isRead: false,
    icon: "wallet"
  },
  {
    id: 4,
    title: "Weekly Summary",
    message: "You completed 15 deliveries this week and earned ₦18,750",
    type: "summary",
    timestamp: "1 day ago",
    isRead: true,
    icon: "stats-chart"
  },
  {
    id: 5,
    title: "Profile Update Required",
    message: "Please update your vehicle information to continue receiving rides",
    type: "profile_update",
    timestamp: "2 days ago",
    isRead: false,
    icon: "person-circle"
  }
]

const Notification = () => {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [refreshing, setRefreshing] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_request':
        return { name: 'bicycle', color: '#3B82F6', bgColor: '#DBEAFE' }
      case 'ride_completed':
        return { name: 'checkmark-circle', color: '#10B981', bgColor: '#D1FAE5' }
      case 'payment':
        return { name: 'wallet', color: '#F59E0B', bgColor: '#FEF3C7' }
      case 'summary':
        return { name: 'stats-chart', color: '#8B5CF6', bgColor: '#EDE9FE' }
      case 'profile_update':
        return { name: 'person-circle', color: '#EF4444', bgColor: '#FEE2E2' }
      default:
        return { name: 'notifications', color: '#6B7280', bgColor: '#F3F4F6' }
    }
  }

  const handleDeleteNotification = (id: number, title: string) => {
    Alert.alert(
      "Delete Notification",
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setNotifications(prev => prev.filter(notification => notification.id !== id))
          }
        }
      ]
    )
  }



  const deleteAllNotifications = () => {
    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            setNotifications([])
          }
        }
      ]
    )
  }

  const onRefresh = () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
      // You can add logic here to fetch new notifications
    }, 2000)
  }



  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-xl font-bold text-neutral-900"
            >
              Notifications
            </Text>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-sm text-neutral-600"
            >
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={deleteAllNotifications}
              className="bg-red-50 px-3 py-2 rounded-full"
            >
              <MaterialIcons name="delete-sweep" size={16} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="px-5 py-2">
            {notifications.map((notification) => {
              const iconConfig = getNotificationIcon(notification.type)
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  className='mb-3 p-4 rounded-2xl border bg-gray-50 border-gray-100'
                >
                  <View className="flex-row items-start">
                    {/* Icon */}
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: iconConfig.bgColor }}
                    >
                      <Ionicons 
                        name={iconConfig.name as any} 
                        size={24} 
                        color={iconConfig.color} 
                      />
                    </View>
                    
                    {/* Content */}
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-start justify-between mb-1">
                        <Text
                          style={{ fontFamily: "HankenGrotesk_500Medium" }}
                          className="text-base font-semibold text-neutral-900"
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
                        {notification.timestamp}
                      </Text>
                    </View>
                    
                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteNotification(notification.id, notification.title)}
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
        /* Empty State */
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
          
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-[#F75F15] px-6 py-3 rounded-full flex-row items-center"
          >
            <Ionicons name="refresh" size={20} color="white" className="mr-2" />
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-white font-semibold ml-2"
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

export default Notification