import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTER_STORAGE_KEY = '@marketplace_filters';

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

// Default filter settings
const defaultFilters: FilterSettings = {
  filters: {
    sellersNearMe: false,
    verifiedSellersOnly: false,
    pickupOnly: false,
    deliveryOnly: false,
    stateLocationOnly: false,
  },
  selectedConditions: [],
  selectedBrands: [],
  selectedStates: [],
  selectedCategories: [],
  minPrice: '5,000',
  maxPrice: '50,000',
};

export const useFilters = () => {
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Load filters on mount
  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const savedFilters = await AsyncStorage.getItem(FILTER_STORAGE_KEY);
      if (savedFilters) {
        setFilterSettings(JSON.parse(savedFilters));
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFilters = useCallback(async () => {
    await loadFilters();
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    const { filters, selectedConditions, selectedBrands, selectedStates, selectedCategories } = filterSettings;
    
    return (
      filters.sellersNearMe ||
      filters.verifiedSellersOnly ||
      filters.pickupOnly ||
      filters.deliveryOnly ||
      filters.stateLocationOnly ||
      selectedConditions.length > 0 ||
      selectedBrands.length > 0 ||
      selectedStates.length > 0 ||
      selectedCategories.length > 0 ||
      filterSettings.minPrice !== '5,000' ||
      filterSettings.maxPrice !== '50,000'
    );
  }, [filterSettings]);

  // Filter data based on current filter settings
  const applyFilters = useCallback((data: any[]) => {
    let filteredData = [...data];

    // Apply condition filter
    if (filterSettings.selectedConditions.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedConditions.includes(item.condition)
      );
    }

    // Apply brand filter
    if (filterSettings.selectedBrands.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedBrands.includes(item.brand)
      );
    }

    // Apply state filter
    if (filterSettings.selectedStates.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedStates.includes(item.state)
      );
    }

    // Apply category filter
    if (filterSettings.selectedCategories.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedCategories.includes(item.category)
      );
    }

    // Apply price filter
    const minPrice = parseFloat(filterSettings.minPrice.replace(/,/g, ''));
    const maxPrice = parseFloat(filterSettings.maxPrice.replace(/,/g, ''));
    
    filteredData = filteredData.filter(item => {
      const itemPrice = parseFloat(item.price?.toString().replace(/,/g, '') || '0');
      return itemPrice >= minPrice && itemPrice <= maxPrice;
    });

    // Apply verified sellers filter
    if (filterSettings.filters.verifiedSellersOnly) {
      filteredData = filteredData.filter(item => item.seller?.isVerified === true);
    }

    // Apply pickup only filter
    if (filterSettings.filters.pickupOnly) {
      filteredData = filteredData.filter(item => item.pickupAvailable === true);
    }

    // Apply delivery only filter
    if (filterSettings.filters.deliveryOnly) {
      filteredData = filteredData.filter(item => item.deliveryAvailable === true);
    }

    // Apply sellers near me filter (you'll need to implement location logic)
    if (filterSettings.filters.sellersNearMe) {
      // Add your location-based filtering logic here
      // This might involve calculating distance between user and seller locations
    }

    return filteredData;
  }, [filterSettings]);

  return {
    filterSettings,
    isLoading,
    hasActiveFilters: hasActiveFilters(),
    applyFilters,
    refreshFilters,
  };
};

// Export for use in other components
export { FILTER_STORAGE_KEY };