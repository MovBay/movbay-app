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
import { useGetRidersRide, useGetRides, useRiderGoOnline, useRiderGoOnlineCheck } from "@/hooks/mutations/ridersAuth"
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

// Dark Google Maps style
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "on"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#212121"}]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9e9e9e"}]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{"visibility": "on"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#bdbdbd"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#181818"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1b1b1b"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#2c2c2c"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8a8a8a"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{"color": "#373737"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#3c3c3c"}]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{"color": "#4e4e4e"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#000000"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#3d3d3d"}]
  }
]

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
  
  // Add refs to prevent unnecessary re-renders
  const lastLocationUpdate = useRef<number>(0)
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
  
  const { mutate, isPending } = useRiderGoOnline()
  const { isRiderOnline, isLoading: onlineCheckLoading } = useRiderGoOnlineCheck()
  const { getRides, isLoading: rideLoading, refetch: refetchRides } = useGetRides()
  const { myRidersRide, refetch: refetchMyRide } = useGetRidersRide(myRideId)
  const isOnline = isRiderOnline?.data?.online
  const toast = useToast()
  const { setOnNewRideNotification, shouldRefresh, clearRefreshFlag } = useNotification()
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
  // Check KYC status when component mounts or KYC data changes
  useEffect(() => {
    if (!isKYCLoading && ridersKyc !== undefined) {
      const kycComplete = isKYCComplete(ridersKyc)
      if (!kycComplete) {
        // Show KYC modal after a short delay to ensure other modals are not conflicting
        setTimeout(() => {
          setShowKYCModal(true)
        }, 1000)
      }
    }
  }, [ridersKyc, isKYCLoading, isKYCComplete])

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

            <View className="mb-6">
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-base font-semibold text-neutral-800 mb-3"
              >
                Missing Information:
              </Text>
              <ScrollView className="max-h-40" showsVerticalScrollIndicator={false}>
                {missingFields.map((field, index) => (
                  <View key={index} className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full bg-[#F75F15] mr-3" />
                    <Text
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                      className="text-sm text-neutral-700 flex-1"
                    >
                      {field}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View className="">
              <TouchableOpacity
                onPress={() => {
                  setShowKYCModal(false)
                  router.push("/(access)/(rider_stacks)/riderKYC")
                }}
                className="bg-[#F75F15] py-4 rounded-full items-center"
              >
                <Text
                  style={{ fontFamily: "HankenGrotesk_500Medium" }}
                  className="text-white font-semibold text-base"
                >
                  Complete KYC Now
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
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon1-lon2) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
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

  const getDirections = async (origin: any, destination: any) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error("Google Maps API key not found")
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`,
      )
      const data = await response.json()
      if (data.status === "OK" && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const leg = route.legs?.[0]
        if (leg && route.overview_polyline?.points) {
          const points = decodePolyline(route.overview_polyline.points)
          setRouteCoordinates(points)
          setTrackingDistance(leg.distance?.text || "Unknown distance")
          setTrackingDuration(leg.duration?.text || "Unknown duration")
          
          return points
        }
      } else {
        throw new Error("No route found")
      }
    } catch (error) {
      console.error("Directions API error:", error)
      toast.show("Failed to get route directions", { type: "warning" })
      return []
    }
  }

  const decodePolyline = (encoded: string) => {
    if (!encoded) return []
    
    const points = []
    let index = 0
    const len = encoded.length
    let lat = 0
    let lng = 0
    while (index < len) {
      let b,
        shift = 0,
        result = 0
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
    return points
  }

  // Start tracking function
  const startTracking = async (rideData: any) => {
    try {
      console.log("🚀 Starting tracking for ride:", rideData)
      
      const storeAddress = rideData?.order?.order_items?.[0]?.product?.store?.address1
      const deliveryAddress = rideData?.order?.delivery?.delivery_address
      const city = rideData?.order?.delivery?.city
      const state = rideData?.order?.delivery?.state
      
      if (!storeAddress || !deliveryAddress || !city || !state) {
        toast.show("Incomplete address information", { type: "warning" })
        return
      }

      const fullDeliveryAddress = `${deliveryAddress}, ${city}, ${state}`
      
      // Get coordinates for both addresses
      const [pickupCoords, dropoffCoords] = await Promise.all([
        getCoordinatesFromAddress(storeAddress),
        getCoordinatesFromAddress(fullDeliveryAddress)
      ])
      
      const trackingData: TrackingInfo = {
        pickupAddress: storeAddress,
        dropoffAddress: fullDeliveryAddress,
        pickupCoords,
        dropoffCoords
      }
      
      setTrackingInfo(trackingData)
      setIsTracking(true)
      
      // Get directions from pickup to dropoff
      if (location) {
        await getDirections(pickupCoords, dropoffCoords)
      }
      
      toast.show("Tracking started! Navigate from pickup to delivery location.", { type: "success" })
      
    } catch (error: any) {
      console.error("Error starting tracking:", error)
      toast.show(`Failed to start tracking: ${error.message}`, { type: "danger" })
    }
  }

  const openExternalNavigation = () => {
    if (!trackingInfo) {
      toast.show("No tracking information available", { type: "warning" })
      return
    }

    Alert.alert("Open Navigation", "Choose your destination:", [
      {
        text: "Navigate to Pickup",
        onPress: () => {
          const coords = trackingInfo.pickupCoords
          const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`
          Linking.openURL(url).catch(() => {
            toast.show("Failed to open Google Maps", { type: "danger" })
          })
        },
      },
      {
        text: "Navigate to Drop-off",
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

  const stopTracking = async () => {
    try {
      setIsTracking(false)
      setTrackingInfo(null)
      setRouteCoordinates([])
      setTrackingDistance("")
      setTrackingDuration("")
      setHasShownTrackingToast(false)
      toast.show("Tracking stopped", { type: "info" })
    } catch (error) {
      console.error("Error stopping tracking:", error)
    }
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
    
    if (isOnline) {
      checkForAcceptedRides()
    }
  }, [isOnline])

  // Monitor my ride status and start tracking when out_for_delivery becomes true
  useEffect(() => {
    if (myRidersRide?.data && !isTracking) {
      const rideData = myRidersRide.data
      console.log("🔄 My ride data updated:", rideData)
      
      if (rideData.out_for_delivery === true) {
        console.log("🚚 Starting tracking - out for delivery!")
        startTracking(rideData)
      }
    }
  }, [myRidersRide?.data, isTracking])

  const handleNewRideNotification = useCallback(() => {
    if (isOnline) {
      console.log("🔄 Refreshing rides due to new ride notification...")
      refetchRides()
      toast.show("New ride available! Check your active rides.", { type: "info" })
    }
  }, [refetchRides, toast, isOnline])

  useEffect(() => {
    if (setOnNewRideNotification) {
      setOnNewRideNotification(handleNewRideNotification)
    }
  }, [setOnNewRideNotification, handleNewRideNotification])

  useEffect(() => {
    if (shouldRefresh && isOnline && clearRefreshFlag) {
      console.log("🔄 Refreshing rides due to notification...")
      refetchRides()
      clearRefreshFlag()
    }
  }, [shouldRefresh, refetchRides, clearRefreshFlag, isOnline])

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

      if (!isOnline) return

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
            
            // Update tracking route if needed
            if (isTracking && trackingInfo) {
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

    if (isOnline) {
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
  }, [isOnline, isTracking, trackingInfo])

  useEffect(() => {
    if (isOnline && getRides?.data && Array.isArray(getRides.data) && getRides.data.length > 0) {
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
  }, [isOnline, getRides?.data, pulseAnim])

  const dismissBanner = () => {
    setShowBanner(false)
  }

  const handleStatusTogglePress = (status: boolean) => {
    // Check if KYC is complete before allowing user to go online
    if (status && !isKYCComplete(ridersKyc)) {
      // toast.show("Please complete your KYC verification to go online", { type: "warning" })
      setShowKYCModal(true)
      return
    }
    
    setPendingOnlineStatus(status)
    setShowConfirmationModal(true)
  }

  const confirmStatusChange = () => {
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
              stopTracking()
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
    setSelectedRide(ride)
    setShowActiveRidesBottomSheet(false)
    setShowRideDetailsModal(true)
  }

  const handleAcceptedRideSelect = (ride: any) => {
    if (!isOnline) {
      toast.show("You need to be online to manage rides.", { type: "warning" })
      return
    }
    setSelectedRide(ride)
    setShowAcceptedRideBottomSheet(false)
  }

  const handleDeclineRide = () => {
    setSelectedRide(null)
    setShowRideDetailsModal(false)
  }

  const handleRideAccepted = async (rideId: number) => {
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
    console.log("Marking ride for pickup:", ride)
    refetchMyRide()
  }

  const handleNewRidesPress = () => {
    if (!isOnline) {
      toast.show("You need to go online to view available rides.", { type: "warning" })
      return
    }
    // Check KYC before showing rides
    if (!isKYCComplete(ridersKyc)) {
      toast.show("Please complete your KYC verification to view rides", { type: "warning" })
      setShowKYCModal(true)
      return
    }
    setShowActiveRidesBottomSheet(true)
  }

  const handleAcceptedRidePress = () => {
    if (!isOnline) {
      toast.show("You need to be online to manage your rides.", { type: "warning" })
      return
    }
    if (myRidersRide?.data) {
      setSelectedRide(myRidersRide.data)
      setShowAcceptedRideBottomSheet(true)
    }
  }

  const ridesData = getRides?.data
  const newRides = isOnline && Array.isArray(ridesData) ? ridesData.filter((ride: any) => ride?.accepted === false) : []

  const getAcceptedRideButtonConfig = () => {
    if (!myRidersRide?.data) return null
    
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
        bgColor: "bg-green-600",
        textColor: "text-white",
        icon: "checkmark-done"
      }
    } else if (rideData.accepted === true) {
      return {
        text: "View Accepted Ride",
        ride: rideData,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "checkmark-circle"
      }
    }
    
    return null
  }

  const buttonConfig = getAcceptedRideButtonConfig()
  const isLoading = isInitializing || onlineCheckLoading || isKYCLoading || isRiderLoading || (!location && !isInitializing)

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isLoading} />
      
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
                className="flex w-9 h-9 mr-2 rounded-full bg-neutral-200 justify-center items-center overflow-hidden"
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
                    <Text
                      style={{ fontFamily: "HankenGrotesk_500Medium" }}
                      className="text-black font-semibold text-sm mr-2"
                    >
                      {profile?.data?.fullname}
                    </Text>
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
                      <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-xs">
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
          <View className="absolute top-16 left-4 right-4 z-10 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="location" size={18} color="#3B82F6" className="mr-2" />
                <View>
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-800 text-sm font-medium">
                    Tracking delivery route
                  </Text>
                  {trackingDistance && trackingDuration && (
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-xs mt-1">
                      {trackingDistance} • {trackingDuration}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={openExternalNavigation} 
                  className="bg-blue-600 px-3 py-2 rounded-full flex-row items-center"
                >
                  <Ionicons name="navigate" size={16} color="white" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-xs ml-1">
                    Navigate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={stopTracking} 
                  className="bg-red-600 px-3 py-2 rounded-full flex-row items-center"
                >
                  <Ionicons name="stop-circle" size={16} color="white" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-xs ml-1">
                    Stop
                  </Text>
                </TouchableOpacity>
              </View>
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


        {mapRegion && location && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            style={{ width: "100%", height: "120%" }}
            // customMapStyle={darkMapStyle}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
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
                <View className="bg-[#F75F15] p-2 rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="location" size={20} color="white" />
                </View>
              </Marker>
            )}

            {isTracking && trackingInfo && (
              <>
                <Marker
                  coordinate={trackingInfo.pickupCoords}
                  title="Pickup Location"
                  description={trackingInfo.pickupAddress}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View className="bg-blue-600 p-2 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="storefront" size={20} color="white" />
                  </View>
                </Marker>
                <Marker
                  coordinate={trackingInfo.dropoffCoords}
                  title="Drop-off Location"
                  description={trackingInfo.dropoffAddress}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View className="bg-green-600 p-2 rounded-full items-center justify-center shadow-lg">
                    <Ionicons name="flag" size={20} color="white" />
                  </View>
                </Marker>
              </>
            )}

            {isTracking && routeCoordinates && routeCoordinates.length > 0 && (
              <Polyline 
                coordinates={routeCoordinates} 
                strokeColor="#3B82F6" 
                strokeWidth={4}
              />
            )}
          </MapView>
        )}

        {(!mapRegion || !location) && !isLoading && (
          <View className="flex-1 bg-neutral-800 items-center justify-center">
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
            {isOnline && buttonConfig && (
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => {
                    if (buttonConfig.ride && !buttonConfig.disabled) {
                      handleAcceptedRidePress()
                    }
                  }}
                  className={`${buttonConfig.bgColor} py-3 rounded-full gap-2 flex-row items-center justify-center ${
                    buttonConfig.disabled ? 'opacity-50' : ''
                  }`}
                  disabled={buttonConfig.disabled}
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className={`${buttonConfig.textColor || 'text-white'} font-semibold text-sm`}
                  >
                    {buttonConfig.text}
                  </Text>
                  <Ionicons name={buttonConfig.icon as any} size={15} color={buttonConfig.textColor === 'text-white' ? "white" : "blue"} />
                </TouchableOpacity>
              </View>
            )}

            {(!isOnline || !buttonConfig) && (
              <View className="w-[48%]">
                <Animated.View
                  style={{
                    transform: [{ scale: isOnline ? pulseAnim : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={handleNewRidesPress}
                    className={`py-3 rounded-full gap-2 flex-row items-center justify-center ${
                      isOnline ? "bg-green-100 border border-green-300" : "bg-gray-100 border border-gray-300"
                    }`}
                    style={
                      isOnline
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
                      className={`font-semibold text-sm ${isOnline ? "text-green-800" : "text-gray-500"}`}
                    >
                      New Rides ({newRides.length})
                    </Text>
                    <Ionicons name="bicycle" size={15} color={isOnline ? "green" : "gray"} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            <View className={isOnline && buttonConfig ? "flex-1" : "w-[48%]"}>
              {isOnline === false ? (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(true)}
                  className="bg-green-600 py-3 rounded-full flex-row gap-2 items-center justify-center px-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text
                        style={{ fontFamily: "HankenGrotesk_500Medium" }}
                        className="text-white text-center text-sm font-semibold"
                      >
                        Go online
                      </Text>
                      <MaterialIcons name="online-prediction" size={15} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(false)}
                  className="bg-[#F75F15] py-3 rounded-full justify-center gap-2 flex-row items-center px-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-sm font-semibold">
                        Go offline
                      </Text>
                      <MaterialIcons name="airplanemode-on" size={15} color="white" />
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
                  ₦ 00.00
                </Text>
              </View>
              <TouchableOpacity className="bg-white rounded-full p-1" onPress={() => router.push("/(access)/(rider_tabs)/riderWallet")}>
                <MaterialIcons name="arrow-forward" size={20} color="#F75F15" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center h-20 gap-2 bg-gray-100 border border-neutral-100 p-3 w-[49%] rounded-2xl justify-center">
              <View className="bg-white p-2 rounded-full mr-3">
                <Ionicons name="car" size={20} color="#F75F15" />
              </View>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-2xl font-bold text-neutral-900">
                20
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

           
            {/* <View className="flex-row items-center border border-neutral-100 p-3 w-[49%] rounded-2xl justify-center">
              <View className="bg-neutral-100 p-2 rounded-full mr-3">
                <Ionicons name="time" size={18} color="#374151" />
              </View>
              <View>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900">
                  0 hrs
                </Text>
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-500 text-xs">
                  Login time
                </Text>
              </View>
            </View> */}
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
              className="text-lg font-bold text-neutral-900 mb-4 text-center"
            >
              Confirm Status Change
            </Text>
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-neutral-700 text-sm mb-6 text-center"
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
                className={`py-3 px-6 rounded-full flex-1 mx-2 items-center ${pendingOnlineStatus ? "bg-green-600" : "bg-red-600"}`}
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

      {isOnline && !rideLoading && (
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