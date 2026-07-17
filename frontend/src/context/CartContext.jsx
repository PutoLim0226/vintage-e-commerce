import { createContext, useContext, useReducer } from 'react'

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

  const setCart = (data) => dispatch({ type: 'SET_CART', payload: data })
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
