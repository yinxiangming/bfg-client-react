'use client'

// React Imports
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

// Util Imports
import { storefrontApi } from '@/utils/storefrontApi'
import { getMediaUrl } from '@/utils/media'

export type CartItem = {
  id: number
  productId: number
  variantId?: number
  name: string
  brand: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  loading: boolean
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (id: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotal: () => number
  getItemCount: () => number
  getSubtotal: () => number
  getShipping: () => number
  getTotalWithShipping: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const hasFetchedRef = useRef(false)

  // Fetch cart from API on mount (only once)
  useEffect(() => {
    // Prevent duplicate calls in React strict mode
    if (hasFetchedRef.current) {
      return
    }
    hasFetchedRef.current = true

    const fetchCart = async () => {
      try {
        setLoading(true)
        const cart = await storefrontApi.getCart()
        setCartId(cart.id)

        // Transform API cart items to CartItem format
        const transformedItems: CartItem[] = (cart.items || []).map((item: any) => ({
          id: item.item_id || item.id,
          productId: item.product?.id || item.product_id,
          name: item.product_name || item.product?.name || '',
          brand: item.product?.brand || '',
          price: parseFloat(item.price || '0'),
          image: getMediaUrl(item.image_url || item.product?.primary_image || ''),
          size: item.variant_options?.size || '',
          color: item.variant_options?.color || '',
          quantity: item.quantity || 1
        }))
        setItems(transformedItems)
      } catch (err) {
        console.error('Failed to fetch cart:', err)
        // Continue with empty cart if fetch fails
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  const addItem = useCallback(async (item: Omit<CartItem, 'id'>) => {
    try {
      setLoading(true)
      
      // Prepare request data
      const requestData: { product: number; variant?: number; quantity: number } = {
        product: item.productId,
        quantity: item.quantity
      }
      
      // Include variant ID if provided
      if (item.variantId !== undefined) {
        requestData.variant = item.variantId
      }
      
      console.log('[CartContext] Adding item to cart:', requestData)
      
      const response = await storefrontApi.addCartItem(requestData)

      // Update local state with API response
      const transformedItems: CartItem[] = (response.items || []).map((apiItem: any) => ({
        id: apiItem.item_id || apiItem.id,
        productId: apiItem.product?.id || apiItem.product_id,
        name: apiItem.product_name || apiItem.product?.name || '',
        brand: apiItem.product?.brand || '',
        price: parseFloat(apiItem.price || '0'),
        image: getMediaUrl(apiItem.image_url || apiItem.product?.primary_image || ''),
        size: apiItem.variant_options?.size || item.size || '',
        color: apiItem.variant_options?.color || item.color || '',
        quantity: apiItem.quantity || 1
      }))
      setItems(transformedItems)
      setCartId(response.id)
    } catch (err: any) {
      console.error('Failed to add item to cart:', err)
      
      // Enhance error message with more details
      if (err?.status) {
        const statusMessages: Record<number, string> = {
          400: 'Invalid request. Please check the product information.',
          401: 'Please log in to add items to cart.',
          403: 'You do not have permission to add items to cart.',
          404: 'Product not found. It may have been removed.',
          500: 'Server error. Please try again later.'
        }
        
        const statusMessage = statusMessages[err.status] || `Server returned error ${err.status}`
        const enhancedError = new Error(err.message || statusMessage)
        ;(enhancedError as any).status = err.status
        ;(enhancedError as any).statusText = err.statusText
        ;(enhancedError as any).data = err.data
        ;(enhancedError as any).url = err.url
        throw enhancedError
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const removeItem = useCallback(async (id: number) => {
    try {
      setLoading(true)
      await storefrontApi.removeCartItem({ item_id: id })

      // Update local state
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to remove item from cart:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateQuantity = useCallback(
    async (id: number, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(id)
        return
      }
      try {
        setLoading(true)
        const response = await storefrontApi.updateCartItem({
          item_id: id,
          quantity
        })

        // Update local state with API response
        const transformedItems: CartItem[] = (response.items || []).map((apiItem: any) => ({
          id: apiItem.item_id || apiItem.id,
          productId: apiItem.product?.id || apiItem.product_id,
          name: apiItem.product_name || apiItem.product?.name || '',
          brand: apiItem.product?.brand || '',
          price: parseFloat(apiItem.price || '0'),
          image: getMediaUrl(apiItem.image_url || apiItem.product?.primary_image || ''),
          size: apiItem.variant_options?.size || '',
          color: apiItem.variant_options?.color || '',
          quantity: apiItem.quantity || 1
        }))
        setItems(transformedItems)
      } catch (err) {
        console.error('Failed to update item quantity:', err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [removeItem]
  )

  const clearCart = useCallback(async () => {
    try {
      setLoading(true)
      await storefrontApi.clearCart()
      setItems([])
    } catch (err) {
      console.error('Failed to clear cart:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const getShipping = useCallback(() => {
    return items.length > 0 ? 7.0 : 0
  }, [items])

  const getTotal = useCallback(() => {
    return getSubtotal() + getShipping()
  }, [getSubtotal, getShipping])

  const getTotalWithShipping = useCallback(() => {
    return getTotal()
  }, [getTotal])

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getSubtotal,
        getShipping,
        getTotalWithShipping
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
