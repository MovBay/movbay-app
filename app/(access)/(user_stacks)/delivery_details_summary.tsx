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
import LoadingOverlay from "@/components/LoadingOverlay"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

// Types
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
  shipRateResponse?: {
    movbay_delivery?: Array<{
      store_id: number;
      fare: number;
      delivery_type: string;
    }>;
    shiip_delivery?: Array<{
      store_id: number;
      delivery_type: string;
      details: {
        status: string;
        message: string;
        data: {
          rates: {
            carrier_name: string;
            amount: number;
            id: string;
            carrier_logo: string;
          };
          pickup_address_id: string;
          delivery_address_id: string;
          parcel_id: string;
        };
      };
    }>;
  };
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

// Product Delivery Item Component
const ProductDeliveryItem = ({ 
  productName,
  deliveryMethod, 
  fare, 
  carrierName,
  isLast = false 
}: { 
  productName: string;
  deliveryMethod: string; 
  fare: number; 
  carrierName: string;
  isLast?: boolean; 
}) => {
  // Function to get initials from carrier name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };


  return (
    <View className={`py-4 mb-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      {/* Product Name */}
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="bag-handle" size={18}/>
        <Text style={styles.productNameStyle}>{productName}</Text>
      </View>
      
      {/* Delivery Method Info */}
      <View className="flex-row justify-between items-center pt-2  border-t border-gray-100">
        <View className="flex-row items-center flex-1">
          {/* Initials Logo */}
          <View style={styles.initialsLogo}>
            <Text style={styles.initialsText}>{getInitials(carrierName)}</Text>
          </View>
          
          <View className="ml-3">
            <Text style={styles.carrierNameStyle}>{carrierName}</Text>
            <Text style={styles.deliveryTypeStyle}>{deliveryMethod}</Text>
          </View>
        </View>
        <Text style={styles.fareStyle}>₦{fare.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const DeliveryDetailsSummary = () => {
  const { orderData } = useLocalSearchParams()
  const [parsedData, setParsedData] = useState<OrderData | null>(null)

  console.log("Received parsedData param:", parsedData)
  const toast = useToast()

  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string)
        setParsedData(parsed)
      } catch (error) {
        console.error("Error parsing order data:", error)
        toast.show("Error loading order details", {
          type: "error",
          placement: "top",
        })
      }
    }
  }, [orderData])


  const handleProceedToPayment = () => {
    if (!parsedData) return
    if (parsedData.metadata?.saveForNextTime) {
      toast.show("Delivery details have been saved for future orders!", {
        type: "success",
        placement: "top",
      })
    }

    router.push({
      pathname: "/(access)/(user_stacks)/user_checkout",
      params: { finalOrderData: JSON.stringify(parsedData) }
    })
  }

  // Function to render delivery methods for products
  const renderProductDeliveryMethods = () => {
    if (!parsedData?.shipRateResponse || !parsedData?.items) return null

    const { movbay_delivery, shiip_delivery } = parsedData.shipRateResponse
    const deliveryMethods: React.ReactNode[] = []

    // Create a map of store_id to product info
    const storeProductMap = new Map()
    parsedData.items.forEach(item => {
      storeProductMap.set(item.store, {
        product_name: item.product_name,
        quantity: item.quantity,
        amount: item.amount
      })
    })

    // Add Movbay delivery methods
    if (movbay_delivery && movbay_delivery.length > 0) {
      movbay_delivery.forEach((delivery, index) => {
        const productInfo = storeProductMap.get(delivery.store_id)
        if (productInfo) {
          deliveryMethods.push(
            <ProductDeliveryItem
              key={`movbay-${delivery.store_id}`}
              productName={productInfo.product_name}
              deliveryMethod="Movbay Dispatch"
              fare={delivery.fare}
              carrierName="Movbay Dispatch"
              isLast={index === movbay_delivery.length - 1 && (!shiip_delivery || shiip_delivery.length === 0)}
            />
          )
        }
      })
    }

    // Add Shiip delivery methods
    if (shiip_delivery && shiip_delivery.length > 0) {
      shiip_delivery.forEach((delivery, index) => {
        if (delivery.details.status === "success") {
          const productInfo = storeProductMap.get(delivery.store_id)
          if (productInfo) {
            const { rates } = delivery.details.data
            deliveryMethods.push(
              <ProductDeliveryItem
                key={`shiip-${delivery.store_id}`}
                productName={productInfo.product_name}
                deliveryMethod={delivery.delivery_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                fare={rates.amount}
                carrierName={rates.carrier_name}
                isLast={index === shiip_delivery.length - 1}
              />
            )
          }
        }
      })
    }

    return deliveryMethods.length > 0 ? deliveryMethods : null
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

          {/* Product Delivery Methods */}
          {renderProductDeliveryMethods() && (
            <SummarySection title="Product Delivery Methods">
              {renderProductDeliveryMethods()}
            </SummarySection>
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
  },
  productNameStyle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 14,
    color: "#000",
  },
  carrierNameStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 12,
    color: "#000",
  },
  deliveryTypeStyle: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },
  fareStyle: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 14,
    color: "#000",
  },
  initialsLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#F75F15",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontFamily: "HankenGrotesk_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
})