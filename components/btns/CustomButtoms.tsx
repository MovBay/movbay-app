import { Image, Pressable, Text, TouchableOpacity } from "react-native";


interface ButtonProps {
    text: string;
    onPress?: () => void;
}
export const SolidMainButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-[#F75F15] p-4 py-4 w-full rounded-full">
            <Text className="text-white text-[13px]" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}

export const SolidInactiveButton = ({text, ...props}: ButtonProps)=>{
    return (
        <Pressable style={{opacity: 0.6}} {...props} className="flex items-center gap-4 bg-[#F75F15] p-4 py-4 w-full rounded-full">
            <Text className="text-white text-[13px]" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </Pressable>
    )
}

export const SolidLightButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-[#FEEEE6] border border-[#f3d0be] p-4 py-4 w-full rounded-full">
            <Text className="text-[#F75F15] text-[13px]" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}


export const SolidLightGreenButton = ({text, onPress, ...props}: ButtonProps)=>{
    return (
        <TouchableOpacity {...props} onPress={onPress} className="flex items-center gap-4 bg-green-50 border border-green-200 p-4 py-4 w-full rounded-full">
            <Text className="text-green-600 text-[13px]" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
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
            <Text className="text-black text-[13px]" style={{fontFamily: 'HankenGrotesk_700Bold'}}>{text}</Text>
        </TouchableOpacity>
    )
}