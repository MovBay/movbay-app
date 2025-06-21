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
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>
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

  // Add item to cart with real-time updates
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

      // Update both AsyncStorage and local state simultaneously
      await saveCartToStorage(updatedCart)
      setCartItems(updatedCart)
      
      console.log('Item added to cart successfully:', item.title)
    } catch (error) {
      console.error('Error adding item to cart:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Remove item from cart with real-time updates
  const removeFromCart = useCallback(async (itemId: string) => {
    setIsUpdating(true)
    try {
      const currentCart = await getCartFromStorage()
      const updatedCart = currentCart.filter((item) => item.id !== itemId)
      
      await saveCartToStorage(updatedCart)
      setCartItems(updatedCart)
      
      console.log('Item removed from cart successfully')
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Update quantity with real-time updates
  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setIsUpdating(true)
    try {
      const currentCart = await getCartFromStorage()
      const updatedCart = currentCart.map((item) => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
      
      await saveCartToStorage(updatedCart)
      setCartItems(updatedCart)
      
      console.log('Quantity updated successfully')
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Clear entire cart with real-time updates
  const clearCart = useCallback(async () => {
    setIsUpdating(true)
    try {
      await saveCartToStorage([])
      setCartItems([])
      
      console.log('Cart cleared successfully')
    } catch (error) {
      console.error('Error clearing cart:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Check if item is in cart
  const isItemInCart = useCallback((itemId: string): boolean => {
    return cartItems.some((item) => item.id === itemId)
  }, [cartItems])

  // Get item quantity in cart
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
