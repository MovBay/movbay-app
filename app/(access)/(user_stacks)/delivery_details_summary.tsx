import { View, Text, Image, Pressable } from "react-native"
import { useState, useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { ScrollView } from "react-native"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { StyleSheet } from "react-native"
import { useToast } from "react-native-toast-notifications"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

// Types
interface Courier {
  courier_id: string;
  service_code: string;
  courier_image: string;
  discount: number | {
    percentage: number;
    symbol: string;
    discounted: number;
  };
  ratings: number;
  pickup_eta: string;
  pickup_eta_time?: string;
  delivery_eta: string;
  delivery_eta_time?: string;
  total: number;
  free_delivery: boolean;
  free_delivery_products?: Array<{
    product_id: number;
    product_name: string;
  }>;
}

interface StoreData {
  store: string;
  store_id?: string | number;
  status: string;
  message: string;
  store_image: any;
  data: {
    request_token: string;
    couriers: Courier[];
  };
}

interface OrderData {
  delivery: {
    delivery_method?: string;
    full_name: string;
    phone_number: string;
    email: string;
    landmark: string;
    delivery_address: string;
    city: string;
    state: string;
    alternative_address: string;
    alternative_name: string;
    alternative_email: string;
    alternative_phone: string;
    postal_code?: number;
  };
  items: Array<{
    store: number;
    product: number | string;
    product_name: string;
    amount: number;
    quantity: number;
  }>;
  total_amount: number;
  cart_summary: {
    total_items: number;
    subtotal: number;
  };
  stores_couriers?: StoreData[];
  metadata?: {
    saveForNextTime: boolean;
    processedAt: string;
    screen: string;
  };
}

// Summary Item Component
const SummaryItem = ({ 
  label, 
  value, 
  isLast = false 
}: { 
  label: string; 
  value: string; 
  isLast?: boolean; 
}) => (
  <View className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <Text style={styles.labelStyle}>{label}:</Text>
    <Text style={styles.valueStyle}>{value}</Text>
  </View>
)

// Section Component
const SummarySection = ({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode; 
}) => (
  <View className="mb-6">
    <Text style={styles.sectionTitle}>{title}</Text>
    <View className="mt-2">
      {children}
    </View>
  </View>
)

const CourierOption = ({ 
  courier,
  isSelected,
  onSelect,
  storeName
}: { 
  courier: Courier;
  isSelected: boolean;
  onSelect: () => void;
  storeName: string;
}) => {
  const hasDiscount = typeof courier.discount === 'object' && courier.discount.discounted > 0;
  const discountedTotal = hasDiscount ? courier.total : courier.total;
  const originalTotal = hasDiscount ? courier.total + (courier.discount as any).discounted : null;
  const isFreeDelivery = courier.free_delivery && courier.total === 0;

  return (
    <Pressable 
      onPress={onSelect}
      className={`mb-3 rounded-lg overflow-hidden  ${isSelected ? ' bg-white border-2 border-orange-200' : 'bg-white border-2 border-gray-100'}`}
    >
      <View className="p-3">
        {/* Header Section */}
        <View className="flex-row items-start justify-between mb-1">
          <View className="flex-row items-center flex-1 border-b pb-1 border-gray-100">
            <View className="rounded-xl overflow-hidden bg-gray-100">
              <Image 
                source={{ uri: courier.courier_image }}
                resizeMode="contain"
                className="w-10 h-10"
              />
            </View>
            
            {/* Courier Info */}
            <View className="ml-3 flex-1">
              <Text style={{fontFamily: 'HankenGrotesk_500Medium', fontSize: 14}} numberOfLines={1}>
                {courier.courier_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full">
                  <Ionicons name="star" size={8} color="#F59E0B" />
                  <Text style={{fontFamily: 'HankenGrotesk_500Medium', fontSize: 8}}> {courier.ratings.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Radio/Checkmark */}
          <View>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={20} color="#F75F15" />
            ) : (
              <View className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
          </View>
        </View>

      

        {/* ETA Cards */}
        <View className="flex-row items-center gap-3 my-1 mb-2">
          <View className="flex-row gap-1 items-center">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color="gray" />
              <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className="text-gray-400 text-xs ml-1">Pickup: </Text>
            </View>
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-gray-500 text-xs">{courier.pickup_eta}</Text>
          </View>

          <MaterialIcons name="circle" size={4} color={'gray'}/>

          <View className="flex-row items-center gap-1">
            <View className="flex-row items-center ">
              <Ionicons name="bicycle" size={14} color="gray" />
              <Text style={{fontFamily: 'HankenGrotesk_600SemiBold'}} className="ml-1 text-xs text-gray-400">Delivery:</Text>
            </View>
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-gray-500 text-xs">{courier.delivery_eta}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View className={`pt-1 border-t ${isSelected ? 'border-gray-100' : 'border-gray-100'}`}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-xs text-gray-400 pb-1">Delivery Fee</Text>
                {/* Discount Badge */}
                {hasDiscount && !isFreeDelivery && (
                  <View className="">
                    <View className="">
                      <View className="flex-row items-center">
                        <View className="bg-green-600 rounded-full px-2 py-0.5 mr-1">
                          <Text style={{fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 8, color: '#fff'}}>
                            {(courier.discount as any).percentage}{(courier.discount as any).symbol} OFF
                          </Text>
                        </View>
                        <Text style={{fontFamily: 'HankenGrotesk_500Medium', fontSize: 10, color: '#059669'}}>
                          Save ₦{(courier.discount as any).discounted.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
            </View>
            <View className="items-end">
              {originalTotal && !isFreeDelivery && (
                <Text style={{fontFamily: 'HankenGrotesk_400Regular', fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through'}}>
                  ₦{originalTotal.toLocaleString()}
                </Text>
              )}
              <Text style={{
                fontFamily: isFreeDelivery ? 'HankenGrotesk_700Bold' : 'HankenGrotesk_600SemiBold',
                fontSize: 13,
                color: isFreeDelivery ? '#10B981' : '#000'
              }}>
                {isFreeDelivery ? 'Free' : `₦${discountedTotal.toLocaleString()}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const DeliveryDetailsSummary = () => {
  const { orderData } = useLocalSearchParams()
  const [parsedData, setParsedData] = useState<OrderData | null>(null)
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({})
  const toast = useToast()

  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string)
        console.log("Parsed Order Data:", parsed)
        setParsedData(parsed)
        
        // Auto-select first courier for each store
        if (parsed.stores_couriers && parsed.stores_couriers.length > 0) {
          const initialSelections: Record<string, string> = {}
          parsed.stores_couriers.forEach((storeData: StoreData) => {
            if (storeData.data.couriers && storeData.data.couriers.length > 0) {
              initialSelections[storeData.store] = storeData.data.couriers[0].courier_id
            }
          })
          setSelectedCouriers(initialSelections)
        }
      } catch (error) {
        console.error("Error parsing order data:", error)
        toast.show("Error loading order details", {
          type: "danger",
          placement: "top",
        })
      }
    }
  }, [orderData])

  const handleCourierSelect = (storeName: string, courierId: string) => {
    setSelectedCouriers(prev => ({
      ...prev,
      [storeName]: courierId
    }))
  }

const handleProceedToPayment = () => {
  if (!parsedData) return
  
  // Check if all stores have a selected courier
  const storesCount = parsedData.stores_couriers?.length || 0
  const selectionsCount = Object.keys(selectedCouriers).length
  
  if (selectionsCount < storesCount) {
    toast.show("Please select a delivery courier for all stores", {
      type: "warning",
      placement: "top",
    })
    return
  }

  if (parsedData.metadata?.saveForNextTime) {
    toast.show("Delivery details have been saved for future orders!", {
      type: "success",
      placement: "top",
    })
  }

  // CRITICAL FIX: Build selected_couriers with complete data structure
  const selectedCouriersData = parsedData.stores_couriers?.map(storeData => {
    const selectedCourier = storeData.data.couriers.find(
      c => c.courier_id === selectedCouriers[storeData.store]
    )
    
    return {
      store: storeData.store,
      store_id: storeData.store_id,
      request_token: storeData.data.request_token,
      selected_courier: selectedCourier
    }
  })

  // console.log("Selected Couriers Data:", selectedCouriersData)

  const finalData = {
    ...parsedData,
    selected_couriers: selectedCouriersData
  }

  // console.log("Final Data to Checkout:", JSON.stringify(finalData, null, 2))

  router.push({
    pathname: "/(access)/(user_stacks)/user_checkout",
    params: { finalOrderData: JSON.stringify(finalData) }
  })
}

  if (!parsedData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 justify-center items-center">
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 2,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center gap-2 mb-6">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            <Text className="text-xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Delivery Summary
            </Text>
          </View>

          {/* Recipient Information */}
          <SummarySection title="Recipient Information">
            <SummaryItem 
              label="Full Name" 
              value={parsedData.delivery.full_name}
            />
            <SummaryItem 
              label="Phone Number" 
              value={parsedData.delivery.phone_number}
            />
            <SummaryItem 
              label="Email Address" 
              value={parsedData.delivery.email || "Not provided"}
              isLast={true}
            />
          </SummarySection>

          {/* Alternative Recipient Information */}
          {parsedData.delivery.alternative_name && (
            <SummarySection title="Alternative Recipient Information">
              <SummaryItem 
                label="Full Name" 
                value={parsedData.delivery.alternative_name}
              />
              <SummaryItem 
                label="Phone Number" 
                value={parsedData.delivery.alternative_phone || "Not provided"}
              />
              <SummaryItem 
                label="Email Address" 
                value={parsedData.delivery.alternative_email || "Not provided"}
                isLast={true}
              />
            </SummarySection>
          )}

          {/* Delivery Address */}
          <SummarySection title="Delivery Address">
            <SummaryItem 
              label="Street Address" 
              value={parsedData.delivery.delivery_address}
            />
            {parsedData.delivery.landmark && (
              <SummaryItem 
                label="Landmark" 
                value={parsedData.delivery.landmark}
              />
            )}
            <SummaryItem 
              label="City" 
              value={parsedData.delivery.city}
            />
            <SummaryItem 
              label="State" 
              value={parsedData.delivery.state}
            />
            {parsedData.delivery.postal_code && parsedData.delivery.postal_code > 0 && (
              <SummaryItem 
                label="Postal Code" 
                value={parsedData.delivery.postal_code.toString()}
                isLast={true}
              />
            )}
          </SummarySection>

          {/* Store Courier Options */}
          {parsedData.stores_couriers && parsedData.stores_couriers.length > 0 && (
            <>
              {parsedData.stores_couriers.map((storeData, index) => (
                <View key={storeData.store} className="mb-6">
                  {/* Store Header */}
                  <View className="flex-row items-center mb-3 bg-neutral-900 p-3 rounded-xl">
                    <View className="w-10 h-10 overflow-hidden object-cover rounded-full">
                      <Image source={{uri: storeData.store_image}} className="w-full h-full object-cover"/>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white" style={{fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 15}}>
                        {storeData.store}
                      </Text>
                      <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className="text-sm text-gray-400">
                        Select delivery courier
                      </Text>
                    </View>
                  </View>

                  {/* Couriers for this store */}
                  {storeData.data.couriers.map((courier) => (
                    <CourierOption
                      key={`${storeData.store}-${courier.courier_id}`}
                      courier={courier}
                      storeName={storeData.store}
                      isSelected={selectedCouriers[storeData.store] === courier.courier_id}
                      onSelect={() => handleCourierSelect(storeData.store, courier.courier_id)}
                    />
                  ))}
                </View>
              ))}
            </>
          )}

          {/* Saved for Next Time Indicator */}
          {parsedData.metadata?.saveForNextTime && (
            <View className="mb-6">
              <View className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Text className="text-blue-700 text-sm" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                  ✓ Delivery details saved for future orders
                </Text>
                <Text className="text-blue-600 text-xs mt-1" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
                  These details will be pre-filled in your next order
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Fixed Proceed Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton 
            onPress={handleProceedToPayment}
            text="Proceed to Payment"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default DeliveryDetailsSummary

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
  },
  labelStyle: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  valueStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 13,
    color: "#000",
    flex: 1,
    textAlign: "right",
  },
  loadingText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 16,
    color: "#6B7280",
  }
})