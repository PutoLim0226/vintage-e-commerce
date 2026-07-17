import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()
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
        setMsg({ type: 'success', text: '基本資料已成功更新' })
        setProfile(prev => ({ ...prev, name, phone }))
        // 同步更新 localStorage 中的使用者名稱
        const localUser = JSON.parse(localStorage.getItem('user') || '{}')
        localUser.name = name
        localStorage.setItem('user', JSON.stringify(localUser))
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || '更新失敗，請稍後再試' })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container section" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-cream-muted)' }}>載入會員帳戶資料中...</p>
      </div>
    )
  }

  return (
    <main className="container section" style={{ minHeight: '80dvh' }}>
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">首頁</Link></span>
        <span className="breadcrumb__item">會員中心</span>
      </div>

      <div className="layout-sidebar">
        {/* Sidebar Nav */}
        <aside className="checkout__form-section" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            會員功能
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>
              <Link to="/profile" className="btn--text active" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>
                修改個人資料
              </Link>
            </li>
            <li>
              <Link to="/profile/orders" className="btn--text">
                歷史訂單記錄
              </Link>
            </li>
          </ul>
        </aside>

        {/* Main Content Form */}
        <div className="checkout__form-section">
          <h3>個人基本資料</h3>

          {msg.text && (
            <div style={{
              padding: '12px',
              background: msg.type === 'success' ? 'rgba(76,175,114,0.1)' : 'rgba(224,84,84,0.1)',
              border: msg.type === 'success' ? '1px solid rgba(76,175,114,0.3)' : '1px solid rgba(224,84,84,0.3)',
              borderRadius: '8px',
              color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {msg.text}
            </div>
          )}

          {/* Readonly stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px', padding: '16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <div>
              <span style={{ color: 'var(--color-cream-faint)', fontSize: '14px' }}>會員等級</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-gold)', marginTop: '4px', textTransform: 'uppercase' }}>
                {profile?.level || 'BRONZE'}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-cream-faint)', fontSize: '14px' }}>紅利點數</span>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-gold)', marginTop: '4px' }}>
                {profile?.points || 0} P
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="checkout__field" style={{ marginBottom: '18px' }}>
              <label>登入帳號 (Email)</label>
              <input
                type="text"
                readOnly
                value={profile?.email || ''}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div className="checkout__field" style={{ marginBottom: '18px' }}>
              <label htmlFor="name">真實姓名 Name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updating}
              />
            </div>

            <div className="checkout__field" style={{ marginBottom: '28px' }}>
              <label htmlFor="phone">聯絡手機 Phone</label>
              <input
                id="phone"
                type="text"
                placeholder="請輸入手機號碼"
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
              {updating ? '正在更新...' : '儲存變更'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
