"use client"
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Animated,
  Dimensions,
} from "react-native"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { Ionicons } from "@expo/vector-icons"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { Controller, useForm } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"
import { StyleSheet } from "react-native"
import { useToast } from "react-native-toast-notifications"
import LoadingOverlay from "@/components/LoadingOverlay"

// Import your custom hooks
import { useAddBank, useGetRiderBank } from "@/hooks/mutations/ridersAuth"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

// Types
interface BankDetailsFormData {
  accountNumber: string
  selectedBank: string
}

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

// API Response interface - Updated to handle different possible structures
interface BankDetailsResponse {
  account_name?: string | null
  account_number?: string | null
  bank_name?: string | null
  data?: {
    account_name?: string | null
    account_number?: string | null
    bank_name?: string | null
  }
}

const BankDetailsEdit: React.FC = () => {
  const [showBankModal, setShowBankModal] = useState<boolean>(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loadingBanks, setLoadingBanks] = useState<boolean>(true)

  // Custom modal animation
  const bankModalAnimation = useRef(new Animated.Value(0)).current

  // Account verification states
  const [accountName, setAccountName] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isAccountVerified, setIsAccountVerified] = useState<boolean>(false)

  // Use your actual custom hooks
  const { mutate: addBank, isPending: isUpdating, isError, error } = useAddBank()
  const { getRidersBank, isLoading, refetch } = useGetRiderBank()

  const toast = useToast()

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BankDetailsFormData>({
    defaultValues: {
      accountNumber: "",
      selectedBank: "",
    },
  })

  const selectedBankName = watch("selectedBank")
  const accountNumber = watch("accountNumber")

  // Get selected bank code
  const selectedBankCode = banks.find((bank) => bank.name === selectedBankName)?.code || ""

  // Helper function to safely extract bank data
  const getBankData = (response: any): BankDetailsResponse | null => {
    if (!response) return null
    let bankData: BankDetailsResponse | null = null
    
    if (response.data) {
      bankData = response.data
    } else {
      bankData = response
    }
    
    if (bankData?.data) {
      bankData = bankData.data
    }
    return bankData
  }

  useEffect(() => {
    fetchNigerianBanks()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBanks(banks)
    } else {
      const filtered = banks.filter((bank) => bank.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredBanks(filtered)
    }
  }, [searchQuery, banks])

  useEffect(() => {
    if (getRidersBank && !isLoading) {
      const bankData = getBankData(getRidersBank)
      if (bankData) {
        reset({
          accountNumber: bankData.account_number || "",
          selectedBank: bankData.bank_name || "",
        })

        if (bankData.account_name) {
          setAccountName(bankData.account_name)
          setIsAccountVerified(true)
        } else {
          setAccountName("")
          setIsAccountVerified(false)
        }
      }
    }
  }, [getRidersBank, isLoading, reset])

  // Verify account when both account number and bank are available
  useEffect(() => {
    if (accountNumber && accountNumber.length === 10 && selectedBankCode) {
      // Only verify if it's different from existing data or if not already verified
      const bankData = getBankData(getRidersBank)
      const isDifferentAccount = 
        bankData?.account_number !== accountNumber || 
        bankData?.bank_name !== selectedBankName
      
      if (isDifferentAccount || !isAccountVerified) {
        verifyAccountNumber(accountNumber, selectedBankCode)
      }
    } else {
      // Only clear if we're changing from existing data
      const bankData = getBankData(getRidersBank)
      if (
        bankData?.account_number !== accountNumber || 
        bankData?.bank_name !== selectedBankName
      ) {
        setAccountName("")
        setIsAccountVerified(false)
      }
    }
  }, [accountNumber, selectedBankCode, selectedBankName])

  // Handle mutation success/error with useEffect
  useEffect(() => {
    if (isError && error) {
      console.error("Update error:", error)
      toast.show("Error Updating Bank Details", { type: "danger" })
    }
  }, [isError, error, toast])

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
      if (data.status && data.data && data.data.account_name) {
        setAccountName(data.data.account_name)
        setIsAccountVerified(true)
      } else {
        toast.show("Please check your account details properly.", { type: "danger" })
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
    setValue("selectedBank", bank.name)
    handleCloseBankModal()
    
    // Only clear verification if it's a different bank
    const bankData = getBankData(getRidersBank)
    if (bankData?.bank_name !== bank.name) {
      setAccountName("")
      setIsAccountVerified(false)
    }
  }

  // Handle account number change
  const handleAccountNumberChange = (onChange: (value: string) => void) => (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 10)
    onChange(numericText)
    
    // Only clear verification if it's a different account number
    const bankData = getBankData(getRidersBank)
    if (bankData?.account_number !== numericText) {
      setAccountName("")
      setIsAccountVerified(false)
    }
  }

  const onSubmit = async (data: BankDetailsFormData): Promise<void> => {
    if (!isAccountVerified) {
      toast.show("Please verify your account details first", { type: "danger" })
      return
    }

    try {
      const payload = {
        account_number: data.accountNumber,
        bank_name: data.selectedBank,
        account_name: accountName,
      }

      // Use your custom hook's mutate function
      addBank(payload, {
        onSuccess: (response) => {
          toast.show("Bank Details Updated Successfully", { type: "success" })
          refetch()
          router.back()
        },
        onError: (error: any) => {
          console.error("Update error:", error.message)
          toast.show("Error Updating Bank Details", { type: "danger" })
        },
      })
    } catch (error) {
      console.error("Submit error:", error)
      toast.show("An unexpected error occurred", { type: "danger" })
    }
  }

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
      <LoadingOverlay visible={isUpdating || isLoading || loadingBanks} />

      <View className="flex-1">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 28,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View>
            <View className="flex-row items-center gap-2 mb-8">
              <OnboardArrowTextHeader onPressBtn={() => router.back()} />
              <Text className="text-2xl text-center m-auto" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                Bank Details
              </Text>
            </View>

            {/* Bank Name Selector */}
            <View className="mb-5">
              <Text style={styles.titleStyle}>Bank Name</Text>
              <Controller
                name="selectedBank"
                control={control}
                rules={{
                  required: "Bank selection is required",
                }}
                render={({ field: { value } }) => (
                  <TouchableOpacity style={styles.dropdownButton} onPress={handleOpenBankModal} activeOpacity={0.7}>
                    <Text style={[styles.dropdownText, { color: value ? "#000" : "#AFAFAF" }]}>
                      {value || "Select Bank"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#AFAFAF" />
                  </TouchableOpacity>
                )}
              />
              <ErrorMessage
                errors={errors}
                name="selectedBank"
                render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
              />
            </View>

            {/* Account Number Input */}
            <View className="mb-5">
              <Text style={styles.titleStyle}>Account Number</Text>
              <Controller
                name="accountNumber"
                control={control}
                rules={{
                  required: "Account number is required",
                  pattern: {
                    value: /^\d{10}$/,
                    message: "Account number must be exactly 10 digits",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Enter Account Number"
                    placeholderTextColor="#AFAFAF"
                    onChangeText={handleAccountNumberChange(onChange)}
                    onBlur={onBlur}
                    value={value}
                    keyboardType="number-pad"
                    style={styles.inputStyle}
                    maxLength={10}
                    autoCorrect={false}
                  />
                )}
              />
              <ErrorMessage
                errors={errors}
                name="accountNumber"
                render={({ message }) => <Text className="pl-2 pt-3 text-sm text-red-600">{message}</Text>}
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
          </View>
        </KeyboardAwareScrollView>

        {/* Fixed Save Button at Bottom */}
        <View className="px-7 pb-4 pt-2 bg-white border-t border-gray-100 mb-5">
          <SolidMainButton text="Save" onPress={handleSubmit(onSubmit)} />
        </View>
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
    </SafeAreaView>
  )
}

export default BankDetailsEdit

const styles = StyleSheet.create({
  titleStyle: {
    fontFamily: "HankenGrotesk_500Medium",
    fontSize: 14,
    color: "#3A3541",
    paddingBottom: 8,
    paddingTop: 6,
  },
  inputStyle: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "HankenGrotesk_400Regular",
    backgroundColor: "#F6F6F6",
    fontSize: 14,
  },
  dropdownButton: {
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F6F6F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
  },
  dropdownText: {
    fontFamily: "HankenGrotesk_400Regular",
    fontSize: 14,
    flex: 1,
  },
})