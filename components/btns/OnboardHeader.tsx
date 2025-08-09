import { Text, View } from "react-native";
import { Button, Icon } from "@rneui/themed";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";


interface ButtonProps {
    text?: string;
    description?: string;
    onPressBtn?: () => void;
}
export const OnboardHeader = ({text, description}: ButtonProps)=>{
    return (
        <View className="">
            <Text className="text-black text-xl" style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>{text}</Text>
            <Text className="text-neutral-600 text-base pt-2" style={{fontFamily: 'HankenGrotesk_400Regular'}}>{description}</Text>
        </View>
    )
}


export const OnboardArrowHeader = ({onPressBtn}: ButtonProps)=>{
    return (
        <View className="mb-5">
            <Button
                    type="solid"
                    size="sm"
                    onPress={onPressBtn}
                    buttonStyle={{
                        backgroundColor: "#FEEEE6",
                        borderRadius: 100,
                        width: 35,
                        height: 35,
                    }}
                >
                 <MaterialIcons
                    name={'chevron-left'}
                    size={25}
                    color={"#F75F15"}
                />
            </Button>
        </View>
    )
}


export const OnboardArrowTextHeader = ({onPressBtn}: ButtonProps)=>{
    return (
        <View className="">
            <Button
                    type="solid"
                    size="sm"
                    onPress={onPressBtn}
                    buttonStyle={{
                        backgroundColor: "#F6F6F6",
                        borderRadius: 100,
                        width: 40,
                        height: 40,
                    }}
                >
                <MaterialIcons
                    name={'chevron-left'}
                    size={25}
                    color={"black"}
                />
            </Button>
            
        </View>
    )
}