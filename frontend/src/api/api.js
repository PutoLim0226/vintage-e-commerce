import axios from 'axios'

// 開發：Vite proxy 轉發 /api/* → http://127.0.0.1:8000
// 正式：VITE_API_URL 環境變數。如果在 github.io 且未設置環境變數，fallback 至本地的 http://localhost:8000 進行測試
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('github.io') ? 'http://localhost:8000' : '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: 自動注入 JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 購物車訪客 Token 機制
    const cartToken = localStorage.getItem('cart_token')
    if (cartToken) {
      config.headers['X-Cart-Token'] = cartToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: 401 自動刷新 Token 機制 (Token Rotation)
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 排除登入/註冊 API，避免無效循環
    if (originalRequest.url.includes('/api/auth/login') || originalRequest.url.includes('/api/auth/register')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        // 沒有 refresh token，清空並引導登出
        window.dispatchEvent(new Event('auth_session_expired'))
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        })

        if (data.success && data.data.access_token) {
          const newAccess = data.data.access_token
          const newRefresh = data.data.refresh_token

          localStorage.setItem('access_token', newAccess)
          localStorage.setItem('refresh_token', newRefresh)

          // 廣播給全域 Context 更新狀態
          window.dispatchEvent(
            new CustomEvent('auth_token_refreshed', {
              detail: { accessToken: newAccess, refreshToken: newRefresh },
            })
          )

          processQueue(null, newAccess)
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        // 刷新失敗，清空憑證並強迫登出
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth_session_expired'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
