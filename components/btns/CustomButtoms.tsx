import { Text, TouchableOpacity } from "react-native";

interface ButtonProps {
    text: string;
    onPress?: () => void;
}
export const SolidMainButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-[#F75F15] p-4 w-full rounded-full">
            <Text className="text-white" style={{fontFamily: 'HankenGrotesk_500Medium'}}>{text}</Text>
        </TouchableOpacity>
    )
}

export const SolidLightButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-orange-200 p-4 w-full rounded-full">
            <Text className="text-[#A53F0E]" style={{fontFamily: 'HankenGrotesk_500Medium'}}>{text}</Text>
        </TouchableOpacity>
    )
}