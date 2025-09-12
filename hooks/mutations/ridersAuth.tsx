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
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return acceptRide
}

// ====================== GET RIDER'S SPECIFIC RIDE ====================
export const useGetRidersRide = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["myRide", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/logistics/myrides/${id}`, token);
    },
    enabled: !!id && id !== null && !isNaN(Number(id)),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  return {
    myRidersRide: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

// ====================== MARK AS PICKED UP / DELIVERED ====================
export const usePickedUp = (id: any) => {
  const queryClient = useQueryClient()

  const pickedUp = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/mark-as-picked/${id}/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return pickedUp
}

export const useDelivered = (orderID: any) => {
  const queryClient = useQueryClient()

  const delivered = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${orderID}/mark-as-delivered`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return delivered
};

// ====================== VERIFY ORDER ====================
export const useVerifyDeliveryOrder = (orderID: any) => {
  const queryClient = useQueryClient()

  const verifyOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/verify-order/${orderID}/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return verifyOrder
};



// ================= Total Earnings =====================

export const useGetRidersEarnings = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["earnings"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/total-earnings/", token);
    },
  });

  return {
    getRidersEarnings: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useGetRidersCompletedRides = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["completed"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/completed-rides/", token);
    },
  });

  return {
    getRidersCompletedCount: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useGetVerifiedStatus = ()=>{
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["verified"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/check-rider-verified/", token);
    },
  })

  return{
    isRiderVerified: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  }
}




  // https://api.movbay.com/logistics/completed-rides/



// verify-order/MOVIBGAZ6WS/
// logistics/MOVIBGAZ6WS/mark-as-delivered/