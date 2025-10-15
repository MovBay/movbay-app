"use client"

import React from "react"
import { View, Text, ScrollView, Alert, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { router, useLocalSearchParams } from "expo-router"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { useGetTransaction } from "@/hooks/mutations/sellerAuth"
import { useMemo } from "react"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SolidLightGreenButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "successful": return "#22C55E"
    case "pending": return "#F59E0B"
    case "failed": return "#EF4444"
    default: return "#6B7280"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "successful": return "checkmark-circle"
    case "pending": return "time-outline"
    case "failed": return "close-circle"
    default: return "help-circle"
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

// Generate styled HTML for printing PDF
const generateReceiptHTML = (tx: Transaction) => `
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    .receipt-container {
      background: white;
      max-width: 90%;
      width: 100%;
      max-height: 90vh;
      height: 100vh;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #F75F15 0%, #E54D0A 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: 2px;
    }
    
    .header-subtitle {
      font-size: 17px;
      opacity: 0.95;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: ${tx.status === "successful" ? "#F75F15" : tx.status === "pending" ? "#FFA726" : "#EF5350"};
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 600;
      margin: 20px auto 0;
      text-transform: uppercase;
    }
    
    .status-icon {
      display: inline-block;
      width: 18px;
      height: 18px;
      margin-right: 6px;
      background: white;
      border-radius: 50%;
      line-height: 18px;
      text-align: center;
      color: ${tx.status === "successful" ? "#F75F15" : tx.status === "pending" ? "#FFA726" : "#EF5350"};
      font-size: 12px;
    }
    
    .amount-section {
      text-align: center;
      padding: 30px 20px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .amount-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .amount-value {
      font-size: 36px;
      font-weight: bold;
      color: ${tx.type === "credit" ? "#F75F15" : "#EF5350"};
    }
    
    .details-section {
      padding: 20px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 10px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-size: 18px;
      color: #888;
    }
    
    .detail-value {
      font-size: 18px;
      color: #333;
      font-weight: 500;
      text-align: right;
      max-width: 60%;
      word-wrap: break-word;
    }
    
    .description-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    .description-label {
      font-size: 15px;
      color: #888;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .description-text {
      font-size: 15px;
      color: #333;
      line-height: 1.5;
    }
    
    .footer {
      text-align: center;
      padding: 25px 20px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer-text {
      font-size: 15px;
      color: #999;
      line-height: 1.6;
    }
    
    .movbay-support {
      color: #F75F15;
      font-weight: 600;
      margin-top: 8px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <div class="logo">Movbay</div>
      <div class="header-subtitle">Transaction Receipt</div>
      <div class="status-badge">
        <span class="status-icon">${tx.status === "successful" ? "✓" : tx.status === "pending" ? "⏱" : "✕"}</span>
        ${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
      </div>
    </div>
    
    <div class="amount-section">
      <div class="amount-label">Amount</div>
      <div class="amount-value">
        ${tx.type === "credit" ? "+" : "-"}₦${tx.amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
      </div>
    </div>
    
    <div class="details-section">
      <div class="detail-row">
        <span class="detail-label">Transaction Type</span>
        <span class="detail-value">${tx.type === "credit" ? "Money In" : "Money Out"}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Title</span>
        <span class="detail-value">${tx.title}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">${tx.type === "credit" ? "Sender" : "Recipient"}</span>
        <span class="detail-value">${tx.recipient}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Reference</span>
        <span class="detail-value">${tx.reference}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${formatDate(tx.date)} ${formatTime(tx.date)}</span>
      </div>
      
      ${tx.description ? `
      <div class="description-box">
        <div class="description-label">Description</div>
        <div class="description-text">${tx.description}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <div class="footer-text">
        Questions? Contact Movbay Support
        <span class="movbay-support">support@movbay.com</span>
      </div>
    </div>
  </div>
</body>
</html>
`

const TransactionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isLoading, transactionData } = useGetTransaction()
  const myTransactionData = transactionData?.data?.results

  const transaction: Transaction | null = useMemo(() => {
    if (!myTransactionData || !Array.isArray(myTransactionData) || !id) return null
    const apiTransaction = myTransactionData.find((item: any) => item.id.toString() === id)
    if (!apiTransaction) return null

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
      reference: apiTransaction.reference_code || `TXN${apiTransaction.id.toString().padStart(9, "0")}`,
    }
  }, [myTransactionData, id])

  const onShareReceipt = async () => {
    if (!transaction) {
      Alert.alert("No transaction to share")
      return
    }
    try {
      const html = generateReceiptHTML(transaction)
      const { uri } = await Print.printToFileAsync({ html })

      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        Alert.alert("Sharing is not available on this device")
        return
      }

      // Create a meaningful filename
      const dateStr = new Date(transaction.date).toISOString().split('T')[0]
      const fileName = `Movbay_Receipt_${dateStr}.pdf`
      const newPath = FileSystem.documentDirectory + fileName

      // Copy with the new name
      await FileSystem.copyAsync({
        from: uri,
        to: newPath,
      })

      await Sharing.shareAsync(newPath, {
        dialogTitle: "Share Transaction Receipt",
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      Alert.alert("Error sharing receipt", String(error))
    }
  }


  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <LoadingOverlay visible={isLoading} />
        <View>
          <View className="px-5 pt-3 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl text-center m-auto font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
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
        <View>
          <View className="px-5 pt-3 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-xl text-center m-auto font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View>
        <View className="px-5 pt-3 pb-4 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            <Text className="text-xl text-center m-auto font-semibold text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              Transaction Details
            </Text>
          </View>
        </View>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-gray-50 mx-4 mt-4 rounded-2xl p-6 border border-gray-100">
          <View className="items-center">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 bg-white`}>
              <Ionicons
                name={transaction.type === "credit" ? "arrow-down" : "arrow-up"}
                size={28}
                color={transaction.type === "credit" ? "green" : "#EF4444"}
              />
            </View>
            <Text className="text-sm text-gray-500 mb-2" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              {transaction.type === "credit" ? "Incoming" : "Outgoing"}
            </Text>
            <Text
              className={`text-3xl font-bold mb-2 ${
                transaction.amount > 0 && transaction.type === "credit" ? "text-green-800" : "text-[#F75F15]"
              }`}
            >
              {transaction.amount > 0 && transaction.type === "credit" ? " + " : " - "}₦
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

        <View className="bg-gray-50 mx-4 mt-4 rounded-2xl p-6 border border-gray-100">
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

        <View className="mx-4 mt-6 mb-8 flex-row justify-between">
          <View className="w-[100%]">
            <SolidMainButton text="Share" onPress={onShareReceipt} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default TransactionDetails
