

// =============== CHATS ==================
// https://api.movbay.com/chats/

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get_requests, post_requests } from "../helpers/axios_helpers";


export const useGetChats = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/chats/`, token);
    },
  });

  return {
    getChats: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// /chats/messages/id

export const useCreateChat = () => {
  const queryClient = useQueryClient()

  const createChat = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/chats/messages/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })

  return createChat
}



export const useContinueChat = (roomID: any) => {
  const queryClient = useQueryClient()

  const continueChat = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/chats/dm/${roomID}`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })

  return continueChat
}




// http://movbay.com/ws/chat/user_5d79276a-fd0a-4f2f-9380-58eb3a82c23d_1/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU1ODc4NDE5LCJpYXQiOjE3NTU0NDY0MTksImp0aSI6IjA0MmIxYmM0MWEyMjQ2MTlhMTI2OTMwNzNlMWFiYmZiIiwidXNlcl9pZCI6IjVkNzkyNzZhLWZkMGEtNGYyZi05MzgwLTU4ZWIzYTgyYzIzZCJ9.0wVHg_OPquUbcI0CJZU9q_deHd5IgJ23kFm0VjfcPYU