"use client"
import { View, Text, TouchableOpacity, Dimensions, Alert, ScrollView, Modal, ActivityIndicator, Animated, Easing, Image } from "react-native"
import { useState, useEffect, useRef } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps"
import MapViewDirections from "react-native-maps-directions"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { router } from "expo-router"
import { useRiderGoOnline, useRiderGoOnlineCheck } from "@/hooks/mutations/ridersAuth"
import { useToast } from "react-native-toast-notifications"
import { useMutation } from "@tanstack/react-query"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { post_requests } from "@/hooks/helpers/axios_helpers"
import ActiveRidesBottomSheet from "@/components/ActiveRidesBottomSheet"
import RideDetailsModal from "@/components/RideDetailsModal"

const { width, height } = Dimensions.get("window")
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY

// Dummy data for active rides
const dummyActiveRides = [
  {
    id: "1",
    riderName: "Sunday Kingsley Uchenna",
    riderHandle: "iamkvisuals",
    profileImage: "/placeholder.svg?height=50&width=50",
    pickupAddress: "Airport Road Port Harcourt",
    dropoffAddress: "Airport Road Port Harcourt",
    payment: "800",
    courierType: "Bike",
    packageType: "Parcel",
    estimatedTime: 9,
    specialNotes: "Call when outside",
    destinationLatitude: 4.84913,
    destinationLongitude: 7.0516,
  },
  {
    id: "2",
    riderName: "Jane Doe",
    riderHandle: "janedoe",
    profileImage: "/placeholder.svg?height=50&width=50",
    pickupAddress: "123 Main St, City",
    dropoffAddress: "456 Oak Ave, Town",
    payment: "1200",
    courierType: "Car",
    packageType: "Document",
    estimatedTime: 15,
    specialNotes: "Deliver to reception",
    destinationLatitude: 4.855,
    destinationLongitude: 7.060,
  },
]

