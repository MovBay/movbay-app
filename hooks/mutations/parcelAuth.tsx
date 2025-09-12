


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get_requests, post_requests, put_requests } from "../helpers/axios_helpers"
import AsyncStorage from "@react-native-async-storage/async-storage"


// ========================= PARCEL ====================
export const useGetParcelPrice = () => {
  const parcelPrice = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/get-location/`, data, token)
    }
  })

  return parcelPrice
};

export const useGetNearbyRides = (pickUpAddress: any, deliveryAddress: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["nearby", pickUpAddress, deliveryAddress], // Include parameters in queryKey
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      
      // Properly encode the URL parameters
      const encodedPickup = encodeURIComponent(pickUpAddress);
      const encodedDelivery = encodeURIComponent(deliveryAddress);
      
      const url = `/logistics/get-nearby-riders/?pickup_address=${encodedPickup}&delivery_address=${encodedDelivery}`;
    //   console.log('Fetching nearby rides from:', url);
      
      return get_requests(url, token);
    },
    // Only run the query if both addresses are available
    enabled: !!pickUpAddress && !!deliveryAddress,
    // refetchInterval: 30000,
    // refetchIntervalInBackground: true,
  });

  return {
    nearbyRides: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};
