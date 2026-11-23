import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { useEffect } from 'react'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
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
    { to: '/admin/dashboard', label: t('admin.nav_dashboard'), icon: '📊' },
    { to: '/admin/orders',    label: t('admin.nav_orders'),    icon: '📦' },
    { to: '/admin/products',  label: t('admin.nav_products'),  icon: '🧥' },
    { to: '/admin/coupons',   label: t('admin.nav_coupons'),   icon: '🎟️' },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="brand-title">{t('admin.brand')}</div>
          <span className="admin-badge">{t('admin.role_badge')}</span>
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
          <div className="admin-sidebar-user">
            {t('admin.admin_user', { name: user?.name || 'Admin' })}
          </div>
          <div className="admin-sidebar-actions">
            <a href="/" className="back-to-store">
              {t('admin.back_to_store')}
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn--ghost admin-logout-btn"
            >
              {t('admin.logout')}
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
