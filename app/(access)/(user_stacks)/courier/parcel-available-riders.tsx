"use client"

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
} from "react-native"
import { useState, useRef, useCallback, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router, useLocalSearchParams } from "expo-router"
import { useToast } from "react-native-toast-notifications"
import { SolidInactiveButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useGetNearbyRides } from '@/hooks/mutations/parcelAuth'

interface Rider {
  id: number
  riders_name: string
  riders_picture: string | null
  rating: number
  vehicle_type: string
  vehicle_color: string
  plate_number?: string
  license?: string
  eta: {
    distance_km: string;
    duration_minutes: string;
    fare_amount: string;
    distance?: string; // Alternative field
  }
  latitude: number
  longitude: number
  ride_count: number
}

interface SummaryData {
  pickupAddress: string;
  dropOffAddress: string;
  recipientPhoneNumber: string;
  recipientName: string;
  alternativeDropOffAddress?: string;
  alternativeRecipientPhoneNumber?: string;
  alternativeRecipientName?: string;
  packageType: string;
  packageDescription: string;
  additionalNotes?: string;
  packageImages: any[];
}

const ParcelAvailableRiders = ({ navigation }: { navigation?: any }) => {
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const params = useLocalSearchParams()
  const toast = useToast()
  const progressAnim = useRef(new Animated.Value(0)).current

  // Call the hook after summaryData is available
  const { nearbyRides, isLoading, isError, refetch } = useGetNearbyRides(
    summaryData?.pickupAddress, 
    summaryData?.dropOffAddress
  );

  console.log('Available Riders:', riders);
  // Parse summary data on component mount
  useEffect(() => {
    if (params.summaryData) {
      try {
        const data = JSON.parse(params.summaryData as string);
        setSummaryData(data);
      } catch (error) {
        console.error('Error parsing summary data:', error);
        toast.show('Error loading summary data', { type: 'danger' });
      }
    }
  }, [params.summaryData]);

  // Handle nearby rides data
  useEffect(() => {
    if (nearbyRides?.data) {
      console.log('Available rides:', nearbyRides.data);
      setRiders(nearbyRides.data);
    }
    
    if (isError) {
      console.error('Error fetching nearby rides:', isError);
      toast.show('Error loading riders. Please refresh to retry.', { type: 'error' });
      setRiders([]);
    }
  }, [nearbyRides, isError, toast]);

  // Progress animation
  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 25000,
      useNativeDriver: false,
    }).start(() => {
      setIsWaitingForAcceptance(false)
      toast.show("No reply yet, Please select another rider.", { type: "error" })
    })
  }, [progressAnim, toast])

  const handleRiderSelect = useCallback((rider: Rider) => {
    console.log('Rider selected:', rider.riders_name, 'ID:', rider.id);
    if (selectedRider?.id === rider.id) {
      setSelectedRider(null)
      console.log('Rider deselected');
    } else {
      setSelectedRider(rider)
      console.log('New rider selected:', rider);
    }
  }, [selectedRider])

  const handleContinue = useCallback(() => {
    if (selectedRider && summaryData) {
      setIsWaitingForAcceptance(true)
      startProgressAnimation()
      
      // Here you would typically send the request to the selected rider
      console.log('Sending request to rider:', selectedRider.riders_name)
      console.log('With parcel data:', summaryData)
    }
  }, [selectedRider, summaryData, startProgressAnimation])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    
    // Reset selected rider on refresh
    setSelectedRider(null)
    
    // Refetch nearby rides
    if (summaryData && refetch) {
      refetch().finally(() => {
        setRefreshing(false)
      })
    } else {
      // Fallback timeout
      setTimeout(() => {
        setRefreshing(false)
      }, 2000)
    }
  }, [summaryData, refetch])

  const renderStarRating = useCallback((rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={12} color="orange" />)
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={12} color="orange" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#FFD700" />)
    }

    return stars
  }, [])

  const getVehicleIcon = useCallback((vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case "motorcycle":
      case "scooter":
      case "bicycle":
        return "bicycle"
      case "car":
        return "car-sport"
      default:
        return "bicycle"
    }
  }, [])

  const handleCancelRequest = useCallback(() => {
    setIsWaitingForAcceptance(false)
    progressAnim.stopAnimation()
    progressAnim.setValue(0)
    setSelectedRider(null)
  }, [progressAnim])

  // Format price helper function
  // const formatPrice = useCallback((fareAmount: string) => {
  //   // Remove any currency symbols and parse as number
  //   const numericFare = parseFloat(fareAmount.replace(/[^\d.-]/g, ''));
    
  //   if (isNaN(numericFare)) {
  //     return fareAmount; // Return original if can't parse
  //   }
    
  //   // Format with commas for thousands
  //   return `₦${numericFare.toLocaleString('en-US', { 
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0 
  //   })}`;
  // }, [])

  const RiderCard = ({ rider, isSelected }: { rider: Rider; isSelected: boolean }) => (
    <TouchableOpacity
      onPress={() => handleRiderSelect(rider)}
      className={`p-4 rounded-xl mb-3 ${
        isSelected ? "border border-[#f7c0a4] bg-[#fff7f3]" : "border border-gray-100 bg-white"
      }`}
    >
      <View className="flex-row items-center">
        <View className="relative">
          <View className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden">
            {rider?.riders_picture ? (
              <Image source={{ uri: rider?.riders_picture }} className="w-full h-full object-cover" />
            ) : (
              <View className="w-full h-full justify-center items-center">
                <MaterialIcons name="person" size={30} color="gray" />
              </View>
            )}
          </View>
          <View style={{position: 'absolute', top: 3, right: 10}} className="bg-white rounded-full justify-center items-center border border-white">
            <MaterialIcons name="verified" size={15} color="green" />
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Text
                style={{ fontFamily: "HankenGrotesk_600SemiBold" }}
                className="text-base font-semibold text-gray-900"
              >
                {rider.riders_name.toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center">
              {renderStarRating(rider.rating)}
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600 ml-1">
                {rider.rating}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-1">
            <Ionicons name={getVehicleIcon(rider.vehicle_type)} size={14} color="#666" />
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600 ml-1 mr-3">
              {rider.vehicle_color} {rider.vehicle_type}
            </Text>
            {(rider.plate_number || rider.license) && (
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600">
                {rider.plate_number || rider.license}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center">
                <Ionicons name="location" size={14} color="#F75F15" />
                <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600 ml-1">
                  {rider.eta.distance_km} km away
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#F75F15" />
                <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600 ml-1">
                  {rider.eta.duration_minutes} mins
                </Text>
              </View>
            </View>

            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-500">
              {rider.ride_count} rides
            </Text>
          </View>

          {/* Price Display */}
          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
            {/* <View className="bg-green-50 px-3 py-1 rounded-full">
              <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-green-700 text-sm">
                {rider.eta.fare_amount ? formatPrice(rider.eta.fare_amount): 'N/A'}
              </Text>
            </View> */}
            
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-500">
              Delivery Fee
            </Text>
          </View>
        </View>

        {isSelected && (
          <View className="ml-2">
            <Ionicons name="checkmark-circle" size={24} color="#F75F15" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const LoadingRidersState = () => (
    <View className="flex-1 justify-center items-center py-10">
      <ActivityIndicator size="large" color="#F75F15" />
      <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-gray-600 mt-4 text-center">
        Finding available riders...
      </Text>
      <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-gray-500 mt-2 text-center text-sm">
        Please wait while we search for riders in your area
      </Text>
    </View>
  )

  const EmptyRidersState = () => (
    <View className="flex-1 justify-center items-center py-10 pt-40">
      <Ionicons name="bicycle-outline" size={64} color="#ccc" />
      <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-gray-600 mt-4 text-lg text-center">
        No riders available
      </Text>
      <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-gray-500 mt-2 text-center text-sm px-8">
        There are no riders available in your area at the moment. Please try again later or refresh to check for updates.
      </Text>
      <TouchableOpacity
        onPress={onRefresh}
        className="bg-[#F75F15] px-6 py-3 rounded-full mt-6"
      >
        <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-sm">
          Refresh
        </Text>
      </TouchableOpacity>
    </View>
  )

  const WaitingModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isWaitingForAcceptance}
      onRequestClose={handleCancelRequest}
    >
      <View className="flex-1 justify-center items-center bg-black/70">
        <View className="bg-white rounded-3xl p-6 py-8 mx-6 w-[88%]">
          <View className="items-center">
            <View className="relative">
              {selectedRider?.riders_picture ? (
                <Image source={{ uri: selectedRider.riders_picture }} className="w-28 h-28 rounded-full mb-4" />
              ) : (
                <View className="w-28 h-28 rounded-full bg-gray-200 justify-center items-center mb-4">
                  <MaterialIcons name="person" size={40} color="gray" />
                </View>
              )}
              <View className="absolute top-0 right-0 bg-white rounded-full justify-center items-center border border-white">
                <MaterialIcons name="verified" size={26} color="green" />
              </View>
            </View>

            <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-lg text-gray-500 mb-3">
              Waiting for {selectedRider?.riders_name} ...
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xs text-green-700">
                  Verified Rider
                </Text>
              </View>
              <View className="flex-row items-center">
                {renderStarRating(selectedRider?.rating || 0)}
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600 ml-1">
                  {selectedRider?.rating}
                </Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 w-full mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600">
                  Vehicle:
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-sm text-gray-900">
                  {selectedRider?.vehicle_color} {selectedRider?.vehicle_type}
                </Text>
              </View>
              {(selectedRider?.plate_number || selectedRider?.license) && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600">
                    Plate Number:
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-sm text-gray-900">
                    {selectedRider?.plate_number || selectedRider?.license}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between items-center mb-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600">
                  Distance:
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-sm text-gray-900">
                  {selectedRider?.eta.distance || selectedRider?.eta.distance_km + ' km'} away
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600">
                  Delivery Fee:
                </Text>
                {/* <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-sm text-gray-900">
                  {selectedRider?.eta.fare_amount ? formatPrice(selectedRider.eta.fare_amount) : 'N/A'}
                </Text> */}
              </View>
            </View>

            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-gray-600 text-center mb-6 text-sm">
              We've sent your request to the rider. Please wait for them to accept your delivery request.
            </Text>

            <View className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <Animated.View
                className="bg-green-600 h-3 rounded-full"
                style={{
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            </View>

            <View className="flex-row justify-center mb-6">
              <ActivityIndicator size="small" color="#F75F15" />
            </View>

            <TouchableOpacity
              onPress={handleCancelRequest}
              className="bg-gray-200 py-4 rounded-full w-full"
            >
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-gray-700 text-center text-sm font-semibold"
              >
                Cancel Request
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  // Debug log for selectedRider state
  console.log('Current selectedRider:', selectedRider);
  console.log('Riders length:', riders.length);
  console.log('IsLoading:', isLoading);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <StatusBar style="dark" />

      <View className="flex-row justify-between items-center mb-6">
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        <Text className="text-xl" style={{ fontFamily: "HankenGrotesk_500Medium" }}>
          Available Riders
        </Text>
        <TouchableOpacity onPress={onRefresh} className="p-2" disabled={isLoading || refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isLoading || refreshing ? "#ccc" : "#F75F15"} 
          />
        </TouchableOpacity>
      </View>

      {/* Riders List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#F75F15"]}
            enabled={!isLoading}
          />
        }
      >
        {isLoading && !refreshing ? (
          <LoadingRidersState />
        ) : riders.length === 0 ? (
          <EmptyRidersState />
        ) : (
          <View className="py-4">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600 mx-4 mb-4">
              Select a rider for your parcel delivery
            </Text>

            {riders.map((rider) => (
              <RiderCard key={rider.id} rider={rider} isSelected={selectedRider?.id === rider.id} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue Button - Fixed logic */}
      {!isLoading && riders.length > 0 && (
        <View className="py-4 border-t border-gray-100">
          {selectedRider ? (
            <SolidMainButton 
              text={`Continue with ${selectedRider.riders_name}`} 
              onPress={handleContinue} 
            />
          ) : (
            <SolidInactiveButton text="Select a Rider to Continue" />
          )}
        </View>
      )}

      {/* Waiting Modal */}
      <WaitingModal />
    </SafeAreaView>
  )
}

export default ParcelAvailableRiders