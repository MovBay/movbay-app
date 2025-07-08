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

// Types
interface OrderData {
  delivery: {
    delivery_method: string;
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
    postal_code: number;
  };
  items: Array<{
    store: number;
    product: number;
    amount: number;
    quantity: number;
  }>;
  total_amount: number;
  cart_summary: {
    total_items: number;
    subtotal: number;
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
  <View className="mb-6 ">
    <Text style={styles.sectionTitle}>{title}</Text>
    <View className="mt-2">
      {children}
    </View>
  </View>
)

// Checkbox Component
const CheckboxOption = ({ 
  label, 
  isChecked, 
  onPress 
}: { 
  label: string; 
  isChecked: boolean; 
  onPress: () => void; 
}) => (
  <Pressable 
    onPress={onPress}
    className="flex-row items-center py-4"
  >
    <View 
      className={`w-5 h-5 rounded border-2 mr-3 ${
        isChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
      }`}
    >
      {isChecked && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xs">✓</Text>
        </View>
      )}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
)

const DeliveryDetailsSummary = () => {
  const { orderData } = useLocalSearchParams()
  const [parsedData, setParsedData] = useState<OrderData | null>(null)
  const [saveForNextTime, setSaveForNextTime] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string)
        setParsedData(parsed)
        console.log("Parsed Order Data:", parsed)
      } catch (error) {
        console.error("Error parsing order data:", error)
        toast.show("Error loading order details", {
          type: "error",
          placement: "top",
        })
      }
    }
  }, [orderData])

  // Helper function to get delivery method display name
  const getDeliveryMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      'MovBay_Express': 'MovBay Express',
      'Speedy_Dispatch': 'Speedy Dispatch',
      'Pickup_Hub': 'Pickup Hub'
    }
    return methods[method] || method
  }

  const handleProceed = () => {
    if (!parsedData) return

    // Add metadata for final processing
    const finalOrderData = {
      ...parsedData,
      metadata: {
        saveForNextTime,
        processedAt: new Date().toISOString(),
        screen: "delivery_summary"
      }
    }

    if (saveForNextTime) {
      console.log("Saving delivery details for next time:", finalOrderData)
      toast.show("Delivery details saved for next time!", {
        type: "success",
        placement: "top",
      })
    }

    // Navigate to checkout with complete order data
    router.push({
      pathname: "/(access)/(user_stacks)/user_checkout",
      params: { finalOrderData: JSON.stringify(finalOrderData) }
    })
  }

  console.log('Final data', orderData)

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
            <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
              Delivery Details
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
            {parsedData.delivery.postal_code > 0 && (
              <SummaryItem 
                label="Postal Code" 
                value={parsedData.delivery.postal_code.toString()}
              />
            )}
          </SummarySection>

          {/* Delivery Method */}
          <SummarySection title="Delivery Method">
            <SummaryItem 
              label="Method" 
              value={getDeliveryMethodName(parsedData.delivery.delivery_method)}
              isLast={true}
            />
          </SummarySection>

          {/* Save for Next Time Option */}
          <View className="mt-4">
            <CheckboxOption
              label="Save delivery details for next time"
              isChecked={saveForNextTime}
              onPress={() => setSaveForNextTime(!saveForNextTime)}
            />
          </View>
        </ScrollView>
        
        {/* Fixed Proceed Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100">
          <SolidMainButton 
            onPress={handleProceed}
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
    fontSize: 16,
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
    fontSize: 14,
    color: "#000",
    flex: 1,
    textAlign: "right",
  },
  checkboxLabel: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    color: "#000",
  },
  loadingText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 16,
    color: "#6B7280",
  },
})
