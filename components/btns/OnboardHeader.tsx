import { Text, TouchableOpacity, View } from "react-native";

interface ButtonProps {
    text: string;
    description?: string;
}
export const OnboardHeader = ({text, description}: ButtonProps)=>{
    return (
        <View className="">
            <Text className="text-black text-3xl" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{text}</Text>
            <Text className="text-neutral-600 text-lg" style={{fontFamily: 'HankenGrotesk_400Regular'}}>{description}</Text>
        </View>
    )
}


export const OnboardArrowHeader = ({text, description}: ButtonProps)=>{
    return (
        <View className="">
            <Text className="text-black text-3xl" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{text}</Text>
            <Text className="text-neutral-600 text-lg" style={{fontFamily: 'HankenGrotesk_400Regular'}}>{description}</Text>
        </View>
    )
}