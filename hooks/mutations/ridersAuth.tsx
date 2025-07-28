import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get_requests, post_requests } from "../helpers/axios_helpers"
import AsyncStorage from "@react-native-async-storage/async-storage"


export const useRiderGoOnlineCheck = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["online"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/go-online", token);
    },
  });

  return {
    isRiderOnline: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

export const useRiderGoOnline = () => {
  const queryClient = useQueryClient()

  const riderGoOnline = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/go-online`, data, token)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["online"] })
    },
  })

  return riderGoOnline
}



export const useUpdateLocation = () => {
  const updateLocation = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/update-longlat`, data, token)
    },
  })

  return updateLocation
}



// https://api.movbay.com/logistics/update-longlat