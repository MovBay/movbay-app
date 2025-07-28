import { View, Text, Image, Modal } from "react-native"
import { useState, useEffect } from "react"
import { router } from "expo-router"
import { Pressable } from "react-native"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { StyleSheet } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { useToast } from "react-native-toast-notifications"
import Ionicons from "@expo/vector-icons/Ionicons"
import { MaterialIcons } from "@expo/vector-icons"
import { SolidLightButton, SolidMainButton } from "@/components/btns/CustomButtoms"

const RiderSettings = () => {
  const [showDialog, setShowDialog] = useState(false);

  const handlePress = () => {
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

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
                Settings
              </Text>
            </View>

            <View className="pt-8">
              <Pressable onPress={()=>router.push('/(access)/(rider_stacks)/riderChangePassword')} className="flex-row justify-between items-center pb-3 border-b border-neutral-100">
                <View className="flex-row items-center gap-3">
                  <View className="p-4 bg-neutral-100 rounded-full">
                    <MaterialIcons name="lock-outline" size={23} />
                  </View>
                  <View>
                    <Text className="text-lg" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Change Password</Text>
                    <Text className="text-sm" style={{fontFamily: 'HankenGrotesk_400Regular'}}>Update your login password securely</Text>
                  </View>
                </View>

                <MaterialIcons name="chevron-right" size={23}/>
              </Pressable>

              <Pressable onPress={handlePress} className="flex-row justify-between items-center pb-2 border-b border-neutral-100 mt-5">
                <View className="flex-row items-center gap-3">
                  <View className="p-4 bg-neutral-100 rounded-full">
                    <Ionicons name="trash-outline" size={23} />
                  </View>
                  <View>
                    <Text className="text-lg" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Delete Account</Text>
                    <Text className="text-sm" style={{fontFamily: 'HankenGrotesk_400Regular'}}>Permanently close and erase your account</Text>
                  </View>
                </View>
              </Pressable>
            </View>

          </View>
        </KeyboardAwareScrollView>
      </View>
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
                Delete MovBay
              </Text>
              <Text className='text-neutral-500 text-center mb-6 w-[90%] m-auto text-sm' style={{fontFamily: 'HankenGrotesk_500Medium'}}>
                Deleting this account means no access to information on this account. ARe you sure you want to delete your account.
              </Text>

              <View className='flex-row items-center justify-between'>
                <View className='w-[49%]'>
                  <SolidLightButton onPress={closeDialog} text='No'/>
                </View>

                <View className='w-[49%]'>
                  <SolidMainButton onPress={closeDialog} text='Yes'/>
                </View>
              </View>
            </View>
          </View>
      </Modal>
    </SafeAreaView>
  )
}

export default RiderSettings

const styles = StyleSheet.create({
  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: "#F6F6F6",
  },

  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 15,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
  },
})