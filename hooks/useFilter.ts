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
        const parsed = JSON.parse(savedFilters);
        setFilterSettings(parsed);
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
    const { 
      filters, 
      selectedConditions, 
      selectedBrands, 
      selectedStates, 
      selectedCategories,
      minPrice,
      maxPrice 
    } = filterSettings;
    
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
      minPrice !== defaultFilters.minPrice ||
      maxPrice !== defaultFilters.maxPrice
    );
  }, [filterSettings]);

  // Apply filters to product data
  const applyFilters = useCallback((data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    let filteredData = [...data];

    // Apply condition filter
    if (filterSettings.selectedConditions.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedConditions.some(
          condition => item?.condition?.toLowerCase() === condition.toLowerCase()
        )
      );
    }

    // Apply brand filter
    if (filterSettings.selectedBrands.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedBrands.some(
          brand => item?.brand?.toLowerCase() === brand.toLowerCase()
        )
      );
    }

    // Apply state filter
    if (filterSettings.selectedStates.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedStates.some(
          state => item?.store?.state?.toLowerCase() === state.toLowerCase()
        )
      );
    }

    // Apply category filter
    if (filterSettings.selectedCategories.length > 0) {
      filteredData = filteredData.filter(item =>
        filterSettings.selectedCategories.some(
          category => item?.category?.toLowerCase() === category.toLowerCase()
        )
      );
    }

    // Apply price filter
    try {
      const minPrice = parseFloat(filterSettings.minPrice.replace(/,/g, '')) || 0;
      const maxPrice = parseFloat(filterSettings.maxPrice.replace(/,/g, '')) || Infinity;
      
      filteredData = filteredData.filter(item => {
        const itemPrice = parseFloat(
          (item?.discounted_price || item?.original_price || 0)
            .toString()
            .replace(/,/g, '')
        ) || 0;
        return itemPrice >= minPrice && itemPrice <= maxPrice;
      });
    } catch (error) {
      console.error('Error applying price filter:', error);
    }

    // Apply verified sellers filter
    if (filterSettings.filters.verifiedSellersOnly) {
      filteredData = filteredData.filter(
        item => item?.store?.is_verified === true
      );
    }

    // Apply pickup only filter
    if (filterSettings.filters.pickupOnly) {
      filteredData = filteredData.filter(
        item => item?.pickup_available === true
      );
    }

    // Apply delivery only filter
    if (filterSettings.filters.deliveryOnly) {
      filteredData = filteredData.filter(
        item => item?.delivery_available === true
      );
    }

    // Apply sellers near me filter
    // Note: This requires location data. Implement when location service is available
    if (filterSettings.filters.sellersNearMe) {
      // TODO: Implement location-based filtering
      // This would involve:
      // 1. Getting user's current location
      // 2. Calculating distance to each seller
      // 3. Filtering based on a distance threshold
      console.log('Sellers near me filter is active but requires location implementation');
    }

    // Apply state location only filter
    if (filterSettings.filters.stateLocationOnly) {
      // This filter requires the user's current state
      // For now, it will use the selectedStates if available
      if (filterSettings.selectedStates.length > 0) {
        filteredData = filteredData.filter(item =>
          filterSettings.selectedStates.some(
            state => item?.store?.state?.toLowerCase() === state.toLowerCase()
          )
        );
      }
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