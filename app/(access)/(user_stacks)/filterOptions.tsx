import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SolidMainButton } from '@/components/btns/CustomButtoms';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/mutations/auth';

// Storage key for filters
const FILTER_STORAGE_KEY = '@marketplace_filters';

// Define interfaces for better type safety
interface FiltersState {
  sellersNearMe: boolean;
  verifiedSellersOnly: boolean;
  pickupOnly: boolean;
  deliveryOnly: boolean;
  stateLocationOnly: boolean;
}

export interface FilterSettings {
  filters: FiltersState;
  selectedConditions: string[];
  selectedBrands: string[];
  selectedStates: string[];
  selectedCategories: string[];
  minPrice: string;
  maxPrice: string;
}

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

interface CheckBoxProps {
  checked: boolean;
  onPress: () => void;
}

const FilterOptions = () => {
  const [filters, setFilters] = useState<FiltersState>({
    sellersNearMe: false,
    verifiedSellersOnly: false,
    pickupOnly: false,
    deliveryOnly: false,
    stateLocationOnly: false,
  });

  const { profile, isLoading } = useProfile();
  const address = profile?.data?.address as any;

  const [conditionExpanded, setConditionExpanded] = useState<boolean>(false);
  const [brandExpanded, setBrandExpanded] = useState<boolean>(false);
  const [stateExpanded, setStateExpanded] = useState<boolean>(false);
  const [categoryExpanded, setCategoryExpanded] = useState<boolean>(false);

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [minPrice, setMinPrice] = useState<string>('5,000');
  const [maxPrice, setMaxPrice] = useState<string>('50,000');
  const [isLoadingFilters, setIsLoadingFilters] = useState<boolean>(true);

  const conditions: string[] = ['New', 'Used', 'Refurbished'];
  const brands: string[] = [
    'Apple', 'Samsung', 'Infinix', 'Tecno', 'HP', 'Nike', 'Jordan',
    'Huawei', 'Xiaomi', 'OnePlus', 'LG', 'Sony', 'Dell', 'Lenovo',
    'Asus', 'Acer', 'Microsoft', 'Google', 'Oppo', 'Vivo',
  ];
  const states: string[] = [
    'Lagos', 'Abuja', 'Rivers', 'Kano', 'Oyo', 'Delta', 'Edo',
    'Kaduna', 'Imo', 'Anambra', 'Plateau', 'Cross River', 'Bayelsa',
    'Enugu', 'Kwara', 'Ogun', 'Ondo', 'Osun', 'Ekiti', 'Akwa Ibom',
  ];
  const categories: string[] = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors',
    'Automotive', 'Books', 'Health & Beauty', 'Toys & Games',
    'Music & Movies', 'Jewelry & Accessories', 'Baby & Kids',
    'Pet Supplies', 'Office & Industrial', 'Real Estate',
  ];

  // Load saved filters on component mount
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      const savedFilters = await AsyncStorage.getItem(FILTER_STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters: FilterSettings = JSON.parse(savedFilters);
        setFilters(parsedFilters.filters);
        setSelectedConditions(parsedFilters.selectedConditions);
        setSelectedBrands(parsedFilters.selectedBrands);
        setSelectedStates(parsedFilters.selectedStates);
        setSelectedCategories(parsedFilters.selectedCategories);
        setMinPrice(parsedFilters.minPrice);
        setMaxPrice(parsedFilters.maxPrice);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const saveFilters = async () => {
    try {
      const filterSettings: FilterSettings = {
        filters,
        selectedConditions,
        selectedBrands,
        selectedStates,
        selectedCategories,
        minPrice,
        maxPrice,
      };
      await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterSettings));
      return filterSettings;
    } catch (error) {
      console.error('Error saving filters:', error);
      return null;
    }
  };

  const toggleFilter = (filterName: keyof FiltersState) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = async () => {
    setFilters({
      sellersNearMe: false,
      verifiedSellersOnly: false,
      pickupOnly: false,
      deliveryOnly: false,
      stateLocationOnly: false,
    });
    setSelectedConditions([]);
    setSelectedBrands([]);
    setSelectedStates([]);
    setSelectedCategories([]);
    setMinPrice('5,000');
    setMaxPrice('50,000');
    setConditionExpanded(false);
    setBrandExpanded(false);
    setStateExpanded(false);
    setCategoryExpanded(false);

    // Clear saved filters
    try {
      await AsyncStorage.removeItem(FILTER_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const handleApplyFilter = async () => {
    const savedSettings = await saveFilters();
    if (savedSettings) {
      console.log('Filters applied and saved:', savedSettings);
      router.back();
    }
  };

  const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onToggle }) => (
    <TouchableOpacity
      onPress={onToggle}
      className={`w-12 h-6 rounded-full p-1 ${value ? 'bg-orange-500' : 'bg-gray-300'}`}
    >
      <View
        className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${
          value ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </TouchableOpacity>
  );

  const CheckBox: React.FC<CheckBoxProps> = ({ checked, onPress }) => (
    <TouchableOpacity onPress={onPress} className="w-5 h-5 mr-3">
      <View className={`w-5 h-5 rounded border-2 ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'} items-center justify-center`}>
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );

  if (isLoadingFilters) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text style={{ fontFamily: "HankenGrotesk_500Medium" }}>Loading filters...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-5 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-lg font-semibold">Filter</Text>
        <TouchableOpacity onPress={resetFilters}>
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-orange-500 font-medium">Reset</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4">
        {/* Toggle Options */}
        <View className="py-4">
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Sellers near me</Text>
            <ToggleSwitch
              value={filters.sellersNearMe}
              onToggle={() => toggleFilter('sellersNearMe')}
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Verified sellers only</Text>
            <ToggleSwitch
              value={filters.verifiedSellersOnly}
              onToggle={() => toggleFilter('verifiedSellersOnly')}
            />
          </View>
        </View>
        {/* Condition */}
        <View className="border-t border-gray-100 pt-4">
          <TouchableOpacity
            onPress={() => setConditionExpanded(!conditionExpanded)}
            className="flex-row items-center justify-between py-3"
          >
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Condition</Text>
            <Ionicons
              name={conditionExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {conditionExpanded && (
            <View className="pl-2">
              {conditions.map(condition => (
                <TouchableOpacity
                  key={condition}
                  onPress={() => toggleCondition(condition)}
                  className="flex-row items-center py-2"
                >
                  <CheckBox
                    checked={selectedConditions.includes(condition)}
                    onPress={() => toggleCondition(condition)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base">{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {/* Other Toggle Options */}
        <View className="border-t border-gray-100 pt-4">
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Pickup only</Text>
            <ToggleSwitch
              value={filters.pickupOnly}
              onToggle={() => toggleFilter('pickupOnly')}
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Delivery only</Text>
            <ToggleSwitch
              value={filters.deliveryOnly}
              onToggle={() => toggleFilter('deliveryOnly')}
            />
          </View>
        </View>
        {/* Brand */}
        <View className="border-t border-gray-100 pt-4">
          <TouchableOpacity
            onPress={() => setBrandExpanded(!brandExpanded)}
            className="flex-row items-center justify-between py-3"
          >
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Brand</Text>
            <Ionicons
              name={brandExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {brandExpanded && (
            <View className="pl-2">
              {brands.map(brand => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => toggleBrand(brand)}
                  className="flex-row items-center py-2"
                >
                  <CheckBox
                    checked={selectedBrands.includes(brand)}
                    onPress={() => toggleBrand(brand)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base">{brand}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {/* Price Range */}
        <View className="border-t border-gray-100 pt-4">
          <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium mb-3">Price Range</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600 mb-1">Min</Text>
              <TextInput
                value={`₦ ${minPrice}`}
                onChangeText={(text) => setMinPrice(text.replace('₦ ', ''))}
                className="bg-gray-50 p-3 rounded-lg text-base"
                keyboardType="numeric"
                style={{fontFamily: 'HankenGrotesk_500Medium'}}
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-sm text-gray-600 mb-1">Max</Text>
              <TextInput
                value={`₦ ${maxPrice}`}
                onChangeText={(text) => setMaxPrice(text.replace('₦ ', ''))}
                className="bg-gray-50 p-3 rounded-lg text-base"
                keyboardType="numeric"
                style={{fontFamily: 'HankenGrotesk_500Medium'}}
              />
            </View>
          </View>
        </View>
        {/* State location only */}
        <View className="border-t border-gray-100 pt-4">
          <TouchableOpacity
            onPress={() => setStateExpanded(!stateExpanded)}
            className="flex-row items-center justify-between py-3"
          >
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">State location only</Text>
            <Ionicons
              name={stateExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {stateExpanded && (
            <View className="pl-2">
              {states.map(state => (
                <TouchableOpacity
                  key={state}
                  onPress={() => toggleState(state)}
                  className="flex-row items-center py-2"
                >
                  <CheckBox
                    checked={selectedStates.includes(state)}
                    onPress={() => toggleState(state)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base">{state}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {/* Store category */}
        <View className="border-t border-gray-100 pt-4 mb-6">
          <TouchableOpacity
            onPress={() => setCategoryExpanded(!categoryExpanded)}
            className="flex-row items-center justify-between py-3"
          >
            <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base font-medium">Store category</Text>
            <Ionicons
              name={categoryExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {categoryExpanded && (
            <View className="pl-2">
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  className="flex-row items-center py-2"
                >
                  <CheckBox
                    checked={selectedCategories.includes(category)}
                    onPress={() => toggleCategory(category)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_500Medium" }} className="text-base">{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Apply Filter Button */}
      <View className="px-4 pb-6 pt-4 bg-white border-t border-gray-100">
        <TouchableOpacity onPress={handleApplyFilter}>
          <SolidMainButton text='Apply Filter'/>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FilterOptions;