import { LOGIN } from "../endpoints";
import { instance } from "../instance";

export const loginApi = (payload:any) => instance.post(LOGIN, payload);
