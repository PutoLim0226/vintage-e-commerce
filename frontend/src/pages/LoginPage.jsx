import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { t } = useTranslation()
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
        setError(data.message || t('auth.login_title'))
      }
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="checkout__form-section" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "var(--heading)", fontSize: 'var(--font-size-2xl)' }}>
          {t('auth.login_title')}
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--color-cream-muted)', marginBottom: '24px', fontSize: '14px' }}>
          {t('auth.login_desc')}
        </p>

        {error && (
          <div className="checkout__field--error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(224,84,84,0.1)', border: '1px solid rgba(224,84,84,0.3)', borderRadius: '8px' }}>
            <span className="error-msg" style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field" style={{ marginBottom: '18px' }}>
            <label htmlFor="email">{t('auth.email')}</label>
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
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              required
              placeholder={t('auth.password')}
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
            {loading ? t('common.loading') : t('auth.login_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-cream-muted)' }}>
          {t('auth.no_account')}{' '}
          <Link to="/register" className="btn--text" style={{ padding: 0, textDecoration: 'none' }}>
            {t('auth.go_register')}
          </Link>
        </div>
      </div>
    </div>
  )
}
