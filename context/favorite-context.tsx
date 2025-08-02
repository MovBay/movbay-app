import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface FavoriteItem {
  id: string
  title: string
  original_price: number
  discounted_price: number
  description: string
  product_images: any[]
  dateAdded: string
}

interface FavoritesContextType {
  favoriteItems: FavoriteItem[]
  favoritesLength: number
  isLoading: boolean
  isUpdating: boolean
  addToFavorites: (item: Omit<FavoriteItem, 'dateAdded'>) => Promise<void>
  removeFromFavorites: (itemId: string) => Promise<void>
  clearFavorites: () => Promise<void>
  loadFavorites: () => Promise<void>
  isItemInFavorites: (itemId: string) => boolean
  toggleFavorite: (item: Omit<FavoriteItem, 'dateAdded'>) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

interface FavoritesProviderProps {
  children: ReactNode
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Function to get favorites from AsyncStorage
  const getFavoritesFromStorage = async (): Promise<FavoriteItem[]> => {
    try {
      const favoritesData = await AsyncStorage.getItem('favorites')
      return favoritesData ? JSON.parse(favoritesData) : []
    } catch (error) {
      console.error('Error getting favorites from AsyncStorage:', error)
      return []
    }
  }

  // Function to save favorites to AsyncStorage
  const saveFavoritesToStorage = async (favoritesData: FavoriteItem[]) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesData))
    } catch (error) {
      console.error('Error saving favorites to AsyncStorage:', error)
    }
  }

  // Load favorites data
  const loadFavorites = useCallback(async () => {
    setIsLoading(true)
    try {
      const favorites = await getFavoritesFromStorage()
      setFavoriteItems(favorites)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add item to favorites
  const addToFavorites = useCallback(async (item: Omit<FavoriteItem, 'dateAdded'>) => {
    setIsUpdating(true)
    try {
      const existingFavorites = await getFavoritesFromStorage()
      const existingItemIndex = existingFavorites.findIndex((favItem) => favItem.id === item.id)

      if (existingItemIndex >= 0) {
        // Item already in favorites, don't add again
        console.log('Item already in favorites')
        return
      }

      // New item, add to favorites
      const newFavoriteItem: FavoriteItem = {
        ...item,
        dateAdded: new Date().toISOString(),
      }
      const updatedFavorites = [...existingFavorites, newFavoriteItem]

      // Update local state immediately for instant UI feedback
      setFavoriteItems(updatedFavorites)
      
      // Save to AsyncStorage in background
      await saveFavoritesToStorage(updatedFavorites)
      
      console.log('Item added to favorites successfully:', item.title)
    } catch (error) {
      console.error('Error adding item to favorites:', error)
      // Revert on error
      loadFavorites()
    } finally {
      setIsUpdating(false)
    }
  }, [loadFavorites])

  // Remove item from favorites
  const removeFromFavorites = useCallback(async (itemId: string) => {
    setIsUpdating(true)
    
    // Store current state for potential rollback
    const currentFavoriteItems = favoriteItems
    
    try {
      // Update UI immediately
      const updatedFavorites = favoriteItems.filter((item) => item.id !== itemId)
      setFavoriteItems(updatedFavorites)
      
      // Save to AsyncStorage in background
      await saveFavoritesToStorage(updatedFavorites)
      
      console.log('Item removed from favorites successfully')
    } catch (error) {
      console.error('Error removing item from favorites:', error)
      // Revert on error
      setFavoriteItems(currentFavoriteItems)
    } finally {
      setIsUpdating(false)
    }
  }, [favoriteItems])

  const isItemInFavorites = useCallback((itemId: string): boolean => {
    return favoriteItems.some((item) => item.id === itemId)
  }, [favoriteItems])

  // Toggle favorite (add if not in favorites, remove if already in favorites)
  const toggleFavorite = useCallback(async (item: Omit<FavoriteItem, 'dateAdded'>) => {
    if (isItemInFavorites(item.id)) {
      await removeFromFavorites(item.id)
    } else {
      await addToFavorites(item)
    }
  }, [isItemInFavorites, removeFromFavorites, addToFavorites])

  // Clear entire favorites
  const clearFavorites = useCallback(async () => {
    setIsUpdating(true)
    const currentFavoriteItems = favoriteItems
    
    try {
      setFavoriteItems([])
      await saveFavoritesToStorage([])
      
      console.log('Favorites cleared successfully')
    } catch (error) {
      console.error('Error clearing favorites:', error)
      setFavoriteItems(currentFavoriteItems)
    } finally {
      setIsUpdating(false)
    }
  }, [favoriteItems])

  // Load favorites on provider initialization
  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const value: FavoritesContextType = {
    favoriteItems,
    favoritesLength: favoriteItems.length,
    isLoading,
    isUpdating,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    loadFavorites,
    isItemInFavorites,
    toggleFavorite,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}