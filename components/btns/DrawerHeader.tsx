import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, View } from "react-native";

interface ButtonProps {
    onPress?: () => void;
}
export const DrawerHeader = ({onPress}: ButtonProps)=>{
    return (

        <View className='flex-row items-center justify-between pt-5'>
            <Pressable onPress={onPress} className='bg-gray-100 w-fit relative flex justify-center items-center rounded-full p-3'>
                <MaterialIcons name='menu' size={20}/>
            </Pressable>

            <Pressable className='bg-gray-100 w-fit relative flex justify-center items-center rounded-full p-3'>
                <Ionicons name='bag-outline' size={20}/>
            </Pressable>
        </View>
    )
}