// components/NotificationTester.tsx
// This component is for development/testing purposes
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNotifications } from '@/hooks/useNotification';

const NotificationTester = () => {
  const { 
    sendLocalNotification, 
    sendTestPushNotification,
    cancelAllNotifications,
    getPermissionStatus,
    isListening, 
    pushToken,
    notification 
  } = useNotifications();

  const handleTestLocalNotification = async () => {
    await sendLocalNotification({
      id: 'test-order-123',
      total_amount: 5000
    });
  };

  const handleTestPushNotification = async () => {
    if (!pushToken) {
      Alert.alert('Error', 'No push token available');
      return;
    }

    try {
      await sendTestPushNotification(
        'Test Push Notification',
        'This is a test push notification from your app!',
        { type: 'test', screen: 'orders' }
      );
      Alert.alert('Success', 'Test push notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
      console.error(error);
    }
  };

  const handleCancelAllNotifications = async () => {
    await cancelAllNotifications();
    Alert.alert('Success', 'All notifications canceled');
  };

  const handleCheckPermissions = async () => {
    const status = await getPermissionStatus();
    Alert.alert('Permission Status', `Current status: ${status}`);
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f5f5f5', margin: 10, borderRadius: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
        Notification Tester
      </Text>
      
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Push Token: {pushToken ? 'Available' : 'Not Available'}
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Listening: {isListening ? 'Yes' : 'No'}
        </Text>
        {notification && (
          <Text style={{ fontSize: 12, color: '#666' }}>
            Last Notification: {notification.request.content.title}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 10,
            borderRadius: 5,
            minWidth: 140,
          }}
          onPress={handleTestLocalNotification}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test Local Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            padding: 10,
            borderRadius: 5,
            minWidth: 140,
          }}
          onPress={handleTestPushNotification}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Test Push Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#FF3B30',
            padding: 10,
            borderRadius: 5,
            minWidth: 140,
          }}
          onPress={handleCancelAllNotifications}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Cancel All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#8E8E93',
            padding: 10,
            borderRadius: 5,
            minWidth: 140,
          }}
          onPress={handleCheckPermissions}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>
            Check Permissions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotificationTester;