import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get_requests, post_request_with_image, post_requests, put_request_with_image } from "../helpers/axios_helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";




// ================ STORE ================

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




// ============= USER PRODUCT ==================
export const useGetUserProducts = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["user-product"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/userproducts/", token);
    },
  });

  return {
    userProductData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

export const useGetSingleUserProducts = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["user-product", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/userproduct/${id}`, token);
    },
    enabled: !!id,
  });

  return {
    userSingleProductData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



// ============== ALL PRODUCTS ==================

export const useGetProducts = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["product"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/products/", token);
    },
  });

  return {
    productData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



export const useGetSingleProducts = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["user-product", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/products/${id}`, token);
    },
    enabled: !!id,
  });

  return {
    userProductData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  const createProduct = useMutation({
    mutationFn: async (data: FormData) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_request_with_image(`/products/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] })
    },
  })

  return createProduct
}



// ================== PAYMENTs HOOK ================

export const useGetWalletDetails = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/wallet/", token);
    },
  });

  return {
    walletData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

export const useFundWallet = () => {
  const queryClient = useQueryClient()
  const fundWalletMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests("/payment/fund-wallet/", data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  });

  return fundWalletMutation;
};


// ==================== CEATING STORY ==================
export const useCreateStory = () => {
  const queryClient = useQueryClient()

  const createStory = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_request_with_image(`/status/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status"] })
    },
  })

  return createStory
}

export const useGetStoreStatus = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/stores/", token);
    },
  });

  return {
    storeStatusData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



export const useGetSingleStatus = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["status", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/status/${id}/`, token);
    },
    enabled: !!id,
  });

  return {
    singleStatusData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// ====================== ORDERS ====================

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/payment/purchase-product/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] })
    },
  })

  return createOrder
}



// =============== CONFIRM ORDER ================
export const useComfirmOrder = (orderId: any) => {
  const queryClient = useQueryClient()
  const confirmOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${orderId}/confirm`, data, token)

    },
    onSuccess: () => {
      // Invalidate both new orders and processing orders to refresh the data
      queryClient.invalidateQueries({ queryKey: ["new-orders"] })
      queryClient.invalidateQueries({ queryKey: ["processing"] })
      
      // Optional: You can also refetch specific queries immediately
      queryClient.refetchQueries({ queryKey: ["new-orders"] })
      queryClient.refetchQueries({ queryKey: ["processing"] })
    },
    onError: (error) => {
      console.error("Error confirming order:", error)
      console.log("API:", `/order/${orderId}/confirm`)
    }
  })
  return confirmOrder
}


// ========== SELLERS NEW ORDERS ============
export const useGetNewOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["new-orders"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/orders/?status=new", token);
    },
  });

  return {
    newOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// ========== SELLERS PROCESSING ORDERS ============
export const useGetProcessingOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["processing"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/orders/?status=processing", token);
    },
  });

  return {
    processingOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// Additional hooks for different order statuses

// ========== SELLERS OUT FOR DELIVERY ORDERS ============
export const useGetOutForDeliveryOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["out-for-delivery"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/orders/?status=out_for_delivery", token);
    },
  });

  return {
    outForDeliveryOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

// ========== SELLERS COMPLETED ORDERS ============
export const useGetCompletedOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["completed"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/orders/?status=completed", token);
    },
  });

  return {
    completedOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

// ========== SELLERS CANCELLED ORDERS ============
export const useGetCancelledOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["cancelled"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/orders/?status=cancelled", token);
    },
  });

  return {
    cancelledOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};

// ========== REJECT ORDER MUTATION ============
export const useRejectOrder = (orderId: any) => {
  const queryClient = useQueryClient()
  const rejectOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${orderId}/reject`, data, token)
    },
    onSuccess: () => {
      // Invalidate all order queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["new-orders"] })
      queryClient.invalidateQueries({ queryKey: ["processing"] })
      queryClient.invalidateQueries({ queryKey: ["out-for-delivery"] })
      queryClient.invalidateQueries({ queryKey: ["completed"] })
      queryClient.invalidateQueries({ queryKey: ["cancelled"] })
      
      // Refetch specific queries
      queryClient.refetchQueries({ queryKey: ["new-orders"] })
      queryClient.refetchQueries({ queryKey: ["cancelled"] })
    },
    onError: (error) => {
      console.error("Error rejecting order:", error)
      console.log("API:", `/order/${orderId}/reject`)
    }
  })
  return rejectOrder
}

// ========== MARK ORDER AS OUT FOR DELIVERY ============
export const useMarkOrderOutForDelivery = (orderId: any) => {
  const queryClient = useQueryClient()
  const markOutForDelivery = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${orderId}/out-for-delivery`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processing"] })
      queryClient.invalidateQueries({ queryKey: ["out-for-delivery"] })
      
      queryClient.refetchQueries({ queryKey: ["processing"] })
      queryClient.refetchQueries({ queryKey: ["out-for-delivery"] })
    },
    onError: (error) => {
      console.error("Error marking order as out for delivery:", error)
      console.log("API:", `/order/${orderId}/out-for-delivery`)
    }
  })
  return markOutForDelivery
}

// ========== MARK ORDER AS COMPLETED ============
export const useMarkOrderCompleted = (orderId: any) => {
  const queryClient = useQueryClient()
  const markCompleted = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/order/${orderId}/complete`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["out-for-delivery"] })
      queryClient.invalidateQueries({ queryKey: ["completed"] })
      
      queryClient.refetchQueries({ queryKey: ["out-for-delivery"] })
      queryClient.refetchQueries({ queryKey: ["completed"] })
    },
    onError: (error) => {
      console.error("Error marking order as completed:", error)
      console.log("API:", `/order/${orderId}/complete`)
    }
  })
  return markCompleted
}


// =========== USERS ORDER ============
export const useGetUserOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["order"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/order/user/", token);
    },
  });

  return {
    newUserOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};




// ============= SEND ORDER TOKEN ============
export const useSendToken = () => {
  const queryClient = useQueryClient()

  const sendToken = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/fcm-token/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["token"] })
    },
  })

  return sendToken
}




// ================== TRACK ORDER ===================


export const useTrackOrders = (orderId: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["order"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/order/${orderId}/track-order`, token);
    },
  });

  return {
    newTrackOrder: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// https://api.movbay.com/order/<str:pk>/track-order


// getting the order history for the buyer

// https://api.movbay.com/orders/?status=new
