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

