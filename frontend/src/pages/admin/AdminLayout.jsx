import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/admin/dashboard', label: '營收儀表板', icon: '📊' },
    { to: '/admin/orders',    label: '訂單管理',   icon: '📦' },
    { to: '/admin/products',  label: '商品與SKU',  icon: '🧥' },
    { to: '/admin/coupons',   label: '折價券管理', icon: '🎟️' },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="brand-title">復古刻痕 Admin</div>
          <span className="admin-badge">最高權限管理員</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ fontSize: '13px', color: 'var(--color-cream-faint)', marginBottom: '8px' }}>
            管理者: {user?.name || 'Admin'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/" className="back-to-store">
              ← 返回商城首頁
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn--ghost"
              style={{ fontSize: '12px', padding: '4px 8px', width: '100%', textAlign: 'center' }}
            >
              登出系統
            </button>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
