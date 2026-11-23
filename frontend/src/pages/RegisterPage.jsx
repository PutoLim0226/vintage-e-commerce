import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  const validate = () => {
    const tempErrors = {}
    if (!name.trim()) tempErrors.name = t('checkout.name')
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) tempErrors.email = t('checkout.email')
    if (password.length < 8) tempErrors.password = t('auth.password')
    if (password !== confirmPassword) tempErrors.confirmPassword = t('auth.confirm_password')
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)

    try {
      const { data } = await api.post('/api/auth/register', { name, email, password })
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setServerError(data.message || t('common.error'))
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setServerError(t('auth.email_exists', 'Email already exists'))
      } else {
        setServerError(err.response?.data?.message || t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__box auth-page__box--success">
          <h3>
            🎉 {t('common.success')}！
          </h3>
          <p className="auth-page__desc">
            {t('auth.register_desc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page__box">
        <h3 className="auth-page__title">
          {t('auth.register_title')}
        </h3>
        <p className="auth-page__desc">
          {t('auth.register_desc')}
        </p>

        {serverError && (
          <div className="auth-page__error-alert">
            <span className="error-msg">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field auth-page__field">
            <label htmlFor="name">{t('checkout.name')}</label>
            <input
              id="name"
              type="text"
              placeholder={t('checkout.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          <div className="checkout__field auth-page__field">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              placeholder="example@vintage.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="checkout__field auth-page__field">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <div className="checkout__field auth-page__field auth-page__field--last">
            <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.confirm_password')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full auth-page__submit-btn"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        <div className="auth-page__footer-hint">
          {t('auth.has_account')}{' '}
          <Link to="/login" className="btn--text">
            {t('auth.go_login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
