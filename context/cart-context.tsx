import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface CartItem {
  id: string
  title: string
  price: number
  discounted_price: number
  image: string
  quantity: number
  store: any
  stock_available: number
  dateAdded: string
  isNewArrival?: boolean
}

interface CartContextType {
  cartItems: CartItem[]
  cartLength: number
  isLoading: boolean
  isUpdating: boolean
  totalAmount: number
  addToCart: (item: Omit<CartItem, 'quantity' | 'dateAdded'>) => Promise<{ success: boolean; message: string }>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, newQuantity: number) => { success: boolean; message: string }
  clearCart: () => Promise<void>
  loadCart: () => Promise<void>
  isItemInCart: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number
  isItemAtStockLimit: (itemId: string, stockAvailable: number) => boolean
  getRemainingStock: (itemId: string, stockAvailable: number) => number
  formatPrice: (price: number) => string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Function to get cart from AsyncStorage
  const getCartFromStorage = async (): Promise<CartItem[]> => {
    try {
      const cartData = await AsyncStorage.getItem('cart')
      return cartData ? JSON.parse(cartData) : []
    } catch (error) {
      console.error('Error getting cart from AsyncStorage:', error)
      return []
    }
  }

  // Function to save cart to AsyncStorage
  const saveCartToStorage = async (cartData: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartData))
    } catch (error) {
      console.error('Error saving cart to AsyncStorage:', error)
    }
  }

  // Load cart data
  const loadCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const cart = await getCartFromStorage()
      setCartItems(cart)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check if item is at stock limit
  const isItemAtStockLimit = useCallback((itemId: string, stockAvailable: number): boolean => {
    const currentQuantity = getItemQuantity(itemId)
    return currentQuantity >= stockAvailable
  }, [cartItems])

  // Get remaining stock for an item
  const getRemainingStock = useCallback((itemId: string, stockAvailable: number): number => {
    const currentQuantity = getItemQuantity(itemId)
    return Math.max(0, stockAvailable - currentQuantity)
  }, [cartItems])

  // Add item to cart with stock validation
  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity' | 'dateAdded'>): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true)
    try {
      const existingCart = await getCartFromStorage()
      const existingItemIndex = existingCart.findIndex((cartItem) => cartItem.id === item.id)
      
      let updatedCart: CartItem[]
      let currentQuantity = 0

      if (existingItemIndex >= 0) {
        currentQuantity = existingCart[existingItemIndex].quantity
        
        // Check if adding one more would exceed stock
        if (currentQuantity >= item.stock_available) {
          return {
            success: false,
            message: `Only ${item.stock_available} items available in stock`
          }
        }

        // Item already exists, increase quantity
        updatedCart = existingCart.map((cartItem, index) =>
          index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      } else {
        // Check if item is out of stock
        if (item.stock_available === 0) {
          return {
            success: false,
            message: 'This product is currently out of stock'
          }
        }

        // New item, add to cart
        const newCartItem: CartItem = {
          ...item,
          quantity: 1,
          dateAdded: new Date().toISOString(),
        }
        updatedCart = [...existingCart, newCartItem]
      }

      // Update local state immediately for instant UI feedback
      setCartItems(updatedCart)
      
      // Save to AsyncStorage in background
      await saveCartToStorage(updatedCart)
      
      console.log('Item added to cart successfully:', item.title)
      return {
        success: true,
        message: `${item.title} has been added to your cart`
      }
    } catch (error) {
      console.error('Error adding item to cart:', error)
      // Revert on error
      loadCart()
      return {
        success: false,
        message: 'Failed to add item to cart'
      }
    } finally {
      setIsUpdating(false)
    }
  }, [loadCart])

  // Remove item from cart with optimistic updates
  const removeFromCart = useCallback(async (itemId: string) => {
    setIsUpdating(true)
    
    // Store current state for potential rollback
    const currentCartItems = cartItems
    
    try {
      // Update UI immediately
      const updatedCart = cartItems.filter((item) => item.id !== itemId)
      setCartItems(updatedCart)
      
      // Save to AsyncStorage in background
      await saveCartToStorage(updatedCart)
      
      console.log('Item removed from cart successfully')
    } catch (error) {
      console.error('Error removing item:', error)
      // Revert on error
      setCartItems(currentCartItems)
    } finally {
      setIsUpdating(false)
    }
  }, [cartItems])

  // Update quantity with stock validation
  const updateQuantity = useCallback((itemId: string, newQuantity: number): { success: boolean; message: string } => {
    if (newQuantity < 1) {
      return {
        success: false,
        message: 'Quantity must be at least 1'
      }
    }

    // Find the item to get its stock limit
    const item = cartItems.find(cartItem => cartItem.id === itemId)
    if (!item) {
      return {
        success: false,
        message: 'Item not found in cart'
      }
    }

    // Check if new quantity exceeds stock
    if (newQuantity > item.stock_available) {
      return {
        success: false,
        message: `Only ${item.stock_available} items available in stock`
      }
    }

    // Update UI immediately for instant feedback
    const updatedCart = cartItems.map((cartItem) => 
      cartItem.id === itemId ? { ...cartItem, quantity: newQuantity } : cartItem
    )
    setCartItems(updatedCart)
    
    // Save to AsyncStorage in background without blocking UI
    saveCartToStorage(updatedCart).catch((error) => {
      console.error('Error saving to AsyncStorage:', error)
      // Could implement retry logic here if needed
    })
    
    console.log('Quantity updated successfully')
    return {
      success: true,
      message: 'Quantity updated successfully'
    }
  }, [cartItems])

  // Clear entire cart with optimistic updates
  const clearCart = useCallback(async () => {
    setIsUpdating(true)
    const currentCartItems = cartItems
    
    try {
      setCartItems([])
      await saveCartToStorage([])
      
      console.log('Cart cleared successfully')
    } catch (error) {
      console.error('Error clearing cart:', error)
      setCartItems(currentCartItems)
    } finally {
      setIsUpdating(false)
    }
  }, [cartItems])

  const isItemInCart = useCallback((itemId: string): boolean => {
    return cartItems.some((item) => item.id === itemId)
  }, [cartItems])

  const getItemQuantity = useCallback((itemId: string): number => {
    const item = cartItems.find((item) => item.id === itemId)
    return item ? item.quantity : 0
  }, [cartItems])

  // Calculate total amount
  const totalAmount = cartItems.reduce((total, item) => {
    const price = item.discounted_price || item.price
    return total + price * item.quantity
  }, 0)

  // Format price
  const formatPrice = useCallback((price: number) => {
    return `₦${price.toLocaleString()}`
  }, [])

  // Load cart on provider initialization
  useEffect(() => {
    loadCart()
  }, [loadCart])

  const value: CartContextType = {
    cartItems,
    cartLength: cartItems.length,
    isLoading,
    isUpdating,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    isItemInCart,
    getItemQuantity,
    isItemAtStockLimit,
    getRemainingStock,
    formatPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}