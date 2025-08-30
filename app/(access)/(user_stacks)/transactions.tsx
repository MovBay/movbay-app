"use client"

import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from "react-native"
import { useState, useMemo } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import LoadingOverlay from "@/components/LoadingOverlay"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router } from "expo-router"
import { SolidMainButton } from "@/components/btns/CustomButtoms"
import { useGetTransaction } from "@/hooks/mutations/sellerAuth"

// Transaction interface
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

// Filter interface
export interface FilterState {
  type: "all" | "credit" | "debit"
}

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "title">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    type: "all",
  })

  const { isLoading, transactionData } = useGetTransaction()
  const myTransactionData = transactionData?.data?.results
  console.log('This is the data', transactionData?.data?.results)

  // Transform API data to match Transaction interface
  const transactions: Transaction[] = useMemo(() => {
    if (!myTransactionData || !Array.isArray(myTransactionData)) {
      return []
    }

    return myTransactionData.map((item: any) => ({
      id: item.id.toString(),
      title: item.content || "Transaction",
      amount: item.type === "Account-Funded" ? 0 : 0, // You may need to adjust this based on actual amount field
      date: item.created_at,
      status: "successful" as const, // You may need to map this based on your API response
      type: item.type === "Account-Funded" ? "credit" : "debit" as const,
      description: item.content || "",
      recipient: item.type === "Account-Funded" ? "Account Funding" : "Item Purchase",
      reference: `TXN${item.id.toString().padStart(9, '0')}`,
    }))
  }, [myTransactionData])

  // Filter options
  const typeOptions: FilterState["type"][] = ["all", "credit", "debit"]

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      // Search filter
      const matchesSearch =
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.recipient.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = selectedFilters.type === "all" || transaction.type === selectedFilters.type

      return matchesSearch  && matchesType
    })

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount)
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchQuery, selectedFilters, sortBy, sortOrder])

  const handleSort = (field: "date" | "amount" | "title") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const getStatusColor = (status: Transaction["status"]): string => {
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

  const getStatusIcon = (status: Transaction["status"]): string => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const FilterModal = () => (
    <Modal visible={showFilters} transparent={true} animationType="slide" onRequestClose={() => setShowFilters(false)}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-4/5">
          <View className="flex-row justify-between items-center mb-6">
            <Text  className="text-lg font-bold text-gray-900" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
              Filter Transactions
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
       
            {/* Type Filter */}
            <View className="mb-8">
              <Text 
                className="text-base font-semibold text-gray-600 mb-3"
                style={{ fontFamily: "HankenGrotesk_400Regular" }}
              >
                Transaction Type
              </Text>
              <View className="flex-row gap-3">
                {typeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedFilters((prev) => ({ ...prev, type }))}
                    className={`px-6 py-2 rounded-full border items-center ${
                      selectedFilters.type === type ? "border-gray-100" : "border-gray-200 bg-[#F6F6F6]"
                    }`}
                    style={{
                      backgroundColor: selectedFilters.type === type ? "gray" : undefined,
                    }}
                  >
                    <Text 
                      className={`font-medium text-sm capitalize ${
                        selectedFilters.type === type ? "text-white" : "text-gray-600"
                      }`}
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    >
                      {type === "all" ? "All" : type === "credit" ? "Money In" : "Money Out"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters Button */}
            <SolidMainButton text="Clear Filter" onPress={() => setSelectedFilters({type: "all" })}/>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      className="bg-gray-50 mx-4 mb-3 rounded-2xl p-4 border border-gray-100"
      onPress={() => router.push(`/transaction-details/${item.id}` as any)}
    >
      <View className="flex-row items-start">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            item.type === "credit" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Ionicons
            name={item.type === "credit" ? "arrow-down" : "arrow-up"}
            size={15}
            color={item.type === "credit" ? "#22C55E" : "#EF4444"}
          />
        </View>

        {/* Transaction Details */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1 mr-3">
                {item.title.length > 24 ?
                    <Text  style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-semibold text-gray-900 mb-1">{item.title.slice(0, 24)}...</Text>:
                    <Text  style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
                }
              <Text  className="text-sm text-gray-500 mb-1">{item.recipient}</Text>
              <View className="flex-row items-center gap-2">
                <Text  className="text-xs text-gray-400">
                  {formatDate(item.date)} • {formatTime(item.date)}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}}  className={`text-lg font-semibold mb-1 ${item.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                {item.amount > 0 ? "+" : ""}₦
                {Math.abs(item.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name={getStatusIcon(item.status) as any} size={12} color={getStatusColor(item.status)} />
                <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: getStatusColor(item.status)}}  className={`text-xs font-medium capitalize`}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading} />

      {/* Header */}
      <View className="">
        <View className="px-5 pt-3 pb-2 border-b border-gray-100">
          <View className="flex-row items-center gap-2">
            <OnboardArrowTextHeader onPressBtn={() => router.back()} />
            <Text style={{fontFamily: 'HankenGrotesk_500Medium'}}  className="text-xl text-center m-auto font-semibold text-gray-900">Transaction History</Text>
          </View>
        </View>

        {/* Search and Filters Section */}
        <View className="px-5 py-4">
          {/* Search Bar */}
          <View className="flex-row bg-gray-100 rounded-full px-4 py-4 items-center mb-6">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search transactions, recipients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{fontFamily: 'HankenGrotesk_400Regular'}}
            />
          </View>

          {/* Filter and Sort Controls */}
          <View className="flex-row justify-between items-center">
            {/* Sort Controls */}
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => handleSort("date")}
                className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100"
              >
                <Text  className={`text-sm font-medium ${sortBy === "date" ? "text-green-700" : "text-gray-600"}`}>
                  Date
                </Text>
                <Ionicons
                  name={sortBy === "date" && sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                  size={14}
                  color={sortBy === "date" ? "green" : "#9CA3AF"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSort("amount")}
                className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-gray-100"
              >
                <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className={`text-sm font-medium ${sortBy === "amount" ? "text-green-700" : "text-gray-600"}`}>
                  Amount
                </Text>
                <Ionicons
                  name={sortBy === "amount" && sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                  size={14}
                  color={sortBy === "amount" ? "green" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            {/* Filter Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className="flex-row items-center gap-2 bg-[#F75F15] px-4 py-2 rounded-full"
            >
              <Ionicons name="options-outline" size={16} color="white" />
              <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className="text-white font-medium text-sm">Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Results Count */}
      <View className="px-5 py-2 pt-5">
        <Text  className="text-sm text-gray-500" style={{fontFamily: 'HankenGrotesk_400Regular'}}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
            </View>
            <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className="text-lg font-semibold text-gray-900 mb-2">No transactions found</Text>
            <Text style={{fontFamily: 'HankenGrotesk_400Regular'}} className="text-sm text-gray-500 text-center px-8">
              {isLoading ? "Loading transactions..." : "Try adjusting your search terms or filters to find what you're looking for"}
            </Text>
          </View>
        )}
      />

      <FilterModal />
    </SafeAreaView>
  )
}

export default Transactions