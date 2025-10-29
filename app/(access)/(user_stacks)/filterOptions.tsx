import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SolidMainButton } from '@/components/btns/CustomButtoms';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/mutations/auth';
import LoadingOverlay from '@/components/LoadingOverlay';
import { OnboardArrowTextHeader } from '@/components/btns/OnboardHeader';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);

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
        setSelectedConditions(parsedFilters.selectedConditions || []);
        setSelectedBrands(parsedFilters.selectedBrands || []);
        setSelectedStates(parsedFilters.selectedStates || []);
        setSelectedCategories(parsedFilters.selectedCategories || []);
        setMinPrice(parsedFilters.minPrice || '5,000');
        setMaxPrice(parsedFilters.maxPrice || '50,000');
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const saveFilters = async () => {
    setIsSaving(true);
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
      Alert.alert('Error', 'Failed to save filters. Please try again.');
      return null;
    } finally {
      setIsSaving(false);
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

  const formatPrice = (value: string): string => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    const formatted = formatPrice(value);
    setter(formatted);
  };

  const validateAndApplyFilters = (): boolean => {
    // Validate price range
    const min = parseFloat(minPrice.replace(/,/g, '')) || 0;
    const max = parseFloat(maxPrice.replace(/,/g, '')) || 0;

    if (min > max) {
      Alert.alert('Invalid Price Range', 'Minimum price cannot be greater than maximum price.');
      return false;
    }

    if (min < 0 || max < 0) {
      Alert.alert('Invalid Price', 'Price values cannot be negative.');
      return false;
    }

    return true;
  };

  const resetFilters = async () => {
    setIsSaving(true);
    try {
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
      await AsyncStorage.removeItem(FILTER_STORAGE_KEY);
      Alert.alert('Success', 'Filters have been reset.');
    } catch (error) {
      console.error('Error clearing filters:', error);
      Alert.alert('Error', 'Failed to reset filters.');
    } finally {
      setIsSaving(false);
    }
  };

