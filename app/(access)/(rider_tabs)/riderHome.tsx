"use client"

import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Alert, 
  ScrollView, 
  Modal, 
  ActivityIndicator, 
  Animated, 
  Easing, 
  Linking, 
  Platform,
} from "react-native"
import { useState, useEffect, useRef, useCallback } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { router } from "expo-router"
import { useGetRidersCompletedRides, useGetRidersEarnings, useGetRidersRide, useGetRides, useGetVerifiedStatus, useRiderGoOnline, useRiderGoOnlineCheck } from "@/hooks/mutations/ridersAuth"
import { useToast } from "react-native-toast-notifications"
import { useMutation } from "@tanstack/react-query"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { post_requests } from "@/hooks/helpers/axios_helpers"
import ActiveRidesBottomSheet from "@/components/ActiveRidesBottomSheet"
import AcceptedRideDetailsBottomSheet from "@/components/AcceptedRideDetailsBottomSheet"
import RideDetailsModal from "@/components/RideDetailsModal"
import { useNotification } from "@/context/NotificationContext"
import LoadingOverlay from "@/components/LoadingOverlay"
import { useRiderKYC, useRiderProfile } from "@/hooks/mutations/auth"
import { Pressable } from "react-native"
import { Image } from "react-native"

const { width, height } = Dimensions.get("window")

interface TrackingInfo {
  pickupAddress: string
  dropoffAddress: string
  pickupCoords: { latitude: number; longitude: number }
  dropoffCoords: { latitude: number; longitude: number }
}

interface KYCData {
  nin: string | null
  nin_url: string | null
  proof_of_address: string | null
  poa_url: string | null
  drivers_licence: string | null
  drivers_licence_url: string | null
  vehicle_type: string | null
  plate_number: string | null
  vehicle_color: string | null
}

