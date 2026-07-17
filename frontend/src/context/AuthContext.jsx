import { createContext, useContext, useReducer } from 'react'

const AuthContext = createContext(null)

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('access_token') || null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('access_token', action.payload.accessToken)
      localStorage.setItem('refresh_token', action.payload.refreshToken)
      return { user: action.payload.user, accessToken: action.payload.accessToken }

    case 'LOGOUT':
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return { user: null, accessToken: null }

    case 'UPDATE_TOKEN':
      localStorage.setItem('access_token', action.payload.accessToken)
      localStorage.setItem('refresh_token', action.payload.refreshToken)
      return { ...state, accessToken: action.payload.accessToken }

    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = (data) => dispatch({
    type: 'LOGIN',
    payload: { user: data.user, accessToken: data.access_token, refreshToken: data.refresh_token },
  })

  const logout = () => dispatch({ type: 'LOGOUT' })

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
