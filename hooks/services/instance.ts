import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"

// Make sure to use the correct environment variable name for Expo
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://api.movbay.com"

console.log("Base URL:", BASE_URL) // Add this for debugging

export const instance = axios.create({
  baseURL: BASE_URL,
  // timeout: 35000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Function to set the Authorization header (make this async)
export const setAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken")
    if (token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete instance.defaults.headers.common["Authorization"]
    }
  } catch (error) {
    console.error("Error setting auth token:", error)
  }
}

// Request interceptor to ensure token is set
instance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("accessToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error("Error getting token from AsyncStorage:", error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)
