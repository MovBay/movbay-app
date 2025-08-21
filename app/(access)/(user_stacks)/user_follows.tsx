import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetFollowedStores, useGetFollowers } from '@/hooks/mutations/sellerAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const UserFollows = () => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  
  // Get followed stores data from API
  const { getFollowedStores, isLoading } = useGetFollowedStores();
  const followedStoresData = getFollowedStores?.data || [];

  const {getFollowers, isLoading: isFollowersLoading} = useGetFollowers()
  const followersData = getFollowers?.data || [];
  console.log('Followers data:', followersData);
  console.log('Followed stores data:', followedStoresData);

  // Empty state component for followers
  const EmptyFollowersComponent = () => (
    <View className="flex-1 items-center pt-20 w-[90%] mx-auto">
      <View className="bg-gray-100 rounded-full p-5 mb-4">
        <MaterialIcons name="people" size={35} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
        No Followers Yet
      </Text>
      <Text className="text-sm text-gray-500 text-center px-10" style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
        When people follow your store, they'll appear here
      </Text>
    </View>
  );

  // Empty state component for following
  const EmptyFollowingComponent = () => (
    <View className="flex-1 items-center pt-20 w-[90%] mx-auto">
      <View className="bg-gray-100 rounded-full p-5 mb-4">
        <MaterialIcons name="person-add" size={35} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
        You Are Not Following Anyone Yet
      </Text>
      <Text className="text-sm text-gray-500 text-center px-10" style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
        Discover and follow stores to see their latest products and updates
      </Text>
    </View>
  );

  // Loading component
  const LoadingComponent = () => (
    <View className="flex-1 items-center pt-28">
      <ActivityIndicator size="large" color="#F75F15" />
      <Text className="text-sm text-gray-500 mt-3" style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
        Loading...
      </Text>
    </View>
  );

  // Render followed store item
  const renderFollowedStoreItem = (item: any, index: number) => (
    <View key={`followed-store-${item.followed_store.id}`} className="flex-row items-center py-4 border-b border-gray-100">
      <View className="w-14 h-14 rounded-full mr-3 overflow-hidden bg-gray-200">
        <Image 
          source={{ uri: item?.followed_store?.store_image }} 
          className="w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 mb-0.5" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {item?.followed_store?.name}
        </Text>
        <Text className="text-xs text-gray-500" style={{ fontFamily: 'HankenGrotesk_400Regular' }}>
          Followed on {new Date(item.followed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
      <View className="items-end">
        <TouchableOpacity
          className="bg-[#FEEEE6] px-4 py-2 rounded-full"
          onPress={() => router.push(`/(access)/(user_stacks)/viewSellerStore?storeId=${item.followed_store.id}`)}
        >
          <Text className="text-orange-700 text-sm font-medium" style={{ fontFamily: 'HankenGrotesk_500Medium' }}>
            View Store
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Get content based on active tab
  const getTabContent = () => {
    if (isLoading) {
      return <LoadingComponent />;
    }

    if (activeTab === 'followers') {
      if( followersData.length === 0) {
        return <EmptyFollowersComponent />;
      }

      return (
        <View className="flex-1">
          {followersData.map((item:any, index:any) => renderFollowedStoreItem(item, index))}
        </View>
      )
    } else {
      // Following tab
      if (followedStoresData.length === 0) {
        return <EmptyFollowingComponent />;
      }
      
      return (
        <View className="flex-1">
          {followedStoresData.map((item:any, index:any) => renderFollowedStoreItem(item, index))}
        </View>
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white pt-3">
      <StatusBar style="dark"/>
      
      {/* Header */}
      <View className='px-4'>
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        <View className="flex-row items-center">
            
          {/* Tabs */}
          <View className="flex-row flex-1 py-5">
            <TouchableOpacity
              className={`px-5 py-2 mx-2 rounded-full ${
                activeTab === 'followers' ? 'bg-[#FEEEE6]' : ''
              }`}
              onPress={() => setActiveTab('followers')}
            >
              <Text
                className={`text-base font-medium ${
                  activeTab === 'followers' ? 'text-orange-700' : 'text-neutral-600'
                }`} 
                style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}
              >
                Followers
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-5 py-2 mx-2 rounded-full ${
                activeTab === 'following' ? 'bg-[#FEEEE6]' : ''
              }`}
              onPress={() => setActiveTab('following')}
            >
              <Text
                className={`text-base font-medium ${
                  activeTab === 'following' ? 'text-orange-700' : 'text-neutral-600'
                }`} 
                style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}
              >
                Following ({followedStoresData.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <KeyboardAwareScrollView 
        className="flex-1 px-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {getTabContent()}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default UserFollows;