import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/api'

export default function RegisterPage() {
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
    if (!name.trim()) tempErrors.name = '姓名為必填項目'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) tempErrors.email = '請輸入有效的 Email'
    if (password.length < 8) tempErrors.password = '密碼長度至少需 8 個字元'
    if (password !== confirmPassword) tempErrors.confirmPassword = '密碼與確認密碼不符'
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
        setServerError(data.message || '註冊失敗，請重試')
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setServerError('此 Email 已被註冊使用')
      } else {
        setServerError(err.response?.data?.message || '伺服器連線失敗，請稍後再試')
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
            🎉 註冊成功！
          </h3>
          <p style={{ color: 'var(--color-cream-muted)' }}>
            恭喜您成為復古刻痕會員，系統即將在 2 秒內為您跳轉至登入頁面...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="checkout__form-section" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', fontFamily: "var(--heading)", fontSize: 'var(--font-size-2xl)' }}>
          會員<span>註冊</span>
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--color-cream-muted)', marginBottom: '24px', fontSize: '14px' }}>
          加入復古刻痕，開啟您的獨特穿搭美學
        </p>

        {serverError && (
          <div className="checkout__field--error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(224,84,84,0.1)', border: '1px solid rgba(224,84,84,0.3)', borderRadius: '8px' }}>
            <span className="error-msg" style={{ fontSize: '14px' }}>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout__field" style={{ marginBottom: '16px' }}>
            <label htmlFor="name">真實姓名 Name</label>
            <input
              id="name"
              type="text"
              placeholder="請輸入姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {errors.name && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.name}</span>}
          </div>

          <div className="checkout__field" style={{ marginBottom: '16px' }}>
            <label htmlFor="email">電子信箱 Email</label>
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
            <label htmlFor="password">密碼 Password</label>
            <input
              id="password"
              type="password"
              placeholder="至少 8 個字元"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {errors.password && <span className="error-msg" style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px' }}>{errors.password}</span>}
          </div>

          <div className="checkout__field" style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword">確認密碼 Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="請再次輸入密碼"
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
            {loading ? '註冊中...' : '提交註冊'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-cream-muted)' }}>
          已經有帳號了嗎？{' '}
          <Link to="/login" className="btn--text" style={{ padding: 0, textDecoration: 'none' }}>
            立即登入
          </Link>
        </div>
      </div>
    </div>
  )
}
