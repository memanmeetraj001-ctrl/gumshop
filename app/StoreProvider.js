'use client'
import { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import { setCart } from '../lib/features/cart/cartSlice'

export default function StoreProvider({ children }) {
  const storeRef = useRef(undefined)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && storeRef.current) {
      // 1. Rehydrate cart from localStorage
      try {
        const saved = localStorage.getItem('gumshop_cart')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.cartItems) {
            storeRef.current.dispatch(setCart(parsed))
          }
        }
      } catch (e) {}

      // 2. Persist cart to localStorage whenever it changes
      let prevCart = storeRef.current.getState().cart
      const unsubscribe = storeRef.current.subscribe(() => {
        const currentCart = storeRef.current.getState().cart
        if (currentCart !== prevCart) {
          prevCart = currentCart
          try {
            localStorage.setItem('gumshop_cart', JSON.stringify({
              total: currentCart.total,
              cartItems: currentCart.cartItems,
              cartProducts: currentCart.cartProducts
            }))
          } catch (e) {}
        }
      })

      return () => unsubscribe()
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}