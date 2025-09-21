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



// https://api.movbay.com/logistics/accept-ride/2/?type=order
// ====================== ACCEPT RIDE ====================
export const useAcceptOrderRide = (id: any) => {
  const queryClient = useQueryClient()

  const acceptOrderRide = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/accept-ride/${id}/?type=order`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride1"] })
      queryClient.invalidateQueries({ queryKey: ["myRide1"] })
    },
  })

  return acceptOrderRide
}


export const useAcceptPackageRide = (id: any) => {
  const queryClient = useQueryClient()

  const acceptPackageRide = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/accept-ride/${id}/?type=package-delivery`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride2"] })
      queryClient.invalidateQueries({ queryKey: ["myRide2"] })
    },
  })

  return acceptPackageRide
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


// https://api.movbay.com/mark-as-picked/2/?type=order
// ====================== MARK AS PICKED UP / DELIVERED ====================
export const useOrderPickedUp = (id: any) => {
  const queryClient = useQueryClient()

  const orderPickedUp = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/mark-as-picked/${id}/?type=order`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return orderPickedUp
}


export const usePackagePickedUp = (id: any) => {
  const queryClient = useQueryClient()

  const pickedUp = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/mark-as-picked/${id}/?type=package-delivery`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return pickedUp
}

export const useOrderDelivered = (id: any) => {
  const queryClient = useQueryClient()

  const orderDelivered = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${id}/mark-as-delivered?type=order`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return orderDelivered
};

export const usePackageDelivered = (id: any) => {
  const queryClient = useQueryClient()

  const packageDelivered = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      console.log('My URL', `/order/${id}/mark-as-delivered?type=package-delivery`)
      return post_requests(`/order/${id}/mark-as-delivered?type=package-delivery`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return packageDelivered
};


// ====================== VERIFY ORDER ====================
export const useVerifyDeliveryOrder = (orderID: any) => {
  const queryClient = useQueryClient()

  const verifyOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/verify-order/${orderID}/?type=order`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return verifyOrder
};


export const useVerifyDeliveryPackage = (id: any) => {
  const queryClient = useQueryClient()

  const verifyPackage = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/verify-order/${id}/?type=package-delivery`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ride"] })
      queryClient.invalidateQueries({ queryKey: ["myRide"] })
    },
  })

  return verifyPackage
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
