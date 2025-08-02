import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get_requests, post_requests, put_requests } from "../helpers/axios_helpers"
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



export const useGetRides = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["ride"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/rides/", token);
    },
  });

  return {
    getRides: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

// https://api.movbay.com/logistics/rides/



// ================= RIDERS BANK ===================
export const useGetRiderBank = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/bank-details/", token);
    },
  });

  return {
    getRidersBank: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useAddBank = () => {
  const queryClient = useQueryClient()

  const riderAddBank = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return put_requests(`/logistics/bank-details/`, data, token)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank"] })
    },
  })

  return riderAddBank
}



// ====================== ACCEPT RIDE ====================
export const useAcceptRide = (id: any) => {
  const queryClient = useQueryClient()

  const acceptRide = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/accept-ride/${id}/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
    },
  })

  return acceptRide
}


export const usePickedUp = (id: any) => {
  const queryClient = useQueryClient()

  const pickedUp = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/mark-as-picked/${id}/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
    },
  })

  return pickedUp
}

