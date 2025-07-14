import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated, Dimensions } from 'react-native'
import React, { useState, useRef, useCallback, useMemo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SolidLightButton, SolidMainButton } from '@/components/btns/CustomButtoms'
import { useGetNewOrders, useSendToken } from '@/hooks/mutations/sellerAuth'
import { MaterialIcons } from '@expo/vector-icons'
import LoadingOverlay from '@/components/LoadingOverlay'
import { DrawerHeaderMany } from '@/components/btns/DrawerHeader'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { useNotification } from '@/context/NotificationContext'
// import { useNotifications } from '@/hooks/useNotification'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// Types
interface Order {
  order_id: string;
  order_items: Array<{
    product: {
      title: string;
      description: string;
      original_price: number;
      discounted_price: number;
      product_images: Array<{
        image_url: string;
      }>;
    };
    count: number;
  }>;
}

interface OrderTotals {
  totalPrice: number;
  totalQuantity: number;
}

interface RejectOrderBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirmReject: (order: Order) => void;
}

// Constants
const TABS = ['New Orders', 'Processing', 'Out for Delivery', 'Completed', 'Cancelled'] as const;
type TabType = typeof TABS[number];

// Reject Order Confirmation Bottom Sheet
const RejectOrderBottomSheet = ({ visible, onClose, order, onConfirmReject }: RejectOrderBottomSheetProps) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleConfirmReject = useCallback(() => {
    if (order) {
      onConfirmReject(order);
      onClose();
    }
  }, [order, onConfirmReject, onClose]);

  if (!visible || !order) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropOpacity,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
          }}
        >
          {/* Handle Bar */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="cancel" size={32} color="#F75F15" />
            </View>
          </View>

          {/* Content */}
          <View className="items-center mb-6">
            <Text className="text-xl font-semibold mb-2 text-center" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Do you want to reject order?
            </Text>
            <Text className="text-gray-600 text-center px-10" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Are you sure you want to reject this order? This action cannot be undone.
            </Text>
            <Text className="text-sm text-gray-500 mt-5 mb-5 text-center" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
              Order ID: {order.order_id}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <TouchableOpacity
                className="py-4 px-6 rounded-full bg-gray-100"
                onPress={onClose}
              >
                <Text className="text-center text-gray-700" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            <View className="w-[48%]">
              <SolidMainButton text='Reject Order' onPress={handleConfirmReject} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description, buttonText, onButtonPress }: {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  onButtonPress: () => void;
}) => (
  <View className='items-center justify-center flex-1 py-20'>
    <Animated.View className='bg-[#FEEEE6] p-4 rounded-full flex-row justify-center items-center'>
      <MaterialIcons name={icon as any} size={35} color={'#F75F15'} />
    </Animated.View>
    <Animated.View className='w-[60%]'>
      <Text className='text-xl pt-3 text-center' style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
        {title}
      </Text>
      <Text className='text-base text-center text-neutral-600 pt-2' style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
        {description}
      </Text>
    </Animated.View>
    <Animated.View className='w-[50%] pt-5'>
      <SolidMainButton text={buttonText} onPress={onButtonPress} />
    </Animated.View>
  </View>
);

