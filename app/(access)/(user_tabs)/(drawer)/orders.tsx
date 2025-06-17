import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { DrawerHeader } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native';

const Orders = () => {

    const navigation = useNavigation()

    const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer())
    }

  return (
    <SafeAreaView className='flex-1 bg-white px-5'>
        <StatusBar style='dark'/>
        <DrawerHeader onPress={openDrawer}/>
        <Text>Orders</Text>
    </SafeAreaView>
  )
}

export default Orders