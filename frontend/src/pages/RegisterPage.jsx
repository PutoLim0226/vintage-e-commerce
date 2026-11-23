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
        setServerError('Email already exists')
      } else {
        setServerError(err.response?.data?.message || t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="checkout" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="checkout__form-section" style={{ width: '100%', maxWidth: '440px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "var(--heading)", fontSize: 'var(--font-size-2xl)', color: 'var(--color-success)', marginBottom: '16px' }}>
            🎉 {t('common.success')}！
          </h3>
          <p style={{ color: 'var(--color-cream-muted)' }}>
            {t('auth.register_desc')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="checkout__form-section" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "var(--heading)", fontSize: 'var(--font-size-2xl)' }}>
          {t('auth.register_title')}
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--color-cream-muted)', marginBottom: '24px', fontSize: '14px' }}>
          {t('auth.register_desc')}
        </p>

        {serverError && (
          <div className="checkout__field--error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(224,84,84,0.1)', border: '1px solid rgba(224,84,84,0.3)', borderRadius: '8px' }}>
            <span className="error-msg" style={{ fontSize: '14px' }}>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field" style={{ marginBottom: '16px' }}>
            <label htmlFor="name">{t('checkout.name')}</label>
            <input
              id="name"
              type="text"
              placeholder={t('checkout.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {errors.name && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.name}</span>}
          </div>

          <div className="checkout__field" style={{ marginBottom: '16px' }}>
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              placeholder="example@vintage.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {errors.email && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.email}</span>}
          </div>

          <div className="checkout__field" style={{ marginBottom: '16px' }}>
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {errors.password && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.password}</span>}
          </div>

          <div className="checkout__field" style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.confirm_password')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
            style={{ marginBottom: '20px' }}
          >
            {loading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-cream-muted)' }}>
          {t('auth.has_account')}{' '}
          <Link to="/login" className="btn--text" style={{ padding: 0, textDecoration: 'none' }}>
            {t('auth.go_login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