const handleApplyFilter = async () => {
  if (!validateAndApplyFilters()) {
    return;
  }

  const savedSettings = await saveFilters();
  if (savedSettings) {
    console.log('Filters applied and saved:', savedSettings);
    
    // Count active filters
    const activeCount = 
      (savedSettings.filters.sellersNearMe ? 1 : 0) +
      (savedSettings.filters.verifiedSellersOnly ? 1 : 0) +
      (savedSettings.filters.pickupOnly ? 1 : 0) +
      (savedSettings.filters.deliveryOnly ? 1 : 0) +
      (savedSettings.filters.stateLocationOnly ? 1 : 0) +
      savedSettings.selectedConditions.length +
      savedSettings.selectedBrands.length +
      savedSettings.selectedStates.length +
      savedSettings.selectedCategories.length;

    Alert.alert(
      'Filters Applied', 
      `${activeCount} filter(s) have been applied successfully.`,
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  }
};

  const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onToggle }) => (
    <TouchableOpacity
      onPress={onToggle}
      className={`w-12 h-7 rounded-full p-1 ${value ? 'bg-orange-500' : 'bg-gray-300'}`}
      activeOpacity={0.7}
    >
      <View
        className={`w-5 h-5 bg-white rounded-full ${
          value ? 'ml-auto' : 'ml-0'
        }`}
      />
    </TouchableOpacity>
  );

  const CheckBox: React.FC<CheckBoxProps> = ({ checked, onPress }) => (
    <TouchableOpacity onPress={onPress} className="w-6 h-6 mr-3" activeOpacity={0.7}>
      <View className={`w-6 h-6 rounded border-2 ${checked ? 'bg-orange-500 border-orange-500' : 'border-gray-300'} items-center justify-center`}>
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );

  if (isLoadingFilters) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text style={{ fontFamily: "HankenGrotesk_400Regular" }}>Loading filters...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <StatusBar style="dark" />
      
      {/* Loading Overlay */}
      <LoadingOverlay visible={isSaving} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-5 border-b border-gray-100">
        <OnboardArrowTextHeader onPressBtn={() => router.back()} />
        
        <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-lg font-semibold">Filter</Text>

        <TouchableOpacity onPress={resetFilters} className='bg-orange-50 p-2 rounded-full px-4'>
          <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-orange-500 font-medium">Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Toggle Options */}
        <View className="py-4">
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Sellers near me</Text>
            <ToggleSwitch
              value={filters.sellersNearMe}
              onToggle={() => toggleFilter('sellersNearMe')}
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Verified sellers only</Text>
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
            className="flex-row items-center bg-gray-100  px-3 rounded mb-2 justify-between py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Condition</Text>
              {selectedConditions.length > 0 && (
                <View className="ml-2 bg-orange-500 rounded-full px-1">
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-[10px] text-white">
                    {selectedConditions.length}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={conditionExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {conditionExpanded && (
            <View className="pl-2 pb-2">
              {conditions.map(condition => (
                <TouchableOpacity
                  key={condition}
                  onPress={() => toggleCondition(condition)}
                  className="flex-row items-center py-2"
                  activeOpacity={0.7}
                >
                  <CheckBox
                    checked={selectedConditions.includes(condition)}
                    onPress={() => toggleCondition(condition)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base">{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Other Toggle Options */}
        <View className="border-t border-gray-100 pt-4">
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Pickup only</Text>
            <ToggleSwitch
              value={filters.pickupOnly}
              onToggle={() => toggleFilter('pickupOnly')}
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Delivery only</Text>
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
            className="flex-row items-center justify-between py-3 bg-gray-100  px-3 rounded mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Brand</Text>
              {selectedBrands.length > 0 && (
                <View className="ml-2 bg-orange-500 rounded-full px-1">
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-white">
                    {selectedBrands.length}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={brandExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {brandExpanded && (
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled className="pl-2 pb-2">
              {brands.map(brand => (
                <TouchableOpacity
                  key={brand}
                  onPress={() => toggleBrand(brand)}
                  className="flex-row items-center py-2"
                  activeOpacity={0.7}
                >
                  <CheckBox
                    checked={selectedBrands.includes(brand)}
                    onPress={() => toggleBrand(brand)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base">{brand}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Price Range */}
        <View className="border-t border-gray-100 pt-4 mb-3">
          <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium mb-3">Price Range</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-sm text-gray-600 mb-1">Min</Text>
              <TextInput
                value={`₦ ${minPrice}`}
                onChangeText={(text) => handlePriceChange(text.replace('₦ ', ''), setMinPrice)}
                className="bg-gray-50 p-3 rounded-lg text-base"
                keyboardType="numeric"
                style={{fontFamily: 'HankenGrotesk_400Regular'}}
                placeholder="₦ 0"
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-sm text-gray-600 mb-1">Max</Text>
              <TextInput
                value={`₦ ${maxPrice}`}
                onChangeText={(text) => handlePriceChange(text.replace('₦ ', ''), setMaxPrice)}
                className="bg-gray-50 p-3 rounded-lg text-base"
                keyboardType="numeric"
                style={{fontFamily: 'HankenGrotesk_400Regular'}}
                placeholder="₦ 0"
              />
            </View>
          </View>
        </View>

        {/* State location only */}
        <View className="border-t border-gray-100 pt-4">
          <TouchableOpacity
            onPress={() => setStateExpanded(!stateExpanded)}
            className="flex-row items-center justify-between py-3 bg-gray-100  px-3 rounded mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">State location</Text>
              {selectedStates.length > 0 && (
                <View className="ml-2 bg-orange-500 rounded-full px-1">
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-white">
                    {selectedStates.length}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={stateExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {stateExpanded && (
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled className="pl-2 pb-2">
              {states.map(state => (
                <TouchableOpacity
                  key={state}
                  onPress={() => toggleState(state)}
                  className="flex-row items-center py-2"
                  activeOpacity={0.7}
                >
                  <CheckBox
                    checked={selectedStates.includes(state)}
                    onPress={() => toggleState(state)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base">{state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Store category */}
        <View className="border-t border-gray-100 pt-4 mb-6">
          <TouchableOpacity
            onPress={() => setCategoryExpanded(!categoryExpanded)}
            className="flex-row items-center justify-between py-3 bg-gray-100  px-3 rounded mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base font-medium">Store category</Text>
              {selectedCategories.length > 0 && (
                <View className="ml-2 bg-orange-500 rounded-full px-1">
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-xs text-white">
                    {selectedCategories.length}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={categoryExpanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {categoryExpanded && (
            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled className="pl-2 pb-2">
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  className="flex-row items-center py-2"
                  activeOpacity={0.7}
                >
                  <CheckBox
                    checked={selectedCategories.includes(category)}
                    onPress={() => toggleCategory(category)}
                  />
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular" }} className="text-base">{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Apply Filter Button */}
      <View className="px-4 pb-6 pt-4 bg-white border-t border-gray-100">
        <SolidMainButton onPress={handleApplyFilter} text={'Apply Filter'}/>
      </View>
    </SafeAreaView>
  );
};

export default FilterOptions;