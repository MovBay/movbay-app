import Intercom from '@intercom/intercom-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text } from 'react-native';

const ContactSupport = () => {
  const showIntercom = () => {
    try {
    //   Intercom.present();
      console.log('Clicked')
    } catch (error) {
      console.log('Error showing Intercom:', error);
    }
  };
  
  return(
    <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <Pressable onPress={showIntercom} className="p-4 bg-blue-500 m-4 rounded">
          <Text className="text-white text-center">Contact Support</Text>
        </Pressable>
    </SafeAreaView>
  )
}

export default ContactSupport;