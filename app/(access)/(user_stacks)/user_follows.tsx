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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Victoria Abiodun',
    username: 'vickab23',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Martha Oyebanjo',
    username: 'm_artha',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isFollowing: false,
  },
  {
    id: '3',
    name: 'Michael Ekisagha',
    username: 'mickkyek',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isFollowing: true,
  },
  {
    id: '4',
    name: 'Elizabeth Wakili',
    username: 'lizzywakili',
    avatar: 'https://i.pravatar.cc/150?img=4',
    isFollowing: false,
  },
  {
    id: '5',
    name: 'Joseph Ikiriko',
    username: 'josy',
    avatar: 'https://i.pravatar.cc/150?img=5',
    isFollowing: true,
  },
  {
    id: '6',
    name: 'Hannah Weridide',
    username: 'h_weridibe',
    avatar: 'https://i.pravatar.cc/150?img=6',
    isFollowing: false,
  },
  {
    id: '7',
    name: 'Priscilla Kemepade',
    username: 'pricy',
    avatar: 'https://i.pravatar.cc/150?img=7',
    isFollowing: true,
  },
];

const UserFollows = () => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [users, setUsers] = useState<User[]>(mockUsers);

  const handleFollowToggle = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      )
    );
  };

  const filteredUsers = activeTab === 'followers' ? users : users.filter(user => user.isFollowing);

  const renderUserItem = (user: User) => (
    <View key={user.id} className="flex-row items-center py-4 border-b border-gray-100">
      <Image source={{ uri: user.avatar }} className="w-12 h-12 rounded-full mr-3" />
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 mb-0.5" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>{user.name}</Text>
        <Text className="text-sm text-neutral-400" style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>@{user.username}</Text>
      </View>
      <TouchableOpacity
        className={`px-6 py-2 rounded-full min-w-20 items-center ${
          user.isFollowing 
            ? 'bg-[#FEEEE6]' 
            : 'bg-[#F75F15]'
        }`}
        onPress={() => handleFollowToggle(user.id)}
      >
        <Text
          className={`text-base font-semibold ${
            user.isFollowing ? 'text-orange-700' : 'text-white'
          }`} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}
        >
          {user.isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white pt-3">
      <StatusBar style="dark"/>
      
      {/* Header */}
      <View className='px-4 pt-3'>
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
                className={`text-lg font-medium ${
                    activeTab === 'followers' ? 'text-orange-700' : 'text-neutral-600'
                }`} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}
                >
                Followers
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                className={`px-5 py-2 mx-2 rounded-full ${
                activeTab === 'following' ? 'bg-orange-100' : ''
                }`}
                onPress={() => setActiveTab('following')}
            >
                <Text
                className={`text-base font-medium ${
                    activeTab === 'following' ? 'text-orange-700' : 'text-neutral-600'
                }`} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}
                >
                Following
                </Text>
            </TouchableOpacity>
            </View>
        </View>
      </View>

      {/* User List */}
      <KeyboardAwareScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredUsers.map(renderUserItem)}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default UserFollows;