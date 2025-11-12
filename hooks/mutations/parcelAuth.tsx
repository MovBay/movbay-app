


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get_requests, post_request_with_image, post_requests, put_requests } from "../helpers/axios_helpers"
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

export const useSendRidersRequest = (id: any) => {
  const parcelPrice = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_request_with_image(`/logistics/select-ride/${id}/`, data, token)
    }
  })

  return parcelPrice
};



export const useGetNearbyRides = (pickUpAddress: any, deliveryAddress: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["nearby", pickUpAddress, deliveryAddress],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      const encodedPickup = encodeURIComponent(pickUpAddress);
      const encodedDelivery = encodeURIComponent(deliveryAddress);
      
      const url = `/logistics/get-nearby-riders/?pickup_address=${encodedPickup}&delivery_address=${encodedDelivery}`;
      return get_requests(url, token);
    },
    enabled: !!pickUpAddress && !!deliveryAddress,
  });

  return {
    nearbyRides: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};
