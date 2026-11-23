import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function WishlistPage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/api/wishlist')
        if (data.success) {
          setProducts(data.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [user, navigate, language])

  const handleRemove = async (productId) => {
    try {
      const { data } = await api.post('/api/wishlist/toggle', { product_id: productId })
      if (data.success) {
        setProducts(products.filter(p => p.id !== productId))
        setMessage(t('wishlist.removed_msg'))
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="container section wishlist-page">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('wishlist.title')}</span>
      </div>

      <div className="admin-page-header">
        <div>
          <h2 className="page-title">❤️ {t('wishlist.title')}</h2>
        </div>
      </div>

      {message && (
        <div className="wishlist-page__toast">
          {message}
        </div>
      )}

      {loading ? (
        <div className="product-grid">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton">
              <div className="product-card__image-wrap" />
              <div className="product-card__info" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="wishlist-page__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <h3>{t('wishlist.empty_title')}</h3>
          <p className="wishlist-page__empty-desc">{t('wishlist.empty_desc')}</p>
          <Link to="/products" className="btn btn--primary">{t('wishlist.explore_btn')}</Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((prod) => (
            <div key={prod.id} className="product-card">
              <div className="product-card__image-wrap">
                <Link to={`/products/${prod.slug}`}>
                  <img
                    src={prod.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=400&q=80'}
                    alt={prod.name}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(prod.id)}
                  className="wishlist-page__remove-btn"
                  aria-label={t('wishlist.remove_label')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
              <div className="product-card__info">
                <span className="product-card__category">{prod.category_name}</span>
                <h3 className="product-card__name">
                  <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                </h3>
                <div className="product-card__price-row wishlist-page__price-row">
                  <span className="price">NT$ {Math.round(prod.base_price)}</span>
                  <Link to={`/products/${prod.slug}`} className="btn btn--sm btn--primary wishlist-page__view-btn">
                    {t('wishlist.view_spec')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
