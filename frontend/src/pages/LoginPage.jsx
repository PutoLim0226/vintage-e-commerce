import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 登入後重導向至原頁面或首頁
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      if (data.success) {
        login(data.data)
        navigate(from, { replace: true })
      } else {
        setError(data.message || '登入失敗，請檢查輸入資訊')
      }
    } catch (err) {
      setError(err.response?.data?.message || '伺服器連線失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="checkout__form-section" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "var(--heading)", fontSize: 'var(--font-size-2xl)' }}>
          會員<span>登入</span>
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--color-cream-muted)', marginBottom: '24px', fontSize: '14px' }}>
          歡迎回到復古刻痕，請輸入您的會員帳密
        </p>

        {error && (
          <div className="checkout__field--error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(224,84,84,0.1)', border: '1px solid rgba(224,84,84,0.3)', borderRadius: '8px' }}>
            <span className="error-msg" style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field" style={{ marginBottom: '18px' }}>
            <label htmlFor="email">電子信箱 Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="example@vintage.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="checkout__field" style={{ marginBottom: '24px' }}>
            <label htmlFor="password">密碼 Password</label>
            <input
              id="password"
              type="password"
              required
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
            style={{ marginBottom: '20px' }}
          >
            {loading ? '登入中...' : '安全登入'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-cream-muted)' }}>
          還沒有帳號嗎？{' '}
          <Link to="/register" className="btn--text" style={{ padding: 0, textDecoration: 'none' }}>
            立即註冊
          </Link>
        </div>
      </div>
    </div>
  )
}
