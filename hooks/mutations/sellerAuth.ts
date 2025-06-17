import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get_requests, post_request_with_image, put_request_with_image } from "../helpers/axios_helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";



export const useGetStore = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/dashboard/", token);
    },
  });

  return {
    storeData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



export const useCreateStore = () => {
  const queryClient = useQueryClient()

  const createStore = useMutation({
    mutationFn: async (data: FormData) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_request_with_image(`/stores/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] })
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })

  return createStore
}