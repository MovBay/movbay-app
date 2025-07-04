import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, Pressable, Text, TouchableOpacity } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';


interface ButtonProps {
    text: string;
    onPress?: () => void;
}
export const SolidMainButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-[#F75F15] p-4 w-full rounded-full">
            <Text className="text-white text-base" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}

export const SolidInactiveButton = ({text, ...props}: ButtonProps)=>{
    return (
        <Pressable style={{opacity: 0.6}} {...props} className="flex items-center gap-4 bg-[#F75F15] p-4 w-full rounded-full">
            <Text className="text-white text-base" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </Pressable>
    )
}

export const SolidLightButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-[#FEEEE6] p-4 w-full rounded-full">
            <Text className="text-[#A53F0E] text-base" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}


export const GoogleButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex-row justify-center items-center gap-4 bg-white border border-neutral-300 p-4 w-full rounded-full">
            <Image
                source={require('../../assets/images/google.png')}
                alt="Google Logo"
                style={{
                    width: 24,
                    height: 24,
                }}
            />
            <Text className="text-black text-base" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}