// Order Card Component
const OrderCard = ({ order, onReject, onViewToConfirm }: {
  order: Order;
  onReject: (order: Order) => void;
  onViewToConfirm: (order: Order) => void;
}) => {
  const { totalPrice, totalQuantity } = useMemo(() => {
    let totalPrice = 0;
    let totalQuantity = 0;

    order.order_items.forEach((item) => {
      const itemPrice = item.product.discounted_price > 0 
        ? item.product.discounted_price 
        : item.product.original_price;
      totalPrice += itemPrice * item.count;
      totalQuantity += item.count;
    });

    return { totalPrice, totalQuantity };
  }, [order.order_items]);

  const firstProduct = order.order_items[0]?.product;
  const productImage = firstProduct?.product_images[0]?.image_url;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 relative">
      {/* Quantity Badge */}
      <View className="absolute top-3 right-3 bg-orange-100 rounded-full px-3 py-1">
        <Text className="text-xs font-medium text-orange-600" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          {totalQuantity} item{totalQuantity > 1 ? 's' : ''}
        </Text>
      </View>

      <View className="flex-row items-center mb-4 pr-16">
        <View className="w-20 h-20 bg-gray-100 rounded-lg mr-4 items-center justify-center overflow-hidden">
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-200 items-center justify-center">
              <Text className="text-gray-400 text-xs">No Image</Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-neutral-800 mb-1" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            {firstProduct?.title || 'Product Title'}
          </Text>
          <Text className="text-sm text-neutral-600" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
            {firstProduct?.description || 'Product Description'}
          </Text>
          <Text className="text-lg font-bold text-black" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            ₦{totalPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      <View className='flex-row justify-between items-center'>
        <View className='w-[48%]'>
          <SolidLightButton text='Reject Order' onPress={() => onReject(order)} />
        </View>
        <View className='w-[48%]'>
          <SolidMainButton text='View to Confirm' onPress={() => onViewToConfirm(order)} />
        </View>
      </View>
    </View>
  );
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState<TabType>('New Orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const navigation = useNavigation();


  const { newOrdersData, isLoading } = useGetNewOrders();
  const { mutate: sendTokenMutation, isPending: isSendingToken } = useSendToken();

  const newUserOrders = useMemo(() => 
    newOrdersData?.data?.results || [], 
    [newOrdersData?.data?.results]
  );

  const handleSendToken = useCallback(async (token: string) => {
    if (!token) {
      console.log('No push token available');
      return;
    }

    try {
      sendTokenMutation(
        { 
          push_token: token,
          device_type: 'mobile'
        },
        {
          onSuccess: (response) => {
            console.log('Push token sent successfully:', response);
          },
          onError: (error) => {
            console.error('Error sending push token:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error in handleSendToken:', error);
    }
  }, [sendTokenMutation]);

  const openDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleRejectOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowRejectSheet(true);
  }, []);

  const handleCloseRejectSheet = useCallback(() => {
    setShowRejectSheet(false);
    setSelectedOrder(null);
  }, []);

  const handleConfirmReject = useCallback((order: Order) => {
    console.log('Rejecting order:', order.order_id);
    // Add your reject order logic here
  }, []);

  const handleViewToConfirm = useCallback((order: Order) => {
    // Calculate totals for notification
    const { totalPrice } = order.order_items.reduce((acc, item) => {
      const itemPrice = item.product.discounted_price > 0 
        ? item.product.discounted_price 
        : item.product.original_price;
      acc.totalPrice += itemPrice * item.count;
      return acc;
    }, { totalPrice: 0 });

    router.push({
      pathname: "/(access)/(user_stacks)/order-confirm",
      params: {
        orderId: order.order_id,
        orderData: JSON.stringify(order)
      }
    });
  }, []);

  const navigateToHome = useCallback(() => {
    router.push('/home');
  }, []);

  const emptyStates = useMemo(() => ({
    'New Orders': {
      icon: 'receipt',
      title: 'No New Orders',
      description: "You don't have any new orders at the moment.",
      buttonText: 'Start Shopping'
    },
    'Processing': {
      icon: 'hourglass-empty',
      title: 'No Processing Orders',
      description: "You don't have any orders being processed at the moment.",
      buttonText: 'Start Shopping'
    },
    'Out for Delivery': {
      icon: 'local-shipping',
      title: 'No Orders Out for Delivery',
      description: "You don't have any orders out for delivery at the moment.",
      buttonText: 'Browse Products'
    },
    'Completed': {
      icon: 'check-circle',
      title: 'No Completed Orders',
      description: 'Your completed orders will appear here once they are delivered.',
      buttonText: 'Start Shopping'
    },
    'Cancelled': {
      icon: 'cancel',
      title: 'No Cancelled Orders',
      description: "You don't have any cancelled orders at the moment.",
      buttonText: 'Start Shopping'
    }
  }), []);

  const renderTabContent = () => {
    if (activeTab === 'New Orders') {
      return newUserOrders.length > 0 ? (
        <View className="space-y-4">
          {newUserOrders.map((order: Order, index: number) => (
            <OrderCard
              key={order.order_id || index}
              order={order}
              onReject={handleRejectOrder}
              onViewToConfirm={handleViewToConfirm}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          {...emptyStates[activeTab]}
          onButtonPress={navigateToHome}
        />
      );
    }

    return (
      <EmptyState
        {...emptyStates[activeTab]}
        onButtonPress={navigateToHome}
      />
    );
  };


  const {notification, error, expoPushToken} = useNotification()

  if(error){
    // return <Text className='text-xl text-white pt-10'>Error: {error.message}</Text>
    console.error('Notification Error:', error);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading || isSendingToken} />

      <View className="flex-row items-center gap-2 mb-6 px-4 pt-2">
        <DrawerHeaderMany onPress={openDrawer} />
        <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
          Orders
        </Text>
      </View>

      {/* Tab Bar */}
      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          className="flex-grow-0"
        >
          <View className="flex-row bg-white rounded-full p-1 mx-0">
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`py-3 px-6 rounded-full min-w-[100px] ${
                  activeTab === tab ? 'bg-orange-100' : 'bg-transparent'
                }`}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  className={`text-center text-sm ${
                    activeTab === tab ? 'text-orange-600 font-medium' : 'text-gray-500'
                  }`}
                  style={{
                    fontFamily: activeTab === tab ? "HankenGrotesk_500Medium" : "HankenGrotesk_400Regular"
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <Text className='text-black text-xl'>Your Push Token</Text>
      <Text className='text-black text-xl'>{expoPushToken}</Text>
      <Text className='text-black text-xl'>Latest Notification</Text>
      <Text className='text-black text-xl'>{notification?.request.content.title}</Text>
      <Text className='text-black text-xl'>{JSON.stringify(notification?.request.content.title, null, 2)}</Text>

      {/* Content */}
      {!isLoading && (
        <KeyboardAwareScrollView className="flex-1 px-4">
          {renderTabContent()}
        </KeyboardAwareScrollView>
      )}

      {/* Reject Order Bottom Sheet */}
      <RejectOrderBottomSheet
        visible={showRejectSheet}
        onClose={handleCloseRejectSheet}
        order={selectedOrder}
        onConfirmReject={handleConfirmReject}
      />
    </SafeAreaView>
  );
};

export default Orders;