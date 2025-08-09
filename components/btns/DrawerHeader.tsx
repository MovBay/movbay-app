import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@rneui/themed";
import { TouchableOpacity, View } from "react-native";

interface ButtonProps {
    onPress?: () => void;
}
// export const DrawerHeader = ({onPress}: ButtonProps)=>{
//     return (

//         <View className='flex-row items-center justify-between pt-3 pb-3'>
//             <TouchableOpacity onPress={onPress} className='bg-gray-100 w-fit relative flex justify-center items-center rounded-full p-3'>
//                 <MaterialIcons name='menu' size={20}/>
//             </TouchableOpacity>

//             <TouchableOpacity className='bg-gray-100 w-fit relative flex justify-center items-center rounded-full p-3'>
//                 <Ionicons name='bag-outline' size={20}/>
//             </TouchableOpacity>
//         </View>
//     )
// }


export const DrawerHeader = ({onPress}: ButtonProps)=>{
    return (
        <View className="py-3 flex-row items-center justify-between">
            <Button
                    type="solid"
                    size="sm"
                    onPress={onPress}
                    buttonStyle={{
                        backgroundColor: "#FEEEE6",
                        borderRadius: 100,
                        width: 45,
                        height: 45,
                    }}
                >
                 {/* <MaterialIcons
                    name={'chevron-left'}
                    size={25}
                    color={"#F75F15"}
                /> */}
                <MaterialIcons name='menu' size={20}/>

            </Button>


            <Button
                    type="solid"
                    size="sm"
                    onPress={()=>console.log('Bag pressed')}
                    buttonStyle={{
                        backgroundColor: "#FEEEE6",
                        borderRadius: 100,
                        width: 45,
                        height: 45,
                    }}
                >
                 {/* <MaterialIcons
                    name={'chevron-left'}
                    size={25}
                    color={"#F75F15"}
                /> */}
                <Ionicons name='bag-outline' size={20}/>
            </Button>
        </View>
    )
}


export const DrawerHeaderMany = ({onPress}: ButtonProps)=>{
    return (

        <View className='flex-row items-center justify-between'>
            <TouchableOpacity onPress={onPress} className='bg-gray-100 w-fit relative flex justify-center items-center rounded-full p-3'>
                <MaterialIcons name='menu' size={20}/>
            </TouchableOpacity>
        </View>
    )
}