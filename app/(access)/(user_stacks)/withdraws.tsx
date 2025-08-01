"use client"

import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from "react-native"
import { useState, useEffect, useRef } from "react"
import { useProfile } from "@/hooks/mutations/auth"
import { router } from "expo-router"
import LoadingOverlay from "@/components/LoadingOverlay"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import Ionicons from "@expo/vector-icons/Ionicons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { useToast } from "react-native-toast-notifications"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

interface Bank {
  name: string
  code: string
  longcode: string
  gateway: string
  pay_with_bank: boolean
  active: boolean
  country: string
  currency: string
  type: string
  is_deleted: boolean
  createdAt: string
  updatedAt: string
  id: number
}

const FundsWithdraw = () => {
  const toast = useToast()
  const { isLoading, profile } = useProfile()
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [selectedBankName, setSelectedBankName] = useState<string>("")
  const [accountNumber, setAccountNumber] = useState<string>("")
  const [accountName, setAccountName] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isAccountVerified, setIsAccountVerified] = useState<boolean>(false)
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [loadingBanks, setLoadingBanks] = useState<boolean>(true)

  // Search modal states
  const [showBankModal, setShowBankModal] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([])

  // Custom modal animation
  const bankModalAnimation = useRef(new Animated.Value(0)).current

  // Bottom sheet states
  const [showConfirmationBottomSheet, setShowConfirmationBottomSheet] = useState<boolean>(false)
  const bottomSheetAnimation = useRef(new Animated.Value(0)).current
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false)

  // Transaction fee (you can make this dynamic based on your business logic)
  const transactionFee = 10.0

  // Fetch Nigerian banks from Paystack API
  useEffect(() => {
    fetchNigerianBanks()
  }, [])

  // Filter banks based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBanks(banks)
    } else {
      const filtered = banks.filter((bank) => bank.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredBanks(filtered)
    }
  }, [searchQuery, banks])

  const fetchNigerianBanks = async () => {
    try {
      setLoadingBanks(true)
      const response = await fetch("https://api.paystack.co/bank?country=nigeria", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (data.status && data.data) {
        setBanks(data.data)
        setFilteredBanks(data.data)
      } else {
        toast.show("Failed to fetch banks", { type: "danger" })
      }
    } catch (error) {
      console.error("Error fetching banks:", error)
      toast.show("Failed to fetch banks. Please check your internet connection.", { type: "danger" })
    } finally {
      setLoadingBanks(false)
    }
  }

  // Verify account number with selected bank
  const verifyAccountNumber = async (accountNum: string, bankCode: string) => {
    if (accountNum.length !== 10 || !bankCode) return

    try {
      setIsVerifying(true)
      setAccountName("")
      setIsAccountVerified(false)
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNum}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer sk_test_9c897c15e718e0091878ff196448c02abb202c27",
            "Content-Type": "application/json",
          },
        },
      )
      const data = await response.json()
      console.log("this is the data", data)
      if (data.status && data.data) {
        setAccountName(data.data.account_name)
        setIsAccountVerified(true)
      } else {
        toast.show("Please check your the account details properly.", { type: "danger" })
        setIsAccountVerified(false)
      }
    } catch (error) {
      console.error("Error verifying account:", error)
      toast.show("Failed to verify account number.", { type: "danger" })
      setIsAccountVerified(false)
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle account number change
  const handleAccountNumberChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 10)
    setAccountNumber(numericText)
    if (numericText !== accountNumber) {
      setAccountName("")
      setIsAccountVerified(false)
    }
    if (numericText.length === 10 && selectedBank) {
      verifyAccountNumber(numericText, selectedBank)
    }
  }

  // Custom modal animations
  const showBankModalWithAnimation = () => {
    setSearchQuery("")
    setFilteredBanks(banks)
    setShowBankModal(true)
    Animated.timing(bankModalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const hideBankModalWithAnimation = () => {
    Animated.timing(bankModalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBankModal(false)
      setSearchQuery("")
      setTimeout(() => {
        setFilteredBanks(banks)
      }, 100)
    })
  }

  // Handle opening bank modal
  const handleOpenBankModal = () => {
    showBankModalWithAnimation()
  }

  // Handle closing bank modal
  const handleCloseBankModal = () => {
    hideBankModalWithAnimation()
  }

  // Handle bank selection
  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank.code)
    setSelectedBankName(bank.name)
    handleCloseBankModal()
    setAccountName("")
    setIsAccountVerified(false)
    if (accountNumber.length === 10) {
      verifyAccountNumber(accountNumber, bank.code)
    }
  }

  // Format amount input
  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9.]/g, "")
    setAmount(numericText)
  }

  // Format amount for display
  const formatAmount = (amount: string | number) => {
    if (!amount) return ""
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(num)) return ""
    return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Bottom sheet animations
  const showBottomSheet = () => {
    setShowConfirmationBottomSheet(true)
    Animated.timing(bottomSheetAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const hideBottomSheet = () => {
    Animated.timing(bottomSheetAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowConfirmationBottomSheet(false)
    })
  }

  const handleNext = () => {
    if (!selectedBank) {
      toast.show("Please select a bank", { type: "danger" })
      return
    }
    if (!accountNumber || accountNumber.length !== 10) {
      toast.show("Please enter a valid 10-digit account number", { type: "danger" })
      return
    }
    if (!isAccountVerified) {
      toast.show("Please check your the account details properly.", { type: "danger" })
      return
    }
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.show("Please enter a valid amount", { type: "danger" })
      return
    }
    // Show confirmation bottom sheet
    showBottomSheet()
  }

  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true)

      // Simulate API call for withdrawal
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.show("Withdrawal request submitted successfully!", { type: "success" })
      hideBottomSheet()

      // Navigate back or to success screen
      router.back()
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.show("Failed to process withdrawal. Please try again.", { type: "danger" })
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Fixed keyExtractor to ensure unique keys
  const renderBankItem = ({ item, index }: { item: Bank; index: number }) => (
    <TouchableOpacity
      onPress={() => handleBankSelect(item)}
      className="px-4 py-4 border-b border-gray-100"
      activeOpacity={0.7}
      key={index}
    >
      <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: "#333" }}>{item.name}</Text>
    </TouchableOpacity>
  )

  const bottomSheetTranslateY = bottomSheetAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  })

  const backdropOpacity = bottomSheetAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  })

  // Custom modal animations
  const bankModalTranslateY = bankModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  })

  const bankModalBackdropOpacity = bankModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  })

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={loadingBanks} />
      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center gap-2 mb-8">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Withdraw
              </Text>
            </View>

            {/* Bank Selection */}
            <View className="mb-6">
              <Text className="text-base mb-3" style={{ fontFamily: "HankenGrotesk_500Medium", color: "#333" }}>
                Bank
              </Text>
              <TouchableOpacity
                onPress={handleOpenBankModal}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 7,
                  backgroundColor: "#F6F6F6",
                  height: 56,
                  justifyContent: "center",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "HankenGrotesk_400Regular",
                    fontSize: 15,
                    color: selectedBankName ? "#000" : "#AFAFAF",
                    flex: 1,
                  }}
                >
                  {selectedBankName || "Select a Bank"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#AFAFAF" />
              </TouchableOpacity>
            </View>

            {/* Account Number */}
            <View className="mb-4">
              <Text className="text-base mb-3" style={{ fontFamily: "HankenGrotesk_500Medium", color: "#333" }}>
                Account Number
              </Text>
              <TextInput
                value={accountNumber}
                onChangeText={handleAccountNumberChange}
                placeholder="Enter 10-digit account number"
                keyboardType="number-pad"
                maxLength={10}
                style={{
                  fontFamily: "HankenGrotesk_400Regular",
                  color: "#000",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 7,
                  backgroundColor: "#F6F6F6",
                  fontSize: 15,
                }}
                placeholderTextColor="#AFAFAF"
              />
            </View>

            {/* Account Name Verification */}
            {(isVerifying || accountName) && (
              <View
                className="mb-6 px-4 py-3 rounded-lg"
                style={{ backgroundColor: isAccountVerified ? "#E8F5E8" : "#FFF3E0" }}
              >
                <View className="flex-row items-center justify-between">
                  {isVerifying ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#FF6B35" />
                      <Text className="ml-2 text-sm" style={{ fontFamily: "HankenGrotesk_400Regular", color: "#666" }}>
                        Verifying account...
                      </Text>
                    </View>
                  ) : accountName ? (
                    <View className="flex-row items-center justify-between flex-1">
                      <Text className="text-base text-[#4CAF50]" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
                        {accountName}
                      </Text>
                      {isAccountVerified && (
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#4CAF50" }}
                        >
                          <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Amount */}
            <View className="mb-6">
              <Text className="text-base mb-3" style={{ fontFamily: "HankenGrotesk_500Medium", color: "#333" }}>
                Amount
              </Text>
              <TextInput
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                keyboardType="number-pad"
                style={{
                  fontFamily: "HankenGrotesk_600SemiBold",
                  color: "#000",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 7,
                  backgroundColor: "#F6F6F6",
                  fontSize: 15,
                }}
                placeholderTextColor="#AFAFAF"
              />
              {amount && (
                <Text className="mt-2 text-right" style={{ fontFamily: "HankenGrotesk_400Regular", color: "#666" }}>
                  {formatAmount(amount)}
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-8">
              <Text className="text-base mb-3" style={{ fontFamily: "HankenGrotesk_500Medium", color: "#333" }}>
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Write a short description"
                multiline
                numberOfLines={3}
                style={{
                  fontFamily: "HankenGrotesk_400Regular",
                  color: "#000",
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 7,
                  backgroundColor: "#F6F6F6",
                  minHeight: 80,
                  fontSize: 15,
                  textAlignVertical: "top",
                }}
                placeholderTextColor="#AFAFAF"
              />
            </View>

            {/* Next Button */}
            <View className="px-0 pb-4 pt-2">
              <SolidMainButton onPress={handleNext} text="Next" />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>

      {/* Custom Bank Selection Modal */}
      {showBankModal && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          {/* Backdrop */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "black",
              opacity: bankModalBackdropOpacity,
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseBankModal} />
          </Animated.View>

          {/* Modal Content */}
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              top: 0,
              backgroundColor: "white",
              transform: [{ translateY: bankModalTranslateY }],
            }}
          >
            <SafeAreaView className="flex-1 bg-white">
              <View className="flex-1">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#333" }}>
                    Select Bank
                  </Text>
                  <TouchableOpacity onPress={handleCloseBankModal} activeOpacity={0.7}>
                    <Ionicons name="close" size={20} color="#333" />
                  </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View className="px-4 py-3 border-b border-[#F6F6F6]">
                  <View className="flex-row items-center bg-[#F6F6F6] rounded-lg px-3 py-2">
                    <Ionicons name="search" size={20} color="#AFAFAF" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      className="py-2.5 black"
                      placeholder="Search banks..."
                      style={{
                        fontFamily: "HankenGrotesk_400Regular",
                        fontSize: 14,
                        color: "gray",
                        marginLeft: 8,
                        flex: 1,
                      }}
                      placeholderTextColor="#AFAFAF"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={20} color="#AFAFAF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Banks List */}
                <FlatList
                  data={filteredBanks}
                  renderItem={renderBankItem}
                  keyExtractor={(item, index) => `${item.id}-${item.code}-${index}`}
                  showsVerticalScrollIndicator={false}
                  extraData={filteredBanks}
                  ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-8">
                      <Text style={{ fontFamily: "HankenGrotesk_400Regular", color: "#666", fontSize: 14 }}>
                        No banks found
                      </Text>
                    </View>
                  }
                />
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}

      {/* Confirmation Bottom Sheet */}
      {showConfirmationBottomSheet && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Backdrop */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "black",
              opacity: backdropOpacity,
            }}
          >
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={hideBottomSheet} />
          </Animated.View>

          {/* Bottom Sheet */}
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              transform: [{ translateY: bottomSheetTranslateY }],
              paddingBottom: 34,
            }}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Close Button */}
            <View className="absolute top-4 right-4 z-10">
              <TouchableOpacity
                onPress={hideBottomSheet}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="px-6 pb-6">
              {/* Amount */}
              <View className="items-center mb-8 mt-4">
                <Text
                  style={{
                    fontFamily: "HankenGrotesk_700Bold",
                    fontSize: 30,
                    color: "#FF6B35",
                    textAlign: "center",
                  }}
                >
                  {formatAmount(amount)}
                </Text>
              </View>

              {/* Recipient Details */}
              <View className="flex-row items-center mb-6">
                <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-2">
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: "white" }}>
                    {selectedBankName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: "#333", marginBottom: 2 }}
                  >
                    {accountName}
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 12, color: "#666" }}>
                    {accountNumber} • {selectedBankName}
                  </Text>
                </View>
              </View>

              {/* Transaction Fee */}
              <View className="flex-row justify-between items-center mb-6">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 16, color: "#333" }}>
                  Transaction Fee
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#333" }}>
                  {formatAmount(transactionFee)}
                </Text>
              </View>

              {/* Remark */}
              {description && (
                <View className="mb-6">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 16, color: "#333", marginBottom: 8 }}>
                    Remark
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 14, color: "#666", lineHeight: 20 }}>
                    {description}
                  </Text>
                </View>
              )}

              {/* Withdraw Button */}
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={isWithdrawing}
                style={{
                  backgroundColor: "#FF6B35",
                  paddingVertical: 15,
                  borderRadius: 25,
                  alignItems: "center",
                  marginTop: 20,
                  opacity: isWithdrawing ? 0.7 : 1,
                }}
                activeOpacity={0.8}
              >
                {isWithdrawing ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text
                      className="ml-2"
                      style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 14, color: "white" }}
                    >
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 14, color: "white" }}>
                    Withdraw
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  )
}

export default FundsWithdraw
