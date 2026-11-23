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
    <div className="auth-page">
      <div className="auth-page__box">
        <h3 className="auth-page__title">
          {t('auth.login_title')}
        </h3>
        <p className="auth-page__desc">
          {t('auth.login_desc')}
        </p>

        {error && (
          <div className="auth-page__error-alert">
            <span className="error-msg">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field auth-page__field">
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

          <div className="checkout__field auth-page__field auth-page__field--last">
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
            className="btn btn--primary btn--full auth-page__submit-btn"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.login_btn')}
          </button>
        </form>

        <div className="auth-page__footer-hint">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="btn--text">
            {t('auth.go_register')}
          </Link>
        </div>
      </div>
    </div>
  )
}
