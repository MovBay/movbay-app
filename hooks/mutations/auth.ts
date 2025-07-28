
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get_requests, post_requests, put_request_with_image } from "../helpers/axios_helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const useRegistration = () => {
  const registrationMutation = useMutation({
    mutationFn: (data: any) => post_requests("/users/", data),
  });

  return registrationMutation;
};


export const useLogin = () => {
  const loginMutation = useMutation({
    mutationFn: (data: any) => post_requests("/users/login/", data),
  });

  return loginMutation;
};

export const useActivate = () => {
  const activateMutation = useMutation({
    mutationFn: (data: any) => post_requests("/users/activate/", data),
  });

  return activateMutation;
};



export const useLogout = () => {
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return post_requests("/logout", {}, token);
    },
  });

  return logoutMutation;
};



export const useProfile = () => {
  const { data, isLoading, isError, isFetched, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = (await AsyncStorage.getItem("movebay_token")) || "";
      return get_requests("/users/profile/", token);
    },
  });

  return {
    profile: data,
    isLoading,
    isError,
    isFetched,
    refetch,
  };
};


export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()

  const updateProfile = useMutation({
    mutationFn: async (data: FormData) => {
      const token = (await AsyncStorage.getItem("movebay_token")) || ""
      return put_request_with_image(`/users/profile/`, data, token)
    },
    onSuccess: () => {
      // Refetch profile data after successful update
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })

  return updateProfile
}