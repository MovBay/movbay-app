import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Drawer } from "expo-router/drawer"
import { View, Text, Pressable } from "react-native"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import Ionicons from "@expo/vector-icons/Ionicons"
import { Image } from "react-native"
import { router } from "expo-router"
import { StyleSheet } from "react-native"
import { usePathname } from "expo-router"

function CustomDrawerContent() {
  const pathname = usePathname()
  
  const isActive = (route: string) => {
    return pathname.includes(route)
  }

  return (
    <View className="flex-1 bg-white ">
      {/* Header remains the same */}
      <View className="p-5 pt-10 pb-10 pl-8 bg-[#F75F15] rounded-bl-3xl rounded-br-3xl">
        <Image
          source={require('../../../../assets/images/logo.png')}
          alt="Seller Avatar"
          className="w-40 h-20 rounded-full mt-3 justify-center"
        />
      </View>

      <View className="flex-1 p-5 pl-8">
        <Pressable 
          style={[
            styles.drawerItem,
            isActive('/sell') && styles.activeDrawerItem
          ]}
          onPress={() => router.push('/(access)/(user_tabs)/(drawer)/sell')}
        >
          <MaterialIcons 
            name="dashboard" 
            size={20} 
            color={isActive('/sell') ? "#F75F15" : "#5F5F5F"} 
          />
          <Text 
            style={[
              styles.drawerText,
              isActive('/sell') && styles.activeDrawerText
            ]}
          >
            Dashboard
          </Text>
        </Pressable>

        <Pressable 
          style={[
            styles.drawerItem,
            isActive('/products') && styles.activeDrawerItem
          ]}
          onPress={() => router.push('/(access)/(user_tabs)/(drawer)/products')}
        >
          <MaterialIcons 
            name="inventory" 
            size={20} 
            color={isActive('/products') ? "#F75F15" : "#5F5F5F"} 
          />
          <Text 
            style={[
              styles.drawerText,
              isActive('/products') && styles.activeDrawerText
            ]}
          >
            My Products
          </Text>
        </Pressable>


        <Pressable 
          style={[
            styles.drawerItem,
            isActive('/orders') && styles.activeDrawerItem
          ]}
          onPress={() => router.push('/(access)/(user_tabs)/(drawer)/orders')}
        >
          <MaterialIcons 
            name="shopping-bag" 
            size={20} 
            color={isActive('/orders') ? "#F75F15" : "#5F5F5F"} 
          />
          <Text 
            style={[
              styles.drawerText,
              isActive('/orders') && styles.activeDrawerText
            ]}
          >
            Orders
          </Text>
        </Pressable>

        <Pressable 
          style={[
            styles.drawerItem,
            isActive('/store') && styles.activeDrawerItem
          ]}
          onPress={() => router.push('/(access)/(user_tabs)/(drawer)/store')}
        >
          <MaterialIcons 
            name="storefront" 
            size={20} 
            color={isActive('/store') ? "#F75F15" : "#5F5F5F"} 
          />
          <Text 
            style={[
              styles.drawerText,
              isActive('/store') && styles.activeDrawerText
            ]}
          >
            Store
          </Text>
        </Pressable>


        <Pressable 
          style={[
            styles.drawerItem,
            isActive('/profile-s') && styles.activeDrawerItem
          ]}
          onPress={() => router.push('/(access)/(user_tabs)/(drawer)/profile-s')}
        >
          <MaterialIcons 
            name="people-alt" 
            size={20} 
            color={isActive('/profile-s') ? "#F75F15" : "#5F5F5F"} 
          />
          <Text 
            style={[
              styles.drawerText,
              isActive('/profile-s') && styles.activeDrawerText
            ]}
          >
            Store Profile
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeDrawerItem: {
    backgroundColor: '#FFF7ED', // orange-50 equivalent
  },
  drawerText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#5F5F5F',
    fontFamily: 'HankenGrotesk_500Medium',
  },
  activeDrawerText: {
    color: '#F75F15',
  },
})

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            width: 260,
          },
          drawerType: "front",
          swipeEnabled: true,
          drawerPosition: "right",
        }}
      >
        <Drawer.Screen
          name="sell"
          options={{
            drawerLabel: "Sell",
            title: "Sell",
          }}
        />

        <Drawer.Screen
          name="products"
          options={{
            drawerLabel: "Products",
            title: "Products",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  )
}
