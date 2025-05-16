import { post_requests } from "@/util/helpers/axio_helpers";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";



// ============ LOGIN =============

export const useLogin = () => {
  const loginMutation = useMutation({
    mutationFn: (data: any) => post_requests("/login/", data),
  });

  return loginMutation;
};


// ============ LOGOUT =============
export const useLogout = () => {
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = (await AsyncStorage.getItem("movbay_token")) || "";
      return post_requests("/logout", {}, token);
    },
  });

  return logoutMutation;
};



// ============ USER REGISTRATION =============
export const useRegistration = () => {
  const registrationMutation = useMutation({
    mutationFn: (data: any) => post_requests("/register", data),
  });

  return registrationMutation;
};

