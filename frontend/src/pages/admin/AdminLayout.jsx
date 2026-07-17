import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // 確認是 admin 角色（role === 'admin'），否則踢回首頁
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
    { to: '/admin/dashboard', label: '總覽', icon: '◈' },
    { to: '/admin/products',  label: '商品管理', icon: '◎' },
    { to: '/admin/orders',    label: '訂單管理', icon: '◷' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--color-bg-dark)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0',
        background: 'var(--color-bg-card)',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--color-gold)' }}>
            後台管理
          </span>
          <div style={{ fontSize: '12px', color: 'var(--color-cream-faint)', marginTop: '4px' }}>
            復古刻痕 Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                fontSize: '14px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-gold)' : 'var(--color-cream-muted)',
                background: isActive ? 'rgba(198,160,87,0.1)' : 'transparent',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0 24px 0', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-cream-faint)', marginBottom: '10px' }}>
            {user?.name}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px',
              color: 'var(--color-cream-muted)', fontSize: '13px', padding: '6px 14px',
              cursor: 'pointer', width: '100%', textAlign: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--color-gold)'; e.target.style.color = 'var(--color-gold)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-cream-muted)' }}
          >
            登出
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
