"use client"

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
} from "react-native"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { router, useLocalSearchParams } from "expo-router"
import { useToast } from "react-native-toast-notifications"
import { SolidInactiveButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useGetNearbyRides, useSendRidersRequest } from '@/hooks/mutations/parcelAuth'
import LoadingOverlay from "@/components/LoadingOverlay"

interface Rider {
  riders_id: string
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
    distance?: string;
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

// Custom Modal Component
const CustomModal = ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) => {
  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      paddingHorizontal: 20,
    }}>
      {children}
    </View>
  );
};

const ParcelAvailableRiders = ({ navigation }: { navigation?: any }) => {
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null)
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const params = useLocalSearchParams()
  const toast = useToast()
  const progressAnim = useRef(new Animated.Value(0)).current

  // Call the hook after summaryData is available
  const {mutate, isPending} = useSendRidersRequest(selectedRiderId)
  const { nearbyRides, isLoading, isError, refetch } = useGetNearbyRides(
    summaryData?.pickupAddress, 
    summaryData?.dropOffAddress
  );

  // Get selected rider object using riders_id
  const selectedRider = useMemo(() => {
    if (!selectedRiderId) return null;
    return riders.find(rider => rider.riders_id === selectedRiderId) || null;
  }, [riders, selectedRiderId])

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
      setSelectedRiderId(null);
    }
    
    if (isError) {
      console.error('Error fetching nearby rides:', isError);
      toast.show('Error loading riders. Please refresh to retry.', { type: 'error' });
      setRiders([]);
      setSelectedRiderId(null);
    }
  }, [nearbyRides, isError, toast]);

  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 150000,
      useNativeDriver: false,
    }).start(() => {
      setIsWaitingForAcceptance(false)
      toast.show("No reply yet, Please select another rider.", { type: "error" })
    })
  }, [progressAnim, toast])

  const handleRiderSelect = useCallback((rider: Rider) => {
    console.log('Rider selected:', rider);
    if (selectedRiderId === rider.riders_id) {
      setSelectedRiderId(null)
    } else {
      setSelectedRiderId(rider.riders_id)
    }
  }, [selectedRiderId])

  // Modified handleContinue function
  const handleContinue = useCallback(() => {
    if (selectedRider && summaryData) {
      console.log('With parcel data:', summaryData)

      const payload = {
        recipient_name: summaryData.recipientName,
        pick_address: summaryData.pickupAddress,
        drop_address: summaryData.dropOffAddress,
        alternative_drop_address: summaryData.alternativeDropOffAddress || "",
        alternative_recipient_name: summaryData.alternativeRecipientName || "",
        alternative_number: summaryData.alternativeRecipientPhoneNumber || "",
        package_type: summaryData.packageType,
        package_description: summaryData.packageDescription,
        packageimages: summaryData.packageImages || []
      };

      console.log('Payload to be sent:', payload);

      // Send the request
      mutate(payload, {
        onSuccess: (response) => {
          console.log('Request successful:', response.data);
          // Only show waiting modal on success
          setIsWaitingForAcceptance(true);
          startProgressAnimation();
        },
        onError: (error) => {
          console.error('Request failed:', error);
          toast.show('Failed to send request to rider. Please try again.', { type: 'error' });
          // Don't show waiting modal on error
        }
      });
    }
  }, [selectedRider, summaryData, mutate, startProgressAnimation, toast])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setSelectedRiderId(null)
    
    if (summaryData && refetch) {
      refetch().finally(() => {
        setRefreshing(false)
      })
    } else {
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
    setSelectedRiderId(null)
  }, [progressAnim])

  const formatPrice = useCallback((fareAmount: string | number | undefined | null) => {
    if (fareAmount === undefined || fareAmount === null || fareAmount === '') {
      return 'N/A';
    }
    
    let numericFare: number;
    if (typeof fareAmount === 'number') {
      numericFare = fareAmount;
    } else {
      const cleanedAmount = String(fareAmount).replace(/[₦$,\s]/g, '');
      numericFare = parseFloat(cleanedAmount);
    }
    
    if (isNaN(numericFare)) {
      return String(fareAmount);
    }
    
    return `₦${numericFare.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  }, [])

  const RiderCard = ({ rider, isSelected }: { rider: Rider; isSelected: boolean }) => {
    console.log(`RiderCard for ${rider.riders_name} - isSelected: ${isSelected}, riders_id: ${rider.riders_id}, selectedRiderId: ${selectedRiderId}`);
    
    return (
      <TouchableOpacity
        onPress={() => handleRiderSelect(rider)}
        className={`p-4 rounded-xl mb-3 ${
          isSelected ? "border border-[#f7c0a4] bg-[#fff7f3]" : "border border-gray-100 bg-white"
        }`}
      >
        <View className="flex-row items-start">
          <View className="relative">
            <View className="w-20 h-20 rounded-full bg-gray-200 mr-4 overflow-hidden">
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
                  {rider.riders_name}
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
              <Ionicons name={getVehicleIcon(rider.vehicle_type)} size={14} color="#668" />
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600 ml-1 mr-2">
                {rider.vehicle_color} {rider.vehicle_type}
              </Text> 
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-gray-600 mr-2">•</Text>
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

            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <View className="bg-green-50 px-4 py-1 border border-green-200 rounded-full">
                <Text style={{ fontFamily: "HankenGrotesk_600SemiBold" }} className="text-green-800 text-base">
                  {formatPrice(rider.eta.fare_amount)}
                </Text>
              </View>
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
  }

  const LoadingRidersState = () => (
    <View className="flex-1 justify-center items-center py-10 pt-20">
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

  // Custom Waiting Modal Content
  const WaitingModalContent = () => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 24,
      padding: 24,
      paddingVertical: 32,
      width: '100%',
      maxWidth: 400,
    }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ position: 'relative' }}>
          {selectedRider?.riders_picture ? (
            <Image 
              source={{ uri: selectedRider.riders_picture }} 
              style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 56, 
                marginBottom: 16 
              }} 
            />
          ) : (
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 56,
              backgroundColor: '#e5e5e5',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <MaterialIcons name="person" size={40} color="gray" />
            </View>
          )}
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: 'white',
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'white'
          }}>
            <MaterialIcons name="verified" size={20} color="green" />
          </View>
        </View>

        <Text style={{ 
          fontFamily: "HankenGrotesk_600SemiBold", 
          fontSize: 18, 
          color: '#6b7280', 
          marginBottom: 12,
          textAlign: 'center'
        }}>
          Waiting for {selectedRider?.riders_name} ...
        </Text>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 12 
        }}>
          <View style={{
            backgroundColor: '#dcfce7',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            marginRight: 8
          }}>
            <Text style={{ 
              fontFamily: "HankenGrotesk_500Medium", 
              fontSize: 12, 
              color: '#15803d'
            }}>
              Verified Rider
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderStarRating(selectedRider?.rating || 0)}
            <Text style={{ 
              fontFamily: "HankenGrotesk_500Medium", 
              fontSize: 14, 
              color: '#6b7280', 
              marginLeft: 4 
            }}>
              {selectedRider?.rating}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          padding: 16,
          width: '100%',
          marginBottom: 16
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8 
          }}>
            <Text style={{ 
              fontFamily: "HankenGrotesk_500Medium", 
              fontSize: 13, 
              color: '#6b7280' 
            }}>
              Vehicle:
            </Text>
            <Text style={{ 
              fontFamily: "HankenGrotesk_600SemiBold", 
              fontSize: 13, 
              color: '#111827' 
            }}>
              {selectedRider?.vehicle_color} {selectedRider?.vehicle_type}
            </Text>
          </View>
          {(selectedRider?.plate_number || selectedRider?.license) && (
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 8 
            }}>
              <Text style={{ 
                fontFamily: "HankenGrotesk_500Medium", 
                fontSize: 14, 
                color: '#6b7280' 
              }}>
                Plate Number:
              </Text>
              <Text style={{ 
                fontFamily: "HankenGrotesk_600SemiBold", 
                fontSize: 13, 
                color: '#111827' 
              }}>
                {selectedRider?.plate_number || selectedRider?.license}
              </Text>
            </View>
          )}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 8 
          }}>
            <Text style={{ 
              fontFamily: "HankenGrotesk_500Medium", 
              fontSize: 13, 
              color: '#6b7280' 
            }}>
              Distance:
            </Text>
            <Text style={{ 
              fontFamily: "HankenGrotesk_600SemiBold", 
              fontSize: 13, 
              color: '#111827' 
            }}>
              {selectedRider?.eta.distance || selectedRider?.eta.distance_km + ' km'} away
            </Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Text style={{ 
              fontFamily: "HankenGrotesk_500Medium", 
              fontSize: 13, 
              color: '#6b7280' 
            }}>
              Delivery Fee:
            </Text>
            <Text style={{ 
              fontFamily: "HankenGrotesk_600SemiBold", 
              fontSize: 13, 
              color: '#111827' 
            }}>
              {formatPrice(selectedRider?.eta.fare_amount)}
            </Text>
          </View>
        </View>

        <Text style={{ 
          fontFamily: "HankenGrotesk_400Regular", 
          color: '#6b7280', 
          textAlign: 'center', 
          marginBottom: 24, 
          fontSize: 12 
        }}>
          We've sent your request to the rider. Please wait for them to accept your delivery request.
        </Text>

        <View style={{
          width: '100%',
          backgroundColor: '#e5e7eb',
          borderRadius: 20,
          height: 8,
          marginBottom: 16
        }}>
          <Animated.View
            style={{
              backgroundColor: 'green',
              height: 8,
              borderRadius: 20,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'center', 
          marginBottom: 24 
        }}>
          <ActivityIndicator size="large" color="#F75F15" />
        </View>

        <TouchableOpacity
          onPress={handleCancelRequest}
          style={{
            backgroundColor: '#e5e7eb',
            paddingVertical: 16,
            borderRadius: 20,
            width: '100%'
          }}
        >
          <Text style={{
            fontFamily: "HankenGrotesk_500Medium",
            color: '#374151',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: '600'
          }}>
            Cancel Request
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      <StatusBar style="dark" />
      {/* Show loading overlay only when API request is pending, not when waiting for acceptance */}
      <LoadingOverlay visible={isPending} />

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
              <RiderCard 
                key={rider.riders_id} 
                rider={rider} 
                isSelected={selectedRiderId === rider.riders_id} 
              />
            ))}
          </View>
        )}
      </ScrollView>

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

      {/* Custom Waiting Modal */}
      <CustomModal visible={isWaitingForAcceptance} onClose={handleCancelRequest}>
        <WaitingModalContent />
        </CustomModal>
    </SafeAreaView>
  )
}

export default ParcelAvailableRiders