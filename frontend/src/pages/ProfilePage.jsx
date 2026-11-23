import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'

export default function ProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/api/me')
        if (data.success) {
          setProfile(data.data)
          setName(data.data.name || '')
          setPhone(data.data.phone || '')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setMsg({ type: '', text: '' })

    try {
      const { data } = await api.patch('/api/me', { name, phone })
      if (data.success) {
        setMsg({ type: 'success', text: t('profile.update_success') })
        setProfile(prev => ({ ...prev, name, phone }))
        // 同步更新 localStorage 中的使用者名稱
        const localUser = JSON.parse(localStorage.getItem('user') || '{}')
        localUser.name = name
        localStorage.setItem('user', JSON.stringify(localUser))
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || t('profile.update_failed') })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container section profile-page__loading">
        <p>{t('profile.loading')}</p>
      </div>
    )
  }

  return (
    <main className="container section profile-page">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('orders.member_center')}</span>
      </div>

      <div className="layout-sidebar">
        {/* Sidebar Nav */}
        <aside className="orders-page__sidebar">
          <h3 className="orders-page__sidebar-title">
            {t('orders.member_features')}
          </h3>
          <ul className="orders-page__sidebar-list">
            <li>
              <Link to="/profile" className="btn--text active">
                {t('orders.nav_profile')}
              </Link>
            </li>
            <li>
              <Link to="/profile/orders" className="btn--text">
                {t('orders.nav_orders')}
              </Link>
            </li>
          </ul>
        </aside>

        {/* Main Content Form */}
        <div className="orders-page__main">
          <h3>{t('profile.basic_info_title')}</h3>

          {msg.text && (
            <div className={`profile-page__alert ${msg.type === 'success' ? 'profile-page__alert--success' : 'profile-page__alert--error'}`}>
              {msg.text}
            </div>
          )}

          {/* Readonly stats */}
          <div className="profile-page__stats">
            <div>
              <span className="profile-page__stats-label">{t('profile.level')}</span>
              <div className="profile-page__stats-val profile-page__stats-val--uppercase">
                {profile?.level || 'BRONZE'}
              </div>
            </div>
            <div>
              <span className="profile-page__stats-label">{t('profile.points')}</span>
              <div className="profile-page__stats-val">
                {profile?.points || 0} P
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="checkout__field profile-page__field">
              <label>{t('profile.email')}</label>
              <input
                type="text"
                readOnly
                value={profile?.email || ''}
              />
            </div>

            <div className="checkout__field profile-page__field">
              <label htmlFor="name">{t('profile.real_name')}</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="checkout__field profile-page__field profile-page__field--last">
              <label htmlFor="phone">{t('profile.phone')}</label>
              <input
                id="phone"
                type="text"
                placeholder={t('profile.phone_placeholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={updating}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={updating}
            >
              {updating ? t('profile.updating') : t('profile.save_changes')}
            </button>
          </form>

          {/* LINE 帳號綁定區塊 */}
          <div className="profile-page__line-section">
            <h3 className="profile-page__line-section-title">{t('profile.line_section_title')}</h3>
            <p className="profile-page__line-section-desc">
              {t('profile.line_section_desc')}
            </p>
            {profile?.line_user_id ? (
              <div className="profile-page__line-bound-box">
                <div className="profile-page__line-badge">
                  {t('profile.line_bound')}
                </div>
                <span className="profile-page__line-bound-text">
                  {t('profile.line_bound_user', { id: profile.line_user_id })}
                </span>
              </div>
            ) : (
              <div className="profile-page__line-action-box">
                <button
                  type="button"
                  onClick={async () => {
                    const mockLineId = 'U' + Math.random().toString(36).substring(2, 10).toUpperCase()
                    const confirmBind = window.confirm(t('profile.line_mock_confirm', { id: mockLineId }))
                    if (!confirmBind) return

                    setUpdating(true)
                    try {
                      const { data } = await api.post('/api/me/line-bind', { line_user_id: mockLineId })
                      if (data.success) {
                        setMsg({ type: 'success', text: t('profile.line_bind_success') })
                        setProfile(prev => ({ ...prev, line_user_id: mockLineId }))
                      }
                    } catch (err) {
                      setMsg({ type: 'error', text: err.response?.data?.message || t('profile.line_bind_failed') })
                    } finally {
                      setUpdating(false)
                    }
                  }}
                  className="btn profile-page__line-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 5.58 2 10.02c0 2.5 1.54 4.7 4.02 6.07C5.39 17.58 4.21 19.34 4 19.66c-.16.27.06.63.36.56 1.13-.25 4.38-1.57 6.13-2.61.5.07.97.11 1.51.11 5.52 0 10-3.58 10-8.02S17.52 2 12 2zm0 14c-.45 0-.89-.03-1.32-.09-.34-.04-.69.06-.94.29-.98.88-2.66 1.83-4.14 2.29.35-.91.95-2.28 1.25-3.32.1-.33.02-.69-.22-.92C5.03 12.8 4 11.5 4 10.02 4 6.69 7.59 4 12 4s8 2.69 8 6.02-3.59 6.02-8 6.02z" />
                  </svg>
                  {t('profile.line_connect_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
