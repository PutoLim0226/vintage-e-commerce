import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../context/LanguageContext'
import LanguageSelector from './LanguageSelector'

export default function Header() {
  const { user, logout } = useAuth()
  const { cart, setIsCartOpen } = useCart()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // 路由變化時，同步 URL search param 到 Header 搜尋框
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '')
  }, [searchParams])

  // 計算購物車內所有品項的數量加總
  const cartItemCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const [connError, setConnError] = useState(false)

  useEffect(() => {
    const handleConnErr = () => setConnError(true)
    window.addEventListener('api_connection_error', handleConnErr)
    return () => window.removeEventListener('api_connection_error', handleConnErr)
  }, [])

  return (
    <>
      {connError && (
        <div className="header-alert">
          <span>{t('header.api_error_hint')}</span>
          <button type="button" onClick={() => setConnError(false)} className="header-alert__close">✕</button>
        </div>
      )}
      <header className="header">
        <div className="header__inner">
          {/* Logo */}
          <Link to="/" className="header__logo">
            {t('header.brand_prefix')}<span>{t('header.brand_suffix')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="header__nav">
            <NavLink to="/" className={({ isActive }) => `header__nav-link ${isActive ? 'active' : ''}`}>
              {t('header.home')}
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `header__nav-link ${isActive ? 'active' : ''}`}>
              {t('header.products')}
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
                placeholder={t('header.search_placeholder')}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/products?search=${encodeURIComponent(searchVal.trim())}`)
                  }
                  if (e.key === 'Escape') {
                    setSearchVal('')
                    navigate('/products')
                  }
                }}
                aria-label={t('header.search_aria')}
              />
              {searchVal && (
                <button
                  type="button"
                  aria-label={t('header.clear_search')}
                  onClick={() => { setSearchVal(''); navigate('/products') }}
                  className="header__search-clear"
                >
                  ×
                </button>
              )}
            </div>

            {/* Wishlist Icon Link */}
            {user && (
              <Link
                to="/wishlist"
                className="header__icon-btn header__icon-btn--wishlist"
                aria-label={t('header.wishlist')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </Link>
            )}

            {/* Cart Icon Button */}
            <button
              type="button"
              className="header__icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={t('header.cart')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {cartItemCount > 0 && <span className="header__cart-badge">{cartItemCount}</span>}
            </button>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Member Profile/Login */}
            <div className="header__member-desktop">
              {user ? (
                <div className="header__member-group">
                  <Link to="/profile" className="btn--text header__member-name">
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn--sm btn--ghost header__logout-btn"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn btn--sm btn--outline">
                  {t('header.login')}
                </Link>
              )}
            </div>

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
            {t('header.home')}
          </Link>
          <Link to="/products" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
            {t('header.products')}
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
                {t('header.profile')} ({user.name})
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="mobile-menu__link mobile-menu__btn-logout"
              >
                {t('header.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-menu__link" onClick={() => setIsMobileMenuOpen(false)}>
              {t('header.login')}
            </Link>
          )}

          {/* Mobile Language Switcher */}
          <LanguageSelector variant="mobile" />
        </div>
      )}
    </>
  )
}
