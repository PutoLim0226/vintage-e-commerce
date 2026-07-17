import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
  const { user, logout } = useAuth()
  const { cart, setIsCartOpen } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  // 計算購物車內所有品項的數量加總
  const cartItemCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="header">
        <div className="header__inner">
          {/* Logo */}
          <Link to="/" className="header__logo">
            復古<span>刻痕</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="header__nav">
            <NavLink to="/" className={({ isActive }) => `header__nav-link ${isActive ? 'active' : ''}`}>
              首頁
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `header__nav-link ${isActive ? 'active' : ''}`}>
              所有單品
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="header__actions">
            {/* Search (Desktop only) */}
            <div className="header__search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="搜尋經典..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/products?search=${e.target.value}`)
                  }
                }}
              />
            </div>

            {/* Cart Icon Button */}
            <button
              type="button"
              className="header__icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="開啟購物車"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {cartItemCount > 0 && <span className="header__cart-badge">{cartItemCount}</span>}
            </button>

            {/* Member Profile/Login */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/profile" className="btn--text" style={{ fontSize: '14px', color: 'var(--color-cream)' }}>
                  {user.name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn--sm btn--ghost"
                  style={{ padding: '6px 12px' }}
                >
                  登出
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn--sm btn--outline">
                登入
              </Link>
            )}

            {/* Mobile Hamburger */}
            <div
              className={`header__hamburger ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
            首頁
          </Link>
          <Link to="/products" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
            所有單品
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
                會員中心 ({user.name})
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="mobile-menu__link"
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                登出
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
              登入會員
            </Link>
          )}
        </div>
      )}
    </>
  )
}
