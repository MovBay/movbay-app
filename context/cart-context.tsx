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
  addToCart: (item: Omit<CartItem, 'quantity' | 'dateAdded'>) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, newQuantity: number) => void
  clearCart: () => Promise<void>
  loadCart: () => Promise<void>
  isItemInCart: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number
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

  // Add item to cart with optimistic updates
  const addToCart = useCallback(async (item: Omit<CartItem, 'quantity' | 'dateAdded'>) => {
    setIsUpdating(true)
    try {
      const existingCart = await getCartFromStorage()
      const existingItemIndex = existingCart.findIndex((cartItem) => cartItem.id === item.id)

      let updatedCart: CartItem[]

      if (existingItemIndex >= 0) {
        // Item already exists, increase quantity
        updatedCart = existingCart.map((cartItem, index) =>
          index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      } else {
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
    } catch (error) {
      console.error('Error adding item to cart:', error)
      // Revert on error
      loadCart()
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

  // Update quantity with immediate UI updates - THIS IS THE KEY FIX
  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    // Update UI immediately for instant feedback
    const updatedCart = cartItems.map((item) => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedCart)
    
    // Save to AsyncStorage in background without blocking UI
    saveCartToStorage(updatedCart).catch((error) => {
      console.error('Error saving to AsyncStorage:', error)
      // Could implement retry logic here if needed
    })
    
    console.log('Quantity updated successfully')
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