const RiderHome = () => {
  const [location, setLocation] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [mapRegion, setMapRegion] = useState<any>(null)
  const mapRef = useRef<MapView>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([])
  const [trackingDistance, setTrackingDistance] = useState<string>("")
  const [trackingDuration, setTrackingDuration] = useState<string>("")
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [pendingOnlineStatus, setPendingOnlineStatus] = useState<boolean | null>(null)
  const [showActiveRidesBottomSheet, setShowActiveRidesBottomSheet] = useState(false)
  const [showAcceptedRideBottomSheet, setShowAcceptedRideBottomSheet] = useState(false)
  const [showRideDetailsModal, setShowRideDetailsModal] = useState(false)
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const [hasShownTrackingToast, setHasShownTrackingToast] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [myRideId, setMyRideId] = useState<number | null>(null)
  const [showKYCModal, setShowKYCModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  
  // Add refs to prevent unnecessary re-renders
  const lastLocationUpdate = useRef<number>(0)
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
  
  const { mutate, isPending } = useRiderGoOnline()
  const { isRiderOnline, isLoading: onlineCheckLoading } = useRiderGoOnlineCheck()
  const { getRides, isLoading: rideLoading, refetch: refetchRides } = useGetRides()
  const { myRidersRide, refetch: refetchMyRide } = useGetRidersRide(myRideId)
  const {getRidersEarnings, isLoading: ridersLoading} = useGetRidersEarnings()
  const {getRidersCompletedCount, isLoading: ridersCompletedLoading} = useGetRidersCompletedRides()
  const ridersEarnings = getRidersEarnings?.data
  const ridersCompletedCounts = getRidersCompletedCount?.data
  const {isRiderVerified, isLoading: isRiderVerifiedLoading} = useGetVerifiedStatus()
  const isMyAccountVerified = isRiderVerified?.data?.verified
  const isOnline = isRiderOnline?.data?.online
  const toast = useToast()
  
  // Get notification context methods
  const { 
    setOnNewRideNotification, 
    setOnPaymentReceivedNotification,
    setOnRideCancelledNotification,
    shouldRefresh, 
    clearRefreshFlag 
  } = useNotification()
  
  const pulseAnim = useRef(new Animated.Value(1)).current

  // KYC and Profile data
  const {isLoading: isRiderLoading, profile} = useRiderProfile()  
  const {riderKYC, isLoading: isKYCLoading} = useRiderKYC()
  const ridersKyc = riderKYC?.data

  // Function to check if KYC is complete
  const isKYCComplete = useCallback((kycData: KYCData | null | undefined): boolean => {
    if (!kycData) return false
    
    // Check paired fields with OR logic
    const hasNIN = (kycData.nin && kycData.nin !== "") || (kycData.nin_url && kycData.nin_url !== "")
    const hasProofOfAddress = (kycData.proof_of_address && kycData.proof_of_address !== "") || (kycData.poa_url && kycData.poa_url !== "")
    const hasDriversLicense = (kycData.drivers_licence && kycData.drivers_licence !== "") || (kycData.drivers_licence_url && kycData.drivers_licence_url !== "")
    
    // Check individual required fields
    const hasVehicleType = kycData.vehicle_type !== null && kycData.vehicle_type !== undefined && kycData.vehicle_type !== ""
    const hasPlateNumber = kycData.plate_number !== null && kycData.plate_number !== undefined && kycData.plate_number !== ""
    const hasVehicleColor = kycData.vehicle_color !== null && kycData.vehicle_color !== undefined && kycData.vehicle_color !== ""
    
    return !!hasNIN && !!hasProofOfAddress && !!hasDriversLicense && !!hasVehicleType && !!hasPlateNumber && !!hasVehicleColor
  }, [])

  // Function to get missing KYC fields
  const getMissingKYCFields = useCallback((kycData: KYCData | null | undefined): string[] => {
    if (!kycData) {
      return ['National ID Document', 'Proof of Address Document', 
              'Driver\'s License Document', 'Vehicle Type', 'Plate Number', 'Vehicle Color']
    }
    
    const missingFields: string[] = []
    
    // Check paired fields with OR logic
    const hasNIN = (kycData.nin && kycData.nin !== "") || (kycData.nin_url && kycData.nin_url !== "")
    const hasProofOfAddress = (kycData.proof_of_address && kycData.proof_of_address !== "") || (kycData.poa_url && kycData.poa_url !== "")
    const hasDriversLicense = (kycData.drivers_licence && kycData.drivers_licence !== "") || (kycData.drivers_licence_url && kycData.drivers_licence_url !== "")
    
    if (!hasNIN) {
      missingFields.push('National ID Number Document')
    }
    
    if (!hasProofOfAddress) {
      missingFields.push('Proof of Address Document')
    }
    
    if (!hasDriversLicense) {
      missingFields.push('Driver\'s License Document')
    }
    
    // Check individual required fields
    if (!kycData.vehicle_type || kycData.vehicle_type === "") {
      missingFields.push('Vehicle Type')
    }
    
    if (!kycData.plate_number || kycData.plate_number === "") {
      missingFields.push('Plate Number')
    }
    
    if (!kycData.vehicle_color || kycData.vehicle_color === "") {
      missingFields.push('Vehicle Color')
    }
    
    return missingFields
  }, [])

  // Function to check if user can perform ride actions
  const canPerformRideActions = useCallback(() => {
    return isMyAccountVerified === true && isKYCComplete(ridersKyc)
  }, [isMyAccountVerified, isKYCComplete, ridersKyc])

  // Function to show verification modal
  const showVerificationRequiredModal = useCallback(() => {
    setShowVerificationModal(true)
  }, [])

  useEffect(() => {
    if (!isKYCLoading && ridersKyc !== undefined) {
      const kycComplete = isKYCComplete(ridersKyc)
      
      // Show KYC modal immediately if KYC is not complete, regardless of verification status
      if (!kycComplete) {
        // Show KYC modal after a short delay to ensure other modals are not conflicting
        setTimeout(() => {
          setShowKYCModal(true)
        }, 1000)
      }
    }
  }, [ridersKyc, isKYCLoading, isKYCComplete])

  // Verification Modal Component
  const renderVerificationModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVerificationModal}
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl p-6 px-8 mx-4 max-w-md w-full">
            <View className="items-center mb-4">
              <View className="bg-[#FEE2E2] p-4 rounded-full mb-4">
                <MaterialIcons name="warning" size={40} color="#DC2626" />
              </View>
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-xl font-bold text-neutral-900 text-center mb-2"
              >
                Account Verification Required
              </Text>
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-neutral-600 text-sm text-center mb-4"
              >
                {!isMyAccountVerified 
                  ? "Your account needs to be verified by our team before you can view or accept ride requests. This is to ensure the safety of all users."
                  : "You need to complete your KYC verification to access ride features."
                }
              </Text>
            </View>

            <View className="flex-col gap-3">
              {!isMyAccountVerified && (
                <TouchableOpacity
                  onPress={() => {
                    setShowVerificationModal(false)
                  }}
                  className="bg-blue-600 py-4 rounded-full items-center"
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-white font-semibold text-base"
                  >
                    Check Verification Status
                  </Text>
                </TouchableOpacity>
              )}
              
              {isMyAccountVerified && !isKYCComplete(ridersKyc) && (
                <TouchableOpacity
                  onPress={() => {
                    setShowVerificationModal(false)
                    setShowKYCModal(true)
                  }}
                  className="bg-[#F75F15] py-4 rounded-full items-center"
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-white font-semibold text-base"
                  >
                    Complete KYC
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowVerificationModal(false)}
                className="bg-gray-100 py-4 rounded-full items-center"
              >
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-gray-700 font-semibold text-base"
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-xs text-neutral-500 text-center mt-4"
            >
              Contact support if you need assistance with verification.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  // KYC Modal Component
  const renderKYCModal = () => {
    const missingFields = getMissingKYCFields(ridersKyc)
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showKYCModal}
        onRequestClose={() => setShowKYCModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-3xl p-6 px-8 mx-4 max-w-md w-full max-h-[80%]">
            <View className="items-center mb-4">
              <View className="bg-[#FEEEE6] p-4 rounded-full mb-4">
                <MaterialIcons name="notifications-none" size={40} color="#F75F15" />
              </View>
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-xl font-bold text-neutral-900 text-center mb-2"
              >
                Complete Your KYC
              </Text>
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-neutral-600 text-sm text-center mb-4"
              >
                You need to complete your Know Your Customer (KYC) verification to start receiving ride requests and go online.
              </Text>
            </View>
            
            <View className="flex-col gap-2">
              <TouchableOpacity
                onPress={() => {
                  setShowKYCModal(false)
                  router.push("/(access)/(rider_stacks)/riderKYC")
                }}
                className="bg-[#F75F15] py-3.5 rounded-full items-center"
              >
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-white font-semibold text-base"
                >
                  Complete KYC Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowKYCModal(false)
                }}
                className="bg-gray-200 py-3.5 rounded-full items-center"
              >
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-black font-semibold text-base"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-xs text-neutral-500 text-center mt-4"
            >
              Your information is secure and used only for verification purposes.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  // Throttled location update mutation
  const locationUpdate = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number }) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/update-longlat`, data, token)
    },
  })

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon1-lon2) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // Function to get coordinates from Google Geocoding API
  const getCoordinatesFromAddress = useCallback(async (address: string) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng
        }
      } else {
        throw new Error("Address not found")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      throw error
    }
  }, [])

  // Fixed getDirections function
  const getDirections = useCallback(async (origin: any, destination: any) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("Google Maps API key not found")
        toast.show("API key not configured", { type: "warning" })
        return []
      }
      
      console.log("Getting directions from:", origin, "to:", destination)
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`
      )
      
      const data = await response.json()
      console.log("Directions API response status:", data.status)
      
      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const leg = route.legs?.[0]
        
        if (leg && route.overview_polyline?.points) {
          const points = decodePolyline(route.overview_polyline.points)
          console.log("Decoded polyline points:", points.length, "points")
          
          if (points.length > 0) {
            setRouteCoordinates(points)
            setTrackingDistance(leg.distance?.text || "Unknown distance")
            setTrackingDuration(leg.duration?.text || "Unknown duration")
            
            if (mapRef.current) {
              const allCoords = [origin, destination, ...points]
              mapRef.current.fitToCoordinates(allCoords, {
                edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
                animated: true,
              })
            }
            
            return points
          }
        }
      } else {
        console.error("Directions API error:", data.status, data.error_message)
        throw new Error(`Directions API error: ${data.status}`)
      }
    } catch (error) {
      console.error("Directions API error:", error)
      toast.show("Failed to get route directions", { type: "warning" })
      return []
    }
  }, [toast])

  // Improved polyline decoder
  const decodePolyline = (encoded: string) => {
    if (!encoded) {
      console.error("Empty polyline string")
      return []
    }
    
    try {
      const points = []
      let index = 0
      const len = encoded.length
      let lat = 0
      let lng = 0
      
      while (index < len) {
        let b, shift = 0, result = 0
        do {
          b = encoded.charAt(index++).charCodeAt(0) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)
        
        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
        lat += dlat
        
        shift = 0
        result = 0
        do {
          b = encoded.charAt(index++).charCodeAt(0) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)
        
        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
        lng += dlng
        
        points.push({
          latitude: lat / 1e5,
          longitude: lng / 1e5,
        })
      }
      
      console.log("Successfully decoded", points.length, "polyline points")
      return points
    } catch (error) {
      console.error("Error decoding polyline:", error)
      return []
    }
  }

  // Updated startTracking function
  const startTracking = useCallback(async (rideData: any) => {
    try {
      console.log("🚀 Starting tracking for ride:", rideData)
      
      let pickupAddress = ""
      let dropoffAddress = ""
      
      if (rideData?.delivery_type === "Package" && rideData?.package_delivery) {
        pickupAddress = rideData.package_delivery.pickup_address || rideData.package_delivery.pick_address
        dropoffAddress = rideData.package_delivery.dropoff_address || rideData.package_delivery.drop_address
        
        console.log("📦 Package delivery addresses:")
        console.log("Pickup:", pickupAddress)
        console.log("Dropoff:", dropoffAddress)
      } else {
        pickupAddress = rideData?.order?.order_items?.[0]?.product?.store?.address1
        const deliveryAddress = rideData?.order?.delivery[0]?.delivery_address
        const city = rideData?.order?.delivery[0]?.city
        const state = rideData?.order?.delivery[0]?.state
        
        if (deliveryAddress && city && state) {
          dropoffAddress = `${deliveryAddress}, ${city}, ${state}`
        }
        
        console.log("🛍️ Order delivery addresses:")
        console.log("Pickup (Store):", pickupAddress)
        console.log("Dropoff:", dropoffAddress)
      }
      
      if (!pickupAddress || !dropoffAddress) {
        const missingAddresses = []
        if (!pickupAddress) missingAddresses.push("pickup address")
        if (!dropoffAddress) missingAddresses.push("dropoff address")
        
        toast.show(`Missing ${missingAddresses.join(" and ")} information`, { type: "warning" })
        console.error("Missing address information:", { pickupAddress, dropoffAddress })
        return
      }
      
      console.log("Getting coordinates for addresses...")
      const [pickupCoords, dropoffCoords] = await Promise.all([
        getCoordinatesFromAddress(pickupAddress),
        getCoordinatesFromAddress(dropoffAddress)
      ])
      
      console.log("Pickup coords:", pickupCoords)
      console.log("Dropoff coords:", dropoffCoords)
      
      const trackingData: TrackingInfo = {
        pickupAddress,
        dropoffAddress,
        pickupCoords,
        dropoffCoords
      }
      
      setTrackingInfo(trackingData)
      setIsTracking(true)
      
      console.log("Getting directions for route...")
      await getDirections(pickupCoords, dropoffCoords)
      
      const deliveryType = rideData?.delivery_type === "Package" ? "package" : "order"
      toast.show(`Tracking started! Navigate from pickup to delivery location for ${deliveryType}.`, { type: "success" })
      
    } catch (error: any) {
      console.error("Error starting tracking:", error)
      toast.show(`Failed to start tracking: ${error.message}`, { type: "danger" })
    }
  }, [getCoordinatesFromAddress, getDirections, toast])

  const openExternalNavigation = () => {
    if (!trackingInfo) {
      toast.show("No tracking information available", { type: "warning" })
      return
    }

    Alert.alert("Open Navigation", "Choose your destination:", [
      {
        text: "Open Pickup Location",
        onPress: () => {
          const coords = trackingInfo.pickupCoords
          const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
          Linking.openURL(url).catch(() => {
            toast.show("Failed to open Google Maps", { type: "danger" })
          })
        },
      },
      {
        text: "Open Drop-off Location",
        onPress: () => {
          const coords = trackingInfo.dropoffCoords
          const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
          Linking.openURL(url).catch(() => {
            toast.show("Failed to open Google Maps", { type: "danger" })
          })
        },
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  // Check for accepted rides with saved ride ID
  useEffect(() => {
    const checkForAcceptedRides = async () => {
      try {
        const savedRideId = await AsyncStorage.getItem("accepted_ride_id")
        if (savedRideId) {
          const rideId = parseInt(savedRideId)
          setMyRideId(rideId)
          console.log("🔍 Found saved ride ID:", rideId)
        }
      } catch (error) {
        console.error("Error checking saved ride ID:", error)
      }
    }
    
    if (isOnline && canPerformRideActions()) {
      checkForAcceptedRides()
    }
  }, [isOnline, canPerformRideActions])

  // Monitor my ride status and start tracking when out_for_delivery becomes true
  useEffect(() => {
    if (myRidersRide?.data && !isTracking && canPerformRideActions()) {
      const rideData = myRidersRide.data
      console.log("🔄 My ride data updated:", rideData)
      
      if (rideData.out_for_delivery === true) {
        console.log("🚚 Starting tracking - out for delivery!")
        startTracking(rideData)
      }
    }
  }, [myRidersRide?.data, isTracking, canPerformRideActions, startTracking])

  // Handler for new ride notifications
  const handleNewRideNotification = useCallback(() => {
    if (isOnline && canPerformRideActions()) {
      console.log("🔄 Refreshing rides due to new ride notification...")
      refetchRides()
      toast.show("New ride available! Check your active rides.", { type: "info" })
    }
  }, [refetchRides, toast, isOnline, canPerformRideActions])

  // Handler for payment received notifications
  const handlePaymentReceived = useCallback(() => {
    console.log("💰 Payment received notification in RiderHome - refreshing my ride...")
    if (myRideId) {
      refetchMyRide()
      toast.show("Payment received! You can now proceed with the delivery.", { type: "success" })
    }
  }, [myRideId, refetchMyRide, toast])

  // Handler for ride cancelled notifications
  const handleRideCancelled = useCallback(async () => {
    console.log("❌ Ride cancelled notification in RiderHome - clearing ride data...")
    
    // Clear the accepted ride ID from storage
    await AsyncStorage.removeItem("accepted_ride_id")
    setMyRideId(null)
    
    // Stop tracking if active
    if (isTracking) {
      setIsTracking(false)
      setTrackingInfo(null)
      setRouteCoordinates([])
    }
    
    // Close any open modals
    setShowAcceptedRideBottomSheet(false)
    setSelectedRide(null)
    
    // Refresh rides list
    refetchRides()
    
    toast.show("The ride has been cancelled by the sender.", { type: "warning" })
  }, [isTracking, refetchRides, toast])

  // Set up notification handlers
  useEffect(() => {
    console.log("🔔 Setting up notification handlers in RiderHome")
    
    if (setOnNewRideNotification) {
      setOnNewRideNotification(handleNewRideNotification)
    }
    
    if (setOnPaymentReceivedNotification) {
      setOnPaymentReceivedNotification(handlePaymentReceived)
    }
    
    if (setOnRideCancelledNotification) {
      setOnRideCancelledNotification(handleRideCancelled)
    }
  }, [
    setOnNewRideNotification, 
    setOnPaymentReceivedNotification,
    setOnRideCancelledNotification,
    handleNewRideNotification
  ])

  useEffect(() => {
    if (shouldRefresh && isOnline && canPerformRideActions() && clearRefreshFlag) {
      console.log("🔄 Refreshing rides due to notification...")
      refetchRides()
      clearRefreshFlag()
    }
  }, [shouldRefresh, refetchRides, clearRefreshFlag, isOnline, canPerformRideActions])

  // Initialize location once
  useEffect(() => {
    ;(async () => {
      try {
        setIsInitializing(true)
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(
            "Location Permission Denied",
            "Permission to access location was denied. Please enable it in settings to use this feature.",
          )
          setIsInitializing(false)
          return
        }
        
        const currentLocation = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High
        })
        
        if (currentLocation?.coords) {
          const userLocation = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
          setLocation(userLocation)
          setMapRegion(userLocation)
          
          // Update location on server
          locationUpdate.mutate(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            {
              onSuccess: () => {
                console.log("✅ Initial location updated successfully!")
              },
              onError: (error: any) => {
                console.error("Initial location update failed:", error)
                toast.show(`Failed to update initial location: ${error?.message || "Unknown error"}`, { type: "danger" })
              },
            },
          )
        }
      } catch (error) {
        console.error("Error getting initial location:", error)
        toast.show("Failed to get your location", { type: "danger" })
      } finally {
        setIsInitializing(false)
      }
    })()
  }, [])

  // Optimized location tracking
  useEffect(() => {
    const startLocationTracking = async () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
        locationSubscriptionRef.current = null
      }

      if (!isOnline || !canPerformRideActions()) return

      try {
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 100,
          },
          (newLocation) => {
            if (!newLocation?.coords) return
            
            const now = Date.now()
            const updatedLocation = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }

            // Check if location has changed significantly or enough time has passed
            if (location) {
              const distance = calculateDistance(
                location.latitude,
                location.longitude,
                updatedLocation.latitude,
                updatedLocation.longitude
              )
              
              // Only update if moved more than 50m or 60 seconds have passed
              if (distance < 50 && now - lastLocationUpdate.current < 60000) {
                return
              }
            }

            lastLocationUpdate.current = now
            setLocation(updatedLocation)
            
            // Update tracking route if needed and user is still tracking
            if (isTracking && trackingInfo) {
              console.log("Updating route due to location change...")
              getDirections(trackingInfo.pickupCoords, trackingInfo.dropoffCoords)
            }

            // Throttled server update
            locationUpdate.mutate(
              {
                latitude: updatedLocation.latitude,
                longitude: updatedLocation.longitude,
              },
              {
                onSuccess: () => {
                  console.log("✅ Location updated successfully")
                },
                onError: (error: any) => {
                  console.error("Location update failed:", error)
                },
              },
            )
          },
        )
      } catch (error) {
        console.error("Error starting location tracking:", error)
      }
    }

    if (isOnline && canPerformRideActions()) {
      startLocationTracking()
    } else {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
        locationSubscriptionRef.current = null
      }
    }

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove()
        locationSubscriptionRef.current = null
      }
    }
  }, [isOnline, isTracking, trackingInfo, canPerformRideActions, getDirections])

  useEffect(() => {
    if (isOnline && getRides?.data && Array.isArray(getRides.data) && getRides.data.length > 0 && canPerformRideActions()) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
    }
  }, [isOnline, getRides?.data, pulseAnim, canPerformRideActions])

  const dismissBanner = () => {
    setShowBanner(false)
  }

  const handleStatusTogglePress = (status: boolean) => {
    // Check verification and KYC status before allowing user to go online
    if (status) {
      // if (!isMyAccountVerified) {
      //   showVerificationRequiredModal()
      //   return
      // }
      if (!isKYCComplete(ridersKyc)) {
        setShowKYCModal(true)
        return
      }
    }
    
    setPendingOnlineStatus(status)
    setShowConfirmationModal(true)
  }

  const   confirmStatusChange = () => {
    if (pendingOnlineStatus !== null) {
      mutate(
        { online: pendingOnlineStatus },
        {
          onSuccess: async () => {
            setShowConfirmationModal(false)
            toast.show(`You are now ${pendingOnlineStatus ? "online" : "offline"}.`, { type: "success" })
            if (!pendingOnlineStatus) {
              setShowActiveRidesBottomSheet(false)
              setShowAcceptedRideBottomSheet(false)
              setShowRideDetailsModal(false)
              setSelectedRide(null)
              await AsyncStorage.removeItem("accepted_ride_id")
              setMyRideId(null)
              // Clear tracking when going offline
              setIsTracking(false)
              setTrackingInfo(null)
              setRouteCoordinates([])
            }
          },
          onError: (error: any) => {
            setShowConfirmationModal(false)
            Alert.alert("Error", `Failed to change status: ${error?.message || "Unknown error"}`)
          },
        },
      )
    }
  }

  const cancelStatusChange = () => {
    setShowConfirmationModal(false)
    setPendingOnlineStatus(null)
  }

  const handleRideSelect = (ride: any) => {
    if (!isOnline) {
      toast.show("You need to be online to view ride details.", { type: "warning" })
      return
    }
    if (!canPerformRideActions()) {
      showVerificationRequiredModal()
      return
    }
    setSelectedRide(ride)
    setShowActiveRidesBottomSheet(false)
    setShowRideDetailsModal(true)
  }

  
  const handleDeclineRide = () => {
    setSelectedRide(null)
    setShowRideDetailsModal(false)
  }

  const handleRideAccepted = async (rideId: number) => {
    if (!canPerformRideActions()) {
      showVerificationRequiredModal()
      return
    }
    try {
      await AsyncStorage.setItem("accepted_ride_id", rideId.toString())
      setMyRideId(rideId)
      refetchMyRide()
      toast.show("Ride accepted! Wait for pickup confirmation.", { type: "success" })
    } catch (error) {
      console.error("Error saving ride ID:", error)
    }
  }

  const handleMarkForPickup = async (ride: any) => {
    if (!isOnline) {
      toast.show("You need to be online to manage rides.", { type: "warning" })
      return
    }
    if (!canPerformRideActions()) {
      showVerificationRequiredModal()
      return
    }
    console.log("Marking ride for pickup:", ride)
    refetchMyRide()
  }

  const handleNewRidesPress = () => {
    if (!isOnline) {
      toast.show("You need to go online to view available rides.", { type: "warning" })
      return
    }
    if (!canPerformRideActions()) {
      showVerificationRequiredModal()
      return
    }
    setShowActiveRidesBottomSheet(true)
  }

  const handleAcceptedRidePress = () => {
    if (!isOnline) {
      toast.show("You need to be online to manage your rides.", { type: "warning" })
      return
    }
    if (!canPerformRideActions()) {
      showVerificationRequiredModal()
      return
    }
    if (myRidersRide?.data) {
      setSelectedRide(myRidersRide.data)
      setShowAcceptedRideBottomSheet(true)
    }
  }

  const ridesData = getRides?.data
  const newRides = isOnline && Array.isArray(ridesData) && canPerformRideActions() ? ridesData.filter((ride: any) => ride?.accepted === false) : []
  

  const getAcceptedRideButtonConfig = () => {
    if (!myRidersRide?.data || !canPerformRideActions()) return null
    
    const rideData = myRidersRide.data
    console.log('This is ride data', rideData)
    
    if (rideData.completed === true) {
      return {
        text: "Ride Completed",
        ride: rideData,
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        icon: "checkmark-done",
        disabled: true
      }
    } else if (rideData.out_for_delivery === true) {
      return {
        text: "Mark as Delivered",
        ride: rideData,
        bgColor: "bg-green-800",
        textColor: "text-white",
        icon: "checkmark-done"
      }
    } else if (rideData.accepted === true) {
      return {
        text: "View Accepted Ride",
        ride: rideData,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "arrow-forward"
      }
    }
    
    return null
  }

  const buttonConfig = getAcceptedRideButtonConfig()
  const isLoading = isInitializing || onlineCheckLoading || isKYCLoading || isRiderLoading || isRiderVerifiedLoading || (!location && !isInitializing)

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading} />
      
      {/* Verification Modal */}
      {renderVerificationModal()}
      
      {/* KYC Modal */}
      {renderKYCModal()}
      
      <View style={{ height: height * 0.6 }} className="relative">
        <View className="px-5 py-3 absolute bg-white rounded-xl top-2 left-4 right-4 z-10" 
        >

          {isLoading ? (
            <View className="pt-4">
              <ActivityIndicator size={"small"} color={"gray"} />
            </View>
              ) : (
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.push("/(access)/(rider_tabs)/riderProfile")}
                className="flex w-9 h-9 mr-2 rounded-full bg-neutral-200 justify-center items-center overflow-hidden relative"
              >
                {profile?.data?.profile_picture === null ? (
                  <MaterialIcons name="person-4" size={25} color={"gray"} style={{padding: 3}}/>
                ) : (
                  <Image
                    source={{ uri: profile?.data?.profile_picture }}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                )}
              </Pressable>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View>
                    <View className="flex-row items-center">
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-black font-semibold text-sm"
                      >
                        {profile?.data?.fullname}
                      </Text>
                      {!isMyAccountVerified && !isRiderVerifiedLoading ? (
                        <View className="">
                          <MaterialIcons name="error-outline" size={14} color="red" style={{ marginLeft: 2 }} />
                        </View>
                      ): 
                        <View className="">
                          <MaterialIcons name="verified" size={14} color="green" style={{ marginLeft: 2 }} />
                        </View>
                      }
                    </View>
                    <Text
                      style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 10 }}
                      className="text-black font-semibold mr-2"
                    >
                      @{profile?.data?.username}
                    </Text>
                  </View>
                  {isTracking && (
                    <View className="ml-2 flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                      <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-600 text-xs">
                        Tracking
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                className={`px-3 py-1 rounded-full border ${
                  isOnline === true ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className={`text-xs font-medium ${isOnline === true ? "text-green-700" : "text-red-700"}`}
                >
                  {isOnline === true ? "Online" : "Offline"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isTracking && trackingInfo && (
          <View className="absolute top-16 left-4 right-4 z-10 bg-white rounded-xl p-3 shadow-sm border border-blue-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-100 p-2 rounded-full mr-3">
                  <Ionicons name="location" size={16} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-800 text-sm font-medium">
                    Active Delivery Route
                  </Text>
                  {trackingDistance && trackingDuration && (
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-xs mt-1">
                      {trackingDistance} • {trackingDuration}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                onPress={openExternalNavigation} 
                className="bg-blue-600 px-4 py-2 rounded-full flex-row items-center ml-2"
              >
                <Ionicons name="navigate" size={14} color="white" />
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-xs ml-1 font-medium">
                  Navigate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isOnline && !isLoading && (
          <View style={{borderColor: 'white', borderWidth: 4}} className="absolute justify-center flex-row gap-2 items-center top-16 mt-2 left-4 right-4 z-10 bg-orange-50 rounded-xl p-3">
            <MaterialIcons name="notifications" size={15} color={'#F75F15'}/>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-orange-700 text-sm font-medium text-center"
            >
              You are offline. Go online to start receiving ride requests.
            </Text>
          </View>
        )}

        {!canPerformRideActions() && !isLoading && (
          <View style={{borderColor: 'white', borderWidth: 4, marginTop: 65}} className="absolute justify-center flex-row gap-2 items-center  left-4 right-4 z-10 bg-orange-50 rounded-xl p-3">
            <MaterialIcons name="warning" size={15} color={'#DC2626'}/>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-orange-700 text-sm font-medium text-center"
            >
              {!isMyAccountVerified ? "Account verification required to access ride features." : "Complete KYC to access ride features."}
            </Text>
          </View>
        )}

        {mapRegion && location && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            style={{ width: "100%", height: "120%" }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={!isTracking} // Don't follow user location when tracking to show full route
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            onRegionChangeComplete={(region) => {
              if (mapRegion && region && 
                  (Math.abs(region.latitude - mapRegion.latitude) > 0.001 ||
                  Math.abs(region.longitude - mapRegion.longitude) > 0.001 ||
                  Math.abs(region.latitudeDelta - mapRegion.latitudeDelta) > 0.001 ||
                  Math.abs(region.longitudeDelta - mapRegion.longitudeDelta) > 0.001)) {
                setMapRegion(region)
              }
            }}
          >
            {/* User location marker */}
            {location && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Your Location"
                description="You are here"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View className="bg-[#F75F15] p-3 rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="person" size={16} color="white" />
                </View>
              </Marker>
            )}

            {/* Tracking markers and route */}
            {isTracking && trackingInfo && canPerformRideActions() && (
              <>
                {/* Pickup marker */}
                <Marker
                  coordinate={trackingInfo.pickupCoords}
                  title="Pickup Location"
                  description={trackingInfo.pickupAddress}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View className="bg-blue-600 p-3 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="storefront" size={18} color="white" />
                  </View>
                </Marker>
                
                {/* Dropoff marker */}
                <Marker
                  coordinate={trackingInfo.dropoffCoords}
                  title="Drop-off Location"
                  description={trackingInfo.dropoffAddress}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View className="bg-green-600 p-3 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="flag" size={18} color="white" />
                  </View>
                </Marker>
                
                {/* Route polyline */}
                {routeCoordinates && routeCoordinates.length > 1 && (
                  <Polyline 
                    coordinates={routeCoordinates} 
                    strokeColor="#3B82F6" 
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}
              </>
            )}
          </MapView>
        )}

        {(!mapRegion || !location) && !isLoading && (
          <View className="flex-1 bg-neutral-100 items-center justify-center">
            <Ionicons name="location-outline" size={48} color="#6B7280" />
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-400 mt-2 text-center px-4">
              Unable to load map. Please check your location permissions.
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-5 pt-5 absolute bottom-0 right-0 left-0 bg-white " style={{borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
        <View className="flex-1">
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-lg font-bold text-neutral-900 mb-1">
            Welcome, {profile?.data?.fullname}!
          </Text>
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm mb-4">
            Deliver goods and earn on your own schedule.
          </Text>

          <View className="flex-row justify-between items-center pb-2 gap-2">
            {isOnline && buttonConfig && canPerformRideActions() && (
              <View className="w-[83%]" 
                  style={
                      isOnline && canPerformRideActions()
                        ? {
                            shadowColor: "blue",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 4,
                          }
                        : {}
                    }
              >
                <TouchableOpacity
                  onPress={() => {
                    if (buttonConfig.ride && !buttonConfig.disabled) {
                      handleAcceptedRidePress()
                    }
                  }}
                  className={`${buttonConfig.bgColor} py-4 rounded-full gap-2 flex-row items-center justify-center ${
                    buttonConfig.disabled ? 'opacity-50' : ''
                  }`}
                  disabled={buttonConfig.disabled}
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className={`${buttonConfig.textColor || 'text-white'} font-semibold text-base`}
                  >
                    {buttonConfig.text}
                  </Text>
                  <Ionicons name={buttonConfig.icon as any} size={20} color={buttonConfig.textColor === 'text-white' ? "white" : "blue"} />
                </TouchableOpacity>
              </View>
            )}

            {(!isOnline || !buttonConfig || !canPerformRideActions()) && (
              <View className="w-[83%]">
                <Animated.View
                  style={{
                    transform: [{ scale: isOnline && canPerformRideActions() ? pulseAnim : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={handleNewRidesPress}
                    className={`py-3.5 rounded-full gap-2 flex-row items-center justify-center ${
                      isOnline && canPerformRideActions() ? "bg-green-900 border-2 border-green-100" : "bg-gray-100 border border-gray-300"
                    }`}
                    style={
                      isOnline && canPerformRideActions()
                        ? {
                            shadowColor: "green",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 4,
                          }
                        : {}
                    }
                  >
                    <Text
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                      className={`font-semibold text-base ${isOnline && canPerformRideActions() ? "text-green-100" : "text-gray-500"}`}
                    >
                      New Rides ({newRides.length})
                    </Text>
                    <Ionicons name="bicycle" size={20} color={isOnline && canPerformRideActions() ? "white" : "gray"} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            <View className={isOnline && buttonConfig && canPerformRideActions() ? "flex-1" : "w-[15%]"}>
              {isOnline === false ? (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(true)}
                  className="bg-green-600 border-2 border-green-300 py-3.5 rounded-full flex-row gap-2 items-center justify-center"
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      {/* <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-white text-center text-sm font-semibold"
                      >
                        Go online
                      </Text> */}
                      <MaterialIcons name="online-prediction" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(false)}
                  className="bg-[#F75F15] border-2 border-[#ffd9c6] py-3.5 rounded-full justify-center gap-2 flex-row items-center"
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      {/* <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-sm font-semibold">
                        Go offline
                      </Text> */}
                      <MaterialIcons name="airplanemode-on" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-5 pt-3">
            <View className="mb-2 flex-row items-center bg-gray-100 h-20 justify-between rounded-2xl border w-[49%] border-neutral-100 p-3">
              <View>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm mb-1">
                  Total Earnings
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900">
                  {ridersLoading || ridersEarnings === undefined ? '00.00' : `₦ ${ridersEarnings?.total_fare}`}
                </Text>
              </View>
              <TouchableOpacity 
                className="bg-white rounded-full p-1" 
                onPress={() => {
                  if (canPerformRideActions()) {
                    router.push("/(access)/(rider_tabs)/riderWallet")
                  } else {
                    showVerificationRequiredModal()
                  }
                }}
              >
                <MaterialIcons name="arrow-forward" size={20} color="#F75F15" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center h-20 gap-2 bg-gray-100 border border-neutral-100 p-3 w-[49%] rounded-2xl justify-center">
              <View className="bg-white p-2 rounded-full mr-1">
                <Ionicons name="car" size={20} color="#F75F15" />
              </View>
              <View className="flex-row items-center gap-2">
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-2xl font-bold text-neutral-900">
                  {ridersCompletedLoading || ridersCompletedCounts === undefined  ? '0' : `${ridersCompletedCounts?.message}`}
                </Text>
                <View>
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-600 text-xs">
                    completed
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-500 text-xs">
                    Deliveries
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmationModal}
        onRequestClose={cancelStatusChange}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-6 w-[70%] max-w-md">
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-lg font-bold text-neutral-900 mb-2 text-center"
            >
              Go {pendingOnlineStatus ? 'Offline': 'Online' }
            </Text>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-neutral-700 text-sm mb-4 text-center"
            >
              Are you sure you want to go {pendingOnlineStatus ? "online" : "offline"}?
            </Text>
            <View className="flex-row justify-around">
              <TouchableOpacity
                onPress={cancelStatusChange}
                className="bg-neutral-200 py-3 px-6 rounded-full flex-1 mx-2 items-center"
                disabled={isPending}
              >
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-800 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmStatusChange}
                className={`py-3 px-6 rounded-full flex-1 mx-2 items-center ${pendingOnlineStatus ? "bg-green-600" : "bg-orange-600"}`}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white font-semibold">
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isOnline && !rideLoading && canPerformRideActions() && (
        <>
          {newRides && Array.isArray(newRides) && (
            <ActiveRidesBottomSheet
              isVisible={showActiveRidesBottomSheet}
              onClose={() => setShowActiveRidesBottomSheet(false)}
              rides={newRides}
              onSelectRide={handleRideSelect}
              onRefresh={refetchRides}
              refreshing={rideLoading}
            />
          )}

          {selectedRide && (
            <AcceptedRideDetailsBottomSheet
              isVisible={showAcceptedRideBottomSheet}
              onClose={() => setShowAcceptedRideBottomSheet(false)}
              ride={selectedRide}
              onMarkForPickup={handleMarkForPickup}
              onRefetchMyRide={refetchMyRide}
            />
          )}

          {selectedRide && (
            <RideDetailsModal
              isVisible={showRideDetailsModal}
              onClose={handleDeclineRide}
              ride={selectedRide}
              onAccept={handleRideAccepted}
              onDecline={handleDeclineRide}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}

export default RiderHome