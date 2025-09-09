"use client"

import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { router, useLocalSearchParams } from "expo-router"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { useGetTransaction } from "@/hooks/mutations/sellerAuth"
import { useMemo } from "react"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SolidLightButton, SolidLightGreenButton, SolidMainButton } from "@/components/btns/CustomButtoms"

export interface Transaction {
  id: string
  title: string
  amount: number
  date: string
  status: "successful" | "pending" | "failed"
  type: "credit" | "debit"
  description: string
  recipient: string
  reference: string
}

const TransactionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isLoading, transactionData } = useGetTransaction()
  const myTransactionData = transactionData?.data?.results

  // Transform API data to match Transaction interface and find the specific transaction
  const transaction: Transaction | null = useMemo(() => {
    if (!myTransactionData || !Array.isArray(myTransactionData) || !id) {
      return null
    }

    const apiTransaction = myTransactionData.find((item: any) => item.id.toString() === id)
    
    if (!apiTransaction) {
      return null
    }

    // Determine transaction type based on API type
    let transactionType: "credit" | "debit" = "debit"
    let recipient = ""
    
    switch (apiTransaction.type) {
      case "Account-Funded":
        transactionType = "credit"
        recipient = "Account Funding"
        break
      case "Withdrawal":
        transactionType = "debit"
        recipient = "Withdrawal"
        break
      case "Item-Purchased":
        transactionType = "debit"
        recipient = "Item Purchase"
        break
      default:
        recipient = apiTransaction.type || "Transaction"
    }

    // Use actual status from API, default to successful if not provided
    const status = apiTransaction.status === "pending" ? "pending" : "successful"

    return {
      id: apiTransaction.id.toString(),
      title: apiTransaction.content || "Transaction",
      amount: apiTransaction.amount || 0,
      date: apiTransaction.created_at,
      status: status as "successful" | "pending" | "failed",
      type: transactionType,
      description: apiTransaction.content || "",
      recipient: recipient,
      reference: apiTransaction.reference_code || `TXN${apiTransaction.id.toString().padStart(9, '0')}`,
    }
  }, [myTransactionData, id])

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingOverlay visible={isLoading} />
        
        {/* Header */}
        <View className="">
          <View className="px-5 pt-3 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text
                className="text-xl text-center m-auto font-semibold text-gray-900"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                Transaction Details
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="">
          <View className="px-5 pt-3 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text
                className="text-xl text-center m-auto font-semibold text-gray-900"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                Transaction Details
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            Transaction not found
          </Text>
          <Text className="text-sm text-gray-500 text-center px-8" style={{ fontFamily: "HankenGrotesk_400Regular" }}>
            The transaction you're looking for could not be found or may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "#22C55E"
      case "pending":
        return "#F59E0B"
      case "failed":
        return "#EF4444"
      default:
        return "#6B7280"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "successful":
        return "checkmark-circle"
      case "pending":
        return "time-outline"
      case "failed":
        return "close-circle"
      default:
        return "help-circle"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="">
        <View className="px-5 pt-3 pb-4 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            <Text
              className="text-xl text-center m-auto font-semibold text-gray-900"
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
            >
              Transaction Details
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Transaction Amount Card */}
        <View className="bg-gray-50 mx-4 mt-4 rounded-2xl p-6  border border-gray-100">
          <View className="items-center">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                transaction.type === "credit" ? "bg-white " : "bg-white"
              }`}
            >
              <Ionicons
                name={transaction.type === "credit" ? "arrow-down" : "arrow-up"}
                size={28}
                color={transaction.type === "credit" ? "green" : "#EF4444"}
              />
            </View>

            <Text className="text-sm text-gray-500 mb-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              {transaction.type === "credit" ? "Incoming" : "Outgoing"}
            </Text>

            <Text className={`text-3xl font-bold mb-2 ${transaction.amount  > 0 && transaction.type === "credit" ? "text-green-800" : "text-[#F75F15]"}`}>
              {transaction.amount > 0 && transaction.type === "credit"? " + " : " - "}₦
              {Math.abs(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>

            <View className="flex-row items-center gap-2">
              <Ionicons name={getStatusIcon(transaction.status)} size={16} color={getStatusColor(transaction.status)} />
              <Text
                className={`text-base font-medium capitalize`}
                style={{ color: getStatusColor(transaction.status), fontFamily: "HankenGrotesk_500Medium" }}
              >
                {transaction.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction Details */}
        <View className="bg-gray-50 mx-4 mt-4 rounded-2xl p-6  border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
            Transaction Details
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Title
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {transaction.title}
              </Text>
            </View>


            <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Description
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {transaction.description}
              </Text>
            </View>

            <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Reference
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {transaction.reference}
              </Text>
            </View>

            <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Type
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4 capitalize"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {transaction.type === "credit" ? "Money In" : "Money Out"}
              </Text>
            </View>

            <View className="flex-row justify-between items-start py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Date
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {formatDate(transaction.date)}
              </Text>
            </View>

            <View className="flex-row justify-between items-start py-3">
              <Text className="text-sm text-gray-500" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                Time
              </Text>
              <Text
                className="text-sm text-gray-900 font-medium text-right flex-1 ml-4"
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
              >
                {formatTime(transaction.date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 mb-8 flex-row justify-between">
       
          <View className="w-[49%]">
            <SolidLightGreenButton text="Share"/>
          </View>

          <View className="w-[49%]">
            <SolidMainButton text="Download"/>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default TransactionDetails