const RiderHome = () => {
  const [location, setLocation] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(true)
  const [mapRegion, setMapRegion] = useState<any>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const mapRef = useRef<MapView>(null)

  // States for confirmation modal (go online/offline)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [pendingOnlineStatus, setPendingOnlineStatus] = useState<boolean | null>(null)

  // States for active rides and ride details modal
  const [showActiveRidesBottomSheet, setShowActiveRidesBottomSheet] = useState(false)
  const [showRideDetailsModal, setShowRideDetailsModal] = useState(false)
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const [activeRideDestination, setActiveRideDestination] = useState<any>(null) // Holds the destination of the currently accepted ride

  const { mutate, isPending } = useRiderGoOnline()
  const { isRiderOnline, isLoading } = useRiderGoOnlineCheck()
  const isOnline = isRiderOnline?.data?.online
  const toast = useToast()

  const pulseAnim = useRef(new Animated.Value(1)).current // Initial scale value for glowing effect

  const locationUpdate = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number }) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/update-longlat`, data, token)
    },
  })

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
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const userLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
      setLocation(userLocation)
      setMapRegion(userLocation) // Set initial map region to user's location
      // Post initial location update
      locationUpdate.mutate(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        {
          onSuccess: () => {
            toast.show("Initial location updated successfully!", { type: "success" })
          },
          onError: (error: any) => {
            console.error("Initial location update failed:", error)
            toast.show(`Failed to update initial location: ${error.message || "Unknown error"}`, { type: "danger" })
          },
        },
      )
    })()
  }, [])

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | any = null
    const startLocationTracking = async () => {
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 1609,
        },
        (newLocation) => {
          const updatedLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
          setLocation(updatedLocation)
          if (isNavigating && mapRef.current) {
            mapRef.current.animateToRegion(
              {
                ...updatedLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500,
            )
          }
          // Post location update if rider is online
          if (isOnline) {
            locationUpdate.mutate(
              {
                latitude: updatedLocation.latitude,
                longitude: updatedLocation.longitude,
              },
              {
                onSuccess: () => {
                  toast.show("Location updated successfully!", { type: "success" })
                },
                onError: (error: any) => {
                  console.error("Periodic location update failed:", error)
                },
              },
            )
          }
        },
      )
    }
    if (isOnline) {
      startLocationTracking()
    } else {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [isOnline, isNavigating])

  // Glowing effect for "Active Ride" button
  useEffect(() => {
    if (isOnline && dummyActiveRides.length > 0 && !isNavigating) {
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
      pulseAnim.setValue(1) // Reset scale
    }
  }, [isOnline, dummyActiveRides.length, isNavigating])

  const dismissBanner = () => {
    setShowBanner(false)
  }

  const startNavigation = (ride: any) => {
    if (!location) {
      Alert.alert("Location Error", "Unable to get your current location. Please wait a moment and try again.")
      return
    }
    const newDestination = {
      latitude: ride.destinationLatitude,
      longitude: ride.destinationLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    setActiveRideDestination(newDestination)
    setIsNavigating(true)
    setShowRideDetailsModal(false) // Close ride details modal
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: newDestination.latitude, longitude: newDestination.longitude },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        },
      )
    }
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    setEstimatedTime(null)
    setDistance(null)
    setActiveRideDestination(null) // Clear active ride destination
    setSelectedRide(null) // Clear selected ride
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
    }
  }

  const onDirectionsReady = (result: any) => {
    setDistance(result.distance)
    setEstimatedTime(result.duration)
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      })
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = Math.round(minutes % 60)
      return `${hours}h ${remainingMinutes}m`
    }
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
    setSelectedRide(ride)
    setShowActiveRidesBottomSheet(false) // Close bottom sheet
    setShowRideDetailsModal(true) // Open ride details modal
  }

  const handleDeclineRide = () => {
    setSelectedRide(null)
    setShowRideDetailsModal(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-5 pb-2 border-b border-neutral-100">
        <View className="flex-row items-center">
          <View className="w-7 h-7 bg-neutral-200 rounded-full items-center justify-center mr-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 font-semibold text-sm">
              SJ
            </Text>
          </View>
          {/* Status Info */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                style={{ fontFamily: "HankenGrotesk_500Medium" }}
                className="text-neutral-900 font-semibold text-sm mr-2"
              >
                Sarah Jacobs
              </Text>
              {/* Status Indicator Dot */}
              <View className={`w-2 h-2 rounded-full ${isOnline === true ? "bg-green-500" : "bg-red-500"}`} />
            </View>
          </View>
          {/* Quick Status Toggle */}
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
      {/* Map Container */}
      <View style={{ height: height * 0.6 }} className="relative">
        {/* Verification Banner */}
        {showBanner && (
          <View className="absolute top-4 left-4 right-4 z-10 bg-green-100 border border-green-300 rounded-2xl p-3 flex-row items-start justify-between">
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
        {/* Navigation Info Card */}
        {isNavigating && (estimatedTime !== null || distance !== null) && (
          <View className="absolute top-20 left-4 right-4 z-10 bg-white border mt-1 border-neutral-200 rounded-2xl p-2 px-4 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="navigate" size={16} color="#F75F15" />
                <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-900 font-semibold ml-2">
                  To: {selectedRide?.dropoffAddress || "Destination"}
                </Text>
              </View>
              <TouchableOpacity onPress={stopNavigation}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-between mt-2">
              {estimatedTime !== null && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm ml-1">
                    {formatTime(estimatedTime)}
                  </Text>
                </View>
              )}
              {distance !== null && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm ml-1">
                    {distance.toFixed(1)} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          style={{ width: "100%", height: "100%" }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={isNavigating} // Map follows user only when navigating
          onRegionChangeComplete={(region) => {
            // Only update mapRegion if not navigating, allowing manual pan/zoom
            if (!isNavigating) {
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
            >
              <View className="bg-[#F75F15] p-2 rounded-full items-center justify-center">
                <Ionicons name="location" size={20} color="white" />
              </View>
            </Marker>
          )}
          {/* Destination marker */}
          {isNavigating && activeRideDestination && (
            <Marker coordinate={activeRideDestination} title="Destination" description={selectedRide?.dropoffAddress || "Destination"}>
              <View className="bg-green-600 p-2 rounded-full items-center justify-center">
                <Ionicons name="flag" size={20} color="white" />
              </View>
            </Marker>
          )}
          {/* Route directions */}
          {isNavigating && location && activeRideDestination && GOOGLE_PLACES_API_KEY && (
            <MapViewDirections
              origin={{ latitude: location.latitude, longitude: location.longitude }}
              destination={{ latitude: activeRideDestination.latitude, longitude: activeRideDestination.longitude }}
              apikey={GOOGLE_PLACES_API_KEY}
              strokeWidth={4}
              strokeColor="#F75F15"
              optimizeWaypoints={true}
              onReady={onDirectionsReady}
              onError={(errorMessage) => {
                console.log("Directions error: ", errorMessage)
                Alert.alert(
                  "Directions Error",
                  "Could not fetch directions. Please check your internet connection or API key.",
                )
              }}
            />
          )}
        </MapView>
      </View>
      {/* Scrollable Content Section */}
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-1">
          {/* Welcome Section */}
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-xl font-bold text-neutral-900 mb-1">
            Welcome, Sarah Jacobs
          </Text>
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-neutral-600 text-sm mb-4">
            Deliver goods and earn on your own schedule.
          </Text>
          <View className="flex-row justify-between items-center pb-2">
            {/* Active Ride / Stop Pickup Button */}
            <View className="w-[48%]">
              {!isNavigating ? (
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }],
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowActiveRidesBottomSheet(true)}
                    className="bg-green-100 py-3 rounded-full gap-2 shadow-green-600 drop-shadow-lg flex-row items-center justify-center"
                  >
                    <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-green-800 font-semibold text-base">
                      New Rides
                    </Text>
                    <Ionicons name="bicycle" size={15} color="green" />
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity
                  onPress={stopNavigation}
                  className="bg-[#fff8f4] border-red-100 border py-3 rounded-full flex-row items-center justify-center"
                >
                  <Ionicons name="stop-circle" size={15} color="#A53F0E" />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-[#A53F0E] font-semibold ml-2">
                    Stop Pickup
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="w-[48%]">
              {isOnline === false ? (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(true)}
                  className="bg-green-600 py-3 rounded-full flex-row gap-2 items-center justify-center px-2"
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-white text-center text-base font-semibold ml-2"
                  >
                    Go online
                  </Text>
                  <MaterialIcons name="online-prediction" size={18} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleStatusTogglePress(false)}
                  className="bg-[#F75F15] py-3 rounded-full justify-center gap-2 flex-row items-center px-2"
                >
                  <Text
                    style={{ fontFamily: "HankenGrotesk_500Medium" }}
                    className="text-white text-base font-semibold"
                  >
                    Go offline
                  </Text>
                  <MaterialIcons name="airplanemode-on" size={15} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Earnings Section */}
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
          {/* Stats Section */}
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
      {/* Confirmation Modal (Go online/offline) */}
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

      {/* Active Rides Bottom Sheet Modal */}
      <ActiveRidesBottomSheet
        isVisible={showActiveRidesBottomSheet}
        onClose={() => setShowActiveRidesBottomSheet(false)}
        rides={dummyActiveRides}
        onSelectRide={handleRideSelect}
      />

      {/* Ride Details Modal */}
      <RideDetailsModal
        isVisible={showRideDetailsModal}
        onClose={handleDeclineRide} // Decline also closes the modal
        ride={selectedRide}
        onAccept={startNavigation}
        onDecline={handleDeclineRide}
      />
    </SafeAreaView>
  )
}

export default RiderHome