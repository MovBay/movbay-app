
import { useQuery, useMutation } from "@tanstack/react-query";
import { post_requests } from "../helpers/axios_helpers";

export const useLogin = () => {
  const loginMutation = useMutation({
    mutationFn: (data: any) => post_requests("/login/", data),
  });

  return loginMutation;
};
