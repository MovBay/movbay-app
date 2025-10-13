import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { delete_requests, get_requests, post_request_with_image, post_requests, put_request_with_image } from "../helpers/axios_helpers";
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


export const useGetOpenStore = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["openStore", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/view-store/${id}/`, token);
    },
    enabled: !!id,
  });

  return {
    openStore: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// ================== CREATE STORE ==================
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

// ================ UPDATE STORE================
export const useUpdateStore = (id: any) => {
  const queryClient = useQueryClient()

  const updateStore = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return put_request_with_image(`/stores/${id}/`, data, token)
    },
    onSuccess: () => {
      // Refetch profile data after successful update
      queryClient.invalidateQueries({ queryKey: ["store-profile"] })
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })

  return updateStore
}


// https://api.movbay.com/stores/<int:pk/


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

export const useUpdateUserProduct = (id: any) => {
  const queryClient = useQueryClient()

  const updateUserProduct = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return put_request_with_image(`/userproduct/${id}`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-product"] })
    },
  })

  return updateUserProduct
}


export const useDeleteProduct = (id: any) => {
  const queryClient = useQueryClient()
  
  const deleteProduct = useMutation({
    mutationFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      // Use DELETE method instead of POST
      return post_requests(`/userproduct/${id}`, {}, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-product"] })
    },
  })
  
  return deleteProduct
}



// ============== ALL PRODUCTS ==================

// export const useGetProducts = () => {
//   const { data, isLoading, isError, isFetched, refetch } = useQuery({
//     queryKey: ["product"],
//     queryFn: async () => {
//       const token = (await AsyncStorage.getItem("movebay_token")) || "";
//       return get_requests("/products/", token);
//     },
//   });

//   return {
//     productData: data,
//     isLoading,
//     isError,
//     isFetched,
//     refetch,
//   };
// };



export const useGetProducts = () => {
  const {
    data,
    isLoading,
    isError,
    isFetched,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ["products"],
    queryFn: async ({ pageParam = 1 }) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      const response = await get_requests(`/products/?page=${pageParam}`, token);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // Extract page number from next URL
      if (lastPage?.next) {
        try {
          const url = new URL(lastPage.next);
          const page = url.searchParams.get('page');
          return page ? parseInt(page) : undefined;
        } catch (error) {
          console.error('Error parsing next page URL:', error);
          return undefined;
        }
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Flatten all pages into a single array
  const allProducts = data?.pages?.flatMap(page => page?.results || []) || [];
  
  // Get total count from first page
  const totalCount = data?.pages?.[0]?.count || 0;

  return {
    productData: {
      data: {
        results: allProducts,
        count: totalCount,
      }
    },
    isLoading,
    isError,
    isFetched,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    // Additional helper properties
    totalProducts: allProducts.length,
    totalCount,
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
  };
};

// If you also want to keep the original useGetProducts for backward compatibility
export const useGetProductsOriginal = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["products-original"],
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




// ====================================




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


export const useGetSingleRelatedProduct = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["userRelated", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/products/more-from-seller/${id}`, token);
    },
    enabled: !!id,
  });

  return {
    userRelatedProductData: data,
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



export const useWalletWithdrawal = () => {
  const queryClient = useQueryClient()
  const WalletWithdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests("/wallet/withdrawal/", data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    },
  });

  return WalletWithdrawalMutation;
};


export const useGetTransaction = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["transaction"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/wallet/transactions/", token);
    },
  });

  return {
    transactionData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};




export const usePayForParcel = (id:any) => {
  const queryClient = useQueryClient()

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/logistics/payment-delivery/${id}/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] })
    },
  })

  return createOrder
}





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
      return post_requests(`/order/${orderId}/mark-for-delivery`, data, token)
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

// =========== USERS ORDER ============
export const useGetUserCompleteOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["userOrdersComplete"], // Changed from ["order"] to ["userOrders"]
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/order/user/?complete=true", token);
    },
  });

  return {
    completedUserOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



// =========== USERS ORDER ============
export const useGetUserOngoingOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["userOrdersOngoin"], // Changed from ["order"] to ["userOrders"]
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/order/user/?complete=false", token);
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



// ================ PARCEL DELIVERY ================
export const useGetUserOngoingParcelOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["userParcelOrdersOngoin"], // Changed from ["order"] to ["userOrders"]
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/user-delivery-history/?completed=False", token);
    },
  });

  return {
    newUserOngoinParcelOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



export const useGetUserCompletedParcelOrders = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["userParcelOrdersCompleted"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/logistics/user-delivery-history/?completed=True", token);
    },
  });

  return {
    newUserCompletedParcelOrdersData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


// ================== TRACK ORDER ===================
export const useTrackOrders = (orderId: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["trackOrder", orderId], // Changed to include orderId for uniqueness
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/order/${orderId}/track-order`, token);
    },
    enabled: !!orderId, // Only run query if orderId exists
  });

  return {
    newTrackOrder: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



// ==================== GET AND CREATE REVIEWS ========================
export const useGetSingleProductReviews = (id: any) => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["rateProduct", id],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/rate-product/${id}`, token);
    },
    enabled: !!id,
  });

  return {
    singleProductReviewData: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useReviewProduct = (id: any) => {
  const queryClient = useQueryClient()

  const reviewProduct = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/rate-product/${id}`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rateProduct"] })
    },
  })

  return reviewProduct
}


export const useFollowStore = (id: any) => {
  const queryClient = useQueryClient()
  const followStore = useMutation({
    mutationFn: async (storeId: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/follow/${storeId}/`, {}, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow"] })
      queryClient.invalidateQueries({ queryKey: ["followedStores"] })
      queryClient.invalidateQueries({ queryKey: ["store"] })

    },
    onError: (error) => {
      console.error("Follow store error:", error)
    }
  })

  return followStore
}

export const useUnFollowStore = (id: any) => {
  const queryClient = useQueryClient()

  const unFollowStore = useMutation({
    mutationFn: async (storeId: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/unfollow/${storeId}/`, {}, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow"] })
      queryClient.invalidateQueries({ queryKey: ["followedStores"] })
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
    onError: (error) => {
      console.error("Unfollow store error:", error)
    }
  })

  return unFollowStore
}


export const useGetFollowedStores = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["follow"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/following/`, token);
    },
  });

  return {
    getFollowedStores: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



export const useGetFollowers = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["follow"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests(`/followers/`, token);
    },
  });

  return {
    getFollowers: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};



// get-shipment-rate/<str:product_id>/

export const usePostShipRate = () => {
  const queryClient = useQueryClient()

  const postShipRate = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/get-shipment-rate/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipRate"] })
    },
  })

  return postShipRate
}



// users/delete-account
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/users/delete-account/`, {}, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      queryClient.invalidateQueries({ queryKey: ["store"] })
    },
  })

  return deleteAccount
}



export const usePostDeliveryTypesIds = () => {
  const queryClient = useQueryClient()

  const postDeliveryTypesIds = useMutation({
    mutationFn: async (data: any) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return post_requests(`/products/delivery-types/`, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryID"] })
    },
  })

  return postDeliveryTypesIds
}
