import { createContext, useContext, useReducer, useState, useEffect } from 'react'
import api from '../api/api'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return action.payload   // { items: [], total: 0 }

    case 'CLEAR_CART':
      return { items: [], total: 0 }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 })
  const [isCartOpen, setIsCartOpen] = useState(false)

  const setCart = (data) => dispatch({ type: 'SET_CART', payload: data })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  // 初始化時加載購物車數據
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data } = await api.get('/api/cart')
        if (data.success) {
          setCart(data.data)
        }
      } catch (err) {
        console.error('Failed to load cart', err)
      }
    }
    fetchCart()
  }, [])

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

