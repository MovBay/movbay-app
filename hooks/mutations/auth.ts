
import { useQuery, useMutation } from "@tanstack/react-query";
import { post_requests } from "../helpers/axios_helpers";
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
      const token = (await AsyncStorage.getItem("easyretail_token")) || "";
      return post_requests("/logout", {}, token);
    },
  });

  return logoutMutation;
};