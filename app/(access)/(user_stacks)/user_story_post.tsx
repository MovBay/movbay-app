"use client"

import { View, Text, Image, Pressable } from "react-native"
import { useState } from "react"
import { OnboardArrowTextHeader } from "@/components/btns/OnboardHeader"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useCreateStory, useGetUserProducts } from "@/hooks/mutations/sellerAuth"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import AllProductsSkeleton from "@/components/AllProductSkeleton"
import { SolidInactiveButton, SolidMainButton } from "@/components/btns/CustomButtoms"
import { useToast } from "react-native-toast-notifications"
import LoadingOverlay from "@/components/LoadingOverlay"

const UserStoryPost = () => {
  const { userProductData, isLoading, refetch } = useGetUserProducts()
  const userData = userProductData?.data?.results
  const toast = useToast()
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

//   console.log("This is user product data", selectedProduct)

  const { mutate, isPending } = useCreateStory()

  const onSubmit = () => {
    if (!selectedProduct?.id) {
      toast.show("Please select a product first", { type: "danger" })
      return
    }

    try {
      mutate(selectedProduct.id, {
        onSuccess: (response: any) => {
        //   console.log("Status Post:", response)
          toast.show("Status Posted Successfully", { type: "success" })
          router.push("/(access)/(user_tabs)/home")
        },
        onError: (error: any) => {
          console.log("An Error Occurred:", error.response.data.message)

          const errorMessage = error.response.data.message
          try {
            toast.show(errorMessage, { type: "danger" })
          } catch (toastError) {
            toast.show("Failed. Please try again.", { type: "danger" })
          }
        },
      })
    } catch (error) {
    //   console.error("Story error:", error)
      toast.show("An unexpected error occurred.", { type: "danger" })
    }
  }

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product)
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-3">
      <StatusBar style="dark" />
      <LoadingOverlay visible={isPending} />

      {/* Header */}
      <View className="px-4">
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        <View className="pt-3">
          <Text className="text-2xl" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
            Products List
          </Text>
          <Text className="text-base text-neutral-500" style={{ fontFamily: "HankenGrotesk_400SemiBold" }}>
            {" "}
            Select Product to post on your status
          </Text>
        </View>
      </View>

      <View className="flex-1">
        <KeyboardAwareScrollView className="px-5 pt-3 flex-1">
          {isLoading || userProductData?.data === undefined ? (
            <AllProductsSkeleton />
          ) : (
            <>
              {userProductData?.data?.results?.length === 0 ? (
                <View className="flex-1">
                  <View className="justify-center items-center flex-1 pt-40">
                    <Image
                      source={require("../../../assets/images/save.png")}
                      style={{ width: 70, height: 70, justifyContent: "center", margin: "auto" }}
                    />
                    <Text
                      className="text-base text-center pt-2 text-gray-400"
                      style={{ fontFamily: "HankenGrotesk_400Regular" }}
                    >
                      No product posted yet
                    </Text>
                    <View className="w-[50%] pt-5">
                      <SolidMainButton
                        text="Create Products"
                        onPress={() => router.push("/(access)/(user_stacks)/product-create")}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View className="pb-20">
                  <View className="pt-5 flex-col gap-4">
                    {userProductData?.data?.results?.map((eachData: any, index: any) => (
                      <Pressable
                        key={index}
                        onPress={() => handleProductSelect(eachData)}
                        className={`border-b border-neutral-100 bg-neutral-50 flex-row items-center gap-2  p-3 rounded-lg ${
                          selectedProduct?.id === eachData?.id
                            ? "border-2 border-orange-500 bg-orange-50"
                            : "border border-gray-200"
                        }`}
                      >
                        <View className="w-16 h-16 overflow-hidden rounded-full">
                          <Image
                            source={{ uri: eachData?.product_images[0]?.image_url }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </View>
                        <View className="flex-1 p-2">
                          <Text className="text-lg" style={{ fontFamily: "HankenGrotesk_600SemiBold" }}>
                            {eachData?.title}
                          </Text>
                          <View className="flex-row gap-3 items-center">
                            <Text className="text-base" style={{ fontFamily: "HankenGrotesk_400SemiBold" }}>
                              ₦{eachData?.original_price?.toLocaleString()}
                            </Text>
                            <Text
                              className="text-sm line-through text-gray-500 italic"
                              style={{ fontFamily: "HankenGrotesk_400Regular" }}
                            >
                              ₦{eachData?.discounted_price?.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                        {selectedProduct?.id === eachData?.id && (
                          <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </KeyboardAwareScrollView>

        {/* Fixed Bottom Button */}
        {userProductData?.data?.results?.length > 0 && (
          <View className="px-5 pb-5 bg-white border-t border-gray-100">
            {selectedProduct ? 
            
                <SolidMainButton
                    text={"Post on Story"}
                    onPress={onSubmit}
                /> : 
                <SolidInactiveButton text="Post on Story"/>
            }
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default UserStoryPost
