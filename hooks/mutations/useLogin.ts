import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../services/api/loginApi";

export default function useLogin() {
  return useMutation({
    mutationFn: loginApi,
  });
}

