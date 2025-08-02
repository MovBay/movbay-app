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
import { useGetRides, useRiderGoOnline, useRiderGoOnlineCheck } from "@/hooks/mutations/ridersAuth"
import { useToast } from "react-native-toast-notifications"
import { useMutation } from "@tanstack/react-query"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { post_requests } from "@/hooks/helpers/axios_helpers"
import ActiveRidesBottomSheet from "@/components/ActiveRidesBottomSheet"
import AcceptedRideDetailsBottomSheet from "@/components/AcceptedRideDetailsBottomSheet"
import RideDetailsModal from "@/components/RideDetailsModal"
import { useNotification } from "@/context/NotificationContext"

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

interface DropOffCoordinates {
  latitude: number
  longitude: number
  timestamp: string
}

const RiderHome = () => {
  const [location, setLocation] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [mapRegion, setMapRegion] = useState<any>(null)
  const mapRef = useRef<MapView>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [dropOffLocation, setDropOffLocation] = useState<DropOffCoordinates | null>(null)
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
  
  // Add refs to prevent unnecessary re-renders
  const lastLocationUpdate = useRef<number>(0)
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)
  
  const { mutate, isPending } = useRiderGoOnline()
  const { isRiderOnline, isLoading } = useRiderGoOnlineCheck()
  const { getRides, isLoading: rideLoading, refetch: refetchRides } = useGetRides()
  const isOnline = isRiderOnline?.data?.online
  const toast = useToast()
  const { setOnNewRideNotification, shouldRefresh, clearRefreshFlag } = useNotification()
  const pulseAnim = useRef(new Animated.Value(1)).current

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

  const getDirections = async (origin: any, destination: any) => {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`,
      )
      const data = await response.json()
      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0]
        const leg = route.legs[0]
        const points = decodePolyline(route.overview_polyline.points)
        setRouteCoordinates(points)
        setTrackingDistance(leg.distance.text)
        setTrackingDuration(leg.duration.text)
        
        return points
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

  const checkAndStartTracking = async () => {
    try {
      const savedCoordinates = await AsyncStorage.getItem("dropoff_coordinates")
      if (savedCoordinates) {
        const coordinates: DropOffCoordinates = JSON.parse(savedCoordinates)
        setDropOffLocation(coordinates)
        setIsTracking(true)
        
        if (location) {
          await getDirections(location, coordinates)
          if (!hasShownTrackingToast) {
            setHasShownTrackingToast(true)
          }
        }
        return true
      }
      return false
    } catch (error) {
      console.error("Error checking saved coordinates:", error)
      toast.show("Failed to start tracking", { type: "danger" })
      return false
    }
  }

  const openExternalNavigation = () => {
    if (!dropOffLocation) {
      toast.show("No drop-off location available", { type: "warning" })
      return
    }
    Alert.alert("Open Navigation", "Choose your preferred navigation app:", [
      {
        text: "Google Maps",
        onPress: () => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${dropOffLocation.latitude},${dropOffLocation.longitude}&travelmode=driving`
          Linking.openURL(url).catch(() => {
            toast.show("Failed to open Google Maps", { type: "danger" })
          })
        },
      },
      {
        text: Platform.OS === "ios" ? "Apple Maps" : "Default Maps",
        onPress: () => {
          const url = Platform.select({
            ios: `http://maps.apple.com/?daddr=${dropOffLocation.latitude},${dropOffLocation.longitude}`,
            android: `geo:${dropOffLocation.latitude},${dropOffLocation.longitude}?q=${dropOffLocation.latitude},${dropOffLocation.longitude}`,
          })
          if (url) {
            Linking.openURL(url).catch(() => {
              toast.show("Failed to open maps app", { type: "danger" })
            })
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const stopTracking = async () => {
    try {
      await AsyncStorage.removeItem("dropoff_coordinates")
      setIsTracking(false)
      setDropOffLocation(null)
      setRouteCoordinates([])
      setTrackingDistance("")
      setTrackingDuration("")
      setHasShownTrackingToast(false)
      toast.show("Tracking stopped", { type: "info" })
    } catch (error) {
      console.error("Error stopping tracking:", error)
    }
  }

  const handleNewRideNotification = useCallback(() => {
    if (isOnline) {
      console.log("🔄 Refreshing rides due to new ride notification...")
      refetchRides()
      toast.show("New ride available! Check your active rides.", { type: "info" })
    }
  }, [refetchRides, toast, isOnline])

  useEffect(() => {
    setOnNewRideNotification(handleNewRideNotification)
  }, [setOnNewRideNotification, handleNewRideNotification])

  useEffect(() => {
    if (shouldRefresh && isOnline) {
      console.log("🔄 Refreshing rides due to notification...")
      refetchRides()
      clearRefreshFlag()
    }
  }, [shouldRefresh, refetchRides, clearRefreshFlag, isOnline])

  useEffect(() => {
    const initializeTracking = async () => {
      if (location) {
        await checkAndStartTracking()
      }
    }
    initializeTracking()
  }, [location])

  // Initialize location once
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "Permission to access location was denied. Please enable it in settings to use this feature.",
        )
        return
      }
      
      try {
        const currentLocation = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High
        })
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
              toast.show(`Failed to update initial location: ${error.message || "Unknown error"}`, { type: "danger" })
            },
          },
        )
      } catch (error) {
        console.error("Error getting initial location:", error)
        toast.show("Failed to get your location", { type: "danger" })
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
            if (isTracking && dropOffLocation) {
              getDirections(updatedLocation, dropOffLocation)
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
  }, [isOnline, isTracking, dropOffLocation])

  useEffect(() => {
    if (isOnline && getRides?.data && getRides.data.length > 0) {
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
    setPendingOnlineStatus(status)
    setShowConfirmationModal(true)
  }

  const confirmStatusChange = () => {
    if (pendingOnlineStatus !== null) {
      mutate(
        { online: pendingOnlineStatus },
        {
          onSuccess: () => {
            setShowConfirmationModal(false)
            toast.show(`You are now ${pendingOnlineStatus ? "online" : "offline"}.`, { type: "success" })
            if (!pendingOnlineStatus) {
              setShowActiveRidesBottomSheet(false)
              setShowAcceptedRideBottomSheet(false)
              setShowRideDetailsModal(false)
              setSelectedRide(null)
              stopTracking()
            }
          },
          onError: (error: any) => {
            setShowConfirmationModal(false)
            Alert.alert("Error", `Failed to change status: ${error.message || "Unknown error"}`)
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

  const handleMarkForPickup = async (ride: any) => {
    if (!isOnline) {
      toast.show("You need to be online to manage rides.", { type: "warning" })
      return
    }
    console.log("Marking ride for pickup:", ride)
    const trackingStarted = await checkAndStartTracking()
    if (trackingStarted) {
      toast.show("Ride marked for pickup! Tracking to drop-off location started.", { type: "success" })
    } else {
      toast.show("Ride marked for pickup! No drop-off coordinates found.", { type: "info" })
    }
  }

  const handleNewRidesPress = () => {
    if (!isOnline) {
      toast.show("You need to go online to view available rides.", { type: "warning" })
      return
    }
    setShowActiveRidesBottomSheet(true)
  }

  const handleAcceptedRidePress = () => {
    if (!isOnline) {
      toast.show("You need to be online to manage your rides.", { type: "warning" })
      return
    }
    setShowAcceptedRideBottomSheet(true)
  }

  const acceptedRides = isOnline ? getRides?.data?.filter((ride: any) => ride.accepted === true) || [] : []
  const newRides = isOnline ? getRides?.data?.filter((ride: any) => ride.accepted === false) || [] : []

  // Check if there's an accepted ride with out_for_delivery status
  const outForDeliveryRide = acceptedRides.find((ride: any) => ride.order?.status === "out_for_delivery")
  const regularAcceptedRide = acceptedRides.find((ride: any) => ride.order?.status !== "out_for_delivery")

  // Determine button text and action based on ride status
  const getAcceptedRideButtonConfig = () => {
    if (outForDeliveryRide) {
      return {
        text: "Mark as Delivered",
        ride: outForDeliveryRide,
        bgColor: "bg-green-600",
        icon: "checkmark-done"
      }
    } else if (regularAcceptedRide) {
      return {
        text: "View Accepted Ride",
        ride: regularAcceptedRide,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        icon: "checkmark-circle"
      }
    }
    return null
  }

  const buttonConfig = getAcceptedRideButtonConfig()

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <StatusBar style="light" />
      <View className="px-5 pb-2">
        <View className="flex-row items-center">
          <View className="w-7 h-7 bg-neutral-200 rounded-full items-center justify-center mr-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 font-semibold text-sm">
              SJ
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-white font-semibold text-sm mr-2"
              >
                Sarah Jacobs
              </Text>
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
      </View>

      <View style={{ height: height * 0.6 }} className="relative">
        {showBanner && (
          <View className="absolute top-0 left-4 right-4 z-10 bg-green-100 border border-green-300 rounded-2xl p-3 flex-row items-start justify-between">
            <View className="flex-1">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-800 text-sm font-medium">
                Your account has been verified! You can now start accepting deliveries and receiving payouts.
              </Text>
            </View>
            <TouchableOpacity onPress={dismissBanner} className="ml-2">
              <Ionicons name="close" size={18} color="#166534" />
            </TouchableOpacity>
          </View>
        )}

        {isTracking && dropOffLocation && (
          <View className="absolute top-2 mt-0 left-4 right-4 z-10 bg-white rounded-xl p-3 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="location" size={18} color="#3B82F6" className="mr-2" />
                <View>
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-800 text-sm font-medium">
                    Tracking to drop-off
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
                  className="bg-white px-3 py-2 rounded-full flex-row items-center"
                >
                  <Ionicons name="navigate" size={16} color="#3B82F6" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-blue-600 text-xs ml-1">
                    Navigate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={stopTracking} 
                  className="bg-white px-3 py-2 rounded-full flex-row items-center"
                >
                  <Ionicons name="stop-circle" size={16} color="#EF4444" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-red-600 text-xs ml-1">
                    Stop
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {!isOnline && (
          <View className="absolute top-2 left-4 right-4 z-10 bg-orange-50 rounded-lg p-3">
            <Text
              style={{ fontFamily: "HankenGrotesk_500Medium" }}
              className="text-orange-700 text-sm font-medium text-center"
            >
              You are offline. Go online to start receiving ride requests.
            </Text>
          </View>
        )}

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          style={{ width: "100%", height: "100%" }}
          customMapStyle={darkMapStyle}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          onRegionChangeComplete={(region) => {
            if (mapRegion && 
                Math.abs(region.latitude - mapRegion.latitude) > 0.001 ||
                Math.abs(region.longitude - mapRegion.longitude) > 0.001 ||
                Math.abs(region.latitudeDelta - mapRegion.latitudeDelta) > 0.001 ||
                Math.abs(region.longitudeDelta - mapRegion.longitudeDelta) > 0.001) {
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

          {isTracking && dropOffLocation && (
            <Marker
              coordinate={{
                latitude: dropOffLocation.latitude,
                longitude: dropOffLocation.longitude,
              }}
              title="Drop-off Location"
              description="Delivery destination"
              anchor={{ x: 0.5, y: 1 }}
            >
              <View className="bg-green-600 p-2 rounded-full items-center justify-center shadow-lg">
                <Ionicons name="flag" size={20} color="white" />
              </View>
            </Marker>
          )}

          {isTracking && routeCoordinates.length > 0 && (
            <Polyline 
              coordinates={routeCoordinates} 
              strokeColor="#3B82F6" 
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      <ScrollView className="flex-1 px-5 pt-4 bg-white">
        <View className="flex-1">
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900 mb-1">
            Welcome, Sarah Jacobs
          </Text>
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm mb-4">
            Deliver goods and earn on your own schedule.
          </Text>

          <View className="flex-row justify-between items-center pb-2 gap-2">
            {isOnline && buttonConfig && (
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedRide(buttonConfig.ride)
                    setShowAcceptedRideBottomSheet(true)
                  }}
                  className={`${buttonConfig.bgColor} py-3 rounded-full gap-2 flex-row items-center justify-center ${
                    outForDeliveryRide ? '' : 'border border-blue-300'
                  }`}
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className={`${buttonConfig.textColor || 'text-white'} font-semibold text-sm`}
                  >
                    {buttonConfig.text}
                  </Text>
                  <Ionicons name={buttonConfig.icon as any} size={15} color={outForDeliveryRide ? "white" : "blue"} />
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
                      New Rides
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
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-white text-center text-sm font-semibold"
                  >
                    Go online
                  </Text>
                  <MaterialIcons name="online-prediction" size={15} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(false)}
                  className="bg-[#F75F15] py-3 rounded-full justify-center gap-2 flex-row items-center px-2"
                >
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-white text-sm font-semibold">
                    Go offline
                  </Text>
                  <MaterialIcons name="airplanemode-on" size={15} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-neutral-100 p-3">
            <View>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm mb-1">
                Total Earnings
              </Text>
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900">
                ₦ 00.00
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(access)/(rider_tabs)/riderWallet")}>
              <MaterialIcons name="arrow-forward" size={25} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-8">
            <View className="flex-row items-center gap-2 border border-neutral-100 p-3 w-[49%] rounded-2xl justify-center">
              <View className="bg-neutral-100 p-2 rounded-full mr-3">
                <Ionicons name="car" size={20} color="#374151" />
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
            <View className="flex-row items-center border border-neutral-100 p-3 w-[49%] rounded-2xl justify-center">
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
          <ActiveRidesBottomSheet
            isVisible={showActiveRidesBottomSheet}
            onClose={() => setShowActiveRidesBottomSheet(false)}
            rides={newRides}
            onSelectRide={handleRideSelect}
            onRefresh={refetchRides}
            refreshing={rideLoading}
          />

          <AcceptedRideDetailsBottomSheet
            isVisible={showAcceptedRideBottomSheet}
            onClose={() => setShowAcceptedRideBottomSheet(false)}
            ride={selectedRide}
            onMarkForPickup={handleMarkForPickup}
          />

          <RideDetailsModal
            isVisible={showRideDetailsModal}
            onClose={handleDeclineRide}
            ride={selectedRide}
            onAccept={() => {
              refetchRides()
              handleDeclineRide()
            }}
            onDecline={handleDeclineRide}
          />
        </>
      )}
    </SafeAreaView>
  )
}

export default RiderHome