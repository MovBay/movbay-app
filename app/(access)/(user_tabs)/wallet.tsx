import { View, Text, Pressable, RefreshControl, TouchableOpacity, FlatList } from 'react-native'
import React, { useState, useMemo } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { useGetWalletDetails, useGetTransaction } from '@/hooks/mutations/sellerAuth'
import { StatusBar } from 'expo-status-bar'
import LoadingOverlay from '@/components/LoadingOverlay'

// Transaction interface (matching your transaction screen)
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

const Wallet = () => {
  const [viewBalance, setViewBalance] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const {walletData, isLoading, refetch} = useGetWalletDetails()
  const { isLoading: transactionLoading, transactionData } = useGetTransaction()

  const myTransactionData = transactionData?.data?.results
    const insets = useSafeAreaInsets()
  

  // Transform API data to match Transaction interface (same logic from transactions screen)
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

  // Get only the first 5 transactions for wallet display
  const previewTransactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Error refreshing wallet data:', error)
    } finally {
      setRefreshing(false)
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

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      className="bg-gray-50 mb-3 rounded-2xl p-4 border border-gray-100"
      onPress={() => router.push(`/transaction-details/${item.id}` as any)}
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
            item.type === "credit" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Ionicons
            name={item.type === "credit" ? "arrow-up" : "arrow-down"}
            size={18}
            color={item.type === "credit" ? "#22C55E" : "#EF4444"}
          />
        </View>

        {/* Transaction Details */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1 mr-3">
                {item.title.length > 20 ?
                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-semibold text-gray-900 mb-1">{item.title.slice(0, 20)}...</Text>:
                    <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
                }
              <Text className="text-sm text-gray-500 mb-1">{item.recipient}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-400">
                  {formatDate(item.date)} • {formatTime(item.date)}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className={`text-base font-semibold mb-1 ${item.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                {item.amount > 0 ? "+" : ""}₦
                {Math.abs(item.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name={getStatusIcon(item.status) as any} size={12} color={getStatusColor(item.status)} />
                <Text style={{fontFamily: 'HankenGrotesk_400Regular', color: getStatusColor(item.status)}} className={`text-xs font-medium capitalize`}>
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
    <SafeAreaView className='flex-1 bg-white px-5'>
      <StatusBar style='dark'/>
      <LoadingOverlay visible={isLoading || transactionLoading} />
      
      <View className='flex-1'>
        {/* Fixed Header Content */}
        <View className='pt-5'>
          <Text className='text-2xl' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>My Wallet</Text>
          <Text className='text-base' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Manage your balance, payments, and earnings.</Text>
        </View>

        {/* Fixed Wallet Balance Card */}
        <View className='bg-[#F75F15] p-7 mt-5 rounded-3xl shadow-slate-400'>
          <View className='flex-row m-auto gap-3 items-center pb-3'>
            <Text className='text-base text-orange-100' style={{fontFamily: 'HankenGrotesk_400Regular'}}>Wallet Balance</Text>
            <Pressable onPress={()=>setViewBalance(!viewBalance)}>
              <Ionicons name={viewBalance === false ? 'eye-sharp' : 'eye-off-sharp'} color={'#F2F2F2'} size={20}/>
            </Pressable>
          </View>

          <Text className='text-2xl text-center text-white' style={{fontFamily: 'HankenGrotesk_700Bold'}}>₦ {viewBalance === false ? '********' : walletData?.data?.balance.toLocaleString()}.00</Text>

          <View className='flex-row justify-between pt-4'>
            <Pressable className='bg-[#FEEEE6] w-[48%] p-2 px-4 rounded-full flex-row items-center gap-3' onPress={()=>router.push('/(access)/(user_stacks)/add-funds')}>
              <View className='bg-white rounded-full p-1.5'>
                <MaterialIcons name='arrow-upward' size={20} color={'black'}/>
              </View>
              <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Add Funds</Text>
            </Pressable>

            <Pressable className='bg-[#FEEEE6] w-[48%] p-2 px-4 rounded-full flex-row items-center gap-3' onPress={()=>router.push('/(access)/(user_stacks)/withdraws')}>
              <View className='bg-white rounded-full p-1.5'>
                <MaterialIcons name='arrow-downward' size={20} color={'black'}/>
              </View>
              <Text className='text-base' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        {/* Fixed Stats Cards */}
        <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(300).delay(200).springify()}>
          <View className='bg-[#ECFDF2] p-5 rounded-2xl w-[49%]'>
            <View className=''>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-green-700'>₦ {walletData?.data?.total_deposit.toLocaleString()}.00</Text>
            </View>
            <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Total Deposit</Text>
          </View>

          <View className='bg-orange-50 p-5 rounded-2xl w-[49%]'>
            <View className=''>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-orange-600'>₦ {walletData?.data?.total_withdrawal}</Text>
            </View>
            <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Total Withdrawal</Text>
          </View>
        </Animated.View>

        <Animated.View className='flex-row justify-between pt-5' entering={FadeInDown.duration(400).delay(300).springify()}>
          <View className='bg-[#F3EBFF] p-5 rounded-2xl w-[49%]'>
            <View className='flex-row justify-between'>
              <Text style={{fontFamily: 'HankenGrotesk_500Medium'}} className='text-xl text-purple-600'>₦ 0</Text>
              <View className='flex-row gap-1 items-center'>
                <Ionicons name='trending-up' color={'green'} size={15}/>
                <Text className='text-green-700 text-base' style={{fontFamily: 'HankenGrotesk_500Medium'}}>28%</Text>
              </View>
            </View>
            <Text className='text-base pt-2.5' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Earnings This Month</Text>
          </View>

          <Pressable className='bg-gray-100 p-5 rounded-2xl w-[49%]' onPress={()=>router.push('/(access)/(user_stacks)/add-funds')}>
            <MaterialIcons name='add' size={25} style={{margin: 'auto'}}/>
            <Text className='text-base pt-1 text-center' style={{fontFamily: 'HankenGrotesk_500Medium'}}>Top Wallet</Text>
          </Pressable>
        </Animated.View>

        {/* Transaction History Section - Now Scrollable */}
        <View className='pt-5  flex-1'>
          <View className='flex-row justify-between items-center pb-2'>
            <Text className='text-lg' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>Transaction History</Text>
            <Pressable className='flex-row items-center gap-2 bg-orange-50 p-3 px-4 rounded-md' onPress={()=>router.push('/(access)/(user_stacks)/transactions')}>
              <Text className='text-sm text-[#F75F15]' style={{fontFamily: 'HankenGrotesk_600SemiBold'}}>View more</Text>
              <MaterialIcons name='arrow-forward' color={'#F75F15'}/>
            </Pressable>
          </View>

          {/* Scrollable Transaction List */}
          {previewTransactions.length > 0 ? (
            <FlatList
              data={previewTransactions}
              renderItem={renderTransaction}

              keyExtractor={(item) => item.id}
              className='pt-1'
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 30,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#F75F15']} // Android
                  tintColor='#F75F15' // iOS
                />
              }
            />
          ) : (
            <View className='pt-14 pb-10'>
              <View className='bg-gray-100 p-4 rounded-full w-fit m-auto items-center'>
                <MaterialIcons name='history' size={26}/>
              </View>
              <Text className='text-base text-center text-neutral-500 pt-3' style={{fontFamily: 'HankenGrotesk_500Medium'}}>No Transaction Details</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Wallet