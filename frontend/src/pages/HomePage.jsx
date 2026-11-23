import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function HomePage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/products?limit=4'),
        ])
        if (catRes.data.success) setCategories(catRes.data.data)
        if (prodRes.data.success) setFeaturedProducts(prodRes.data.data.products)
      } catch (err) {
        console.error('Failed to load homepage data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [language])

  useEffect(() => {
    if (!user) {
      setWishlistIds([])
      return
    }
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/api/wishlist')
        if (data.success) {
          setWishlistIds(data.data.map(p => p.id))
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchWishlist()
  }, [user])

  const toggleWishlist = async (productId) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const { data } = await api.post('/api/wishlist/toggle', { product_id: productId })
      if (data.success) {
        if (wishlistIds.includes(productId)) {
          setWishlistIds(wishlistIds.filter(id => id !== productId))
        } else {
          setWishlistIds([...wishlistIds, productId])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="main-content">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__text">
            <span className="hero__eyebrow">{t('home.eyebrow')}</span>
            <h1 className="hero__title">
              {t('home.title')}
              <em>{t('home.subtitle')}</em>
            </h1>
            <p className="hero__desc">
              {t('home.desc')}
            </p>
            <div className="hero__cta">
              <Link to="/products" className="btn btn--primary btn--lg">
                {t('home.explore_all')}
              </Link>
              <a href="#featured" className="btn btn--outline btn--lg">
                {t('home.featured_cta')}
              </a>
            </div>
          </div>
          <div className="hero__image-wrap">
            <img
              src="https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80"
              alt="Vintage clothes on a rack"
            />
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>{t('home.scroll_hint')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section className="home-categories">
        <div className="container">
          <h2 className="section-title">
            {t('home.categories_title_pre')}<span>{t('home.categories_title_mid')}</span>{t('home.categories_title_post')}
          </h2>
          <p className="section-subtitle">{t('home.categories_subtitle')}</p>
          
          <div className="home-categories__grid">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="home-categories__card home-categories__card--skeleton" />
                ))
              : categories.slice(0, 4).map((cat) => (
                  <div
                    key={cat.id}
                    className="home-categories__card"
                    onClick={() => navigate(`/products?category=${cat.slug}`)}
                  >
                    <img
                      src={cat.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80'}
                      alt={cat.name}
                    />
                    <div className="home-categories__card-text">
                      <h3>{cat.name}</h3>
                      <span>{t('home.explore_category')}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products Section ── */}
      <section id="featured" className="home-featured">
        <div className="container">
          <h2 className="section-title">
            {t('home.featured_title_pre')}<span>{t('home.featured_title_mid')}</span>{t('home.featured_title_post')}
          </h2>
          <p className="section-subtitle">{t('home.featured_subtitle')}</p>

          <div className="product-grid">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="product-card product-card--skeleton">
                    <div className="product-card__image-wrap" />
                    <div className="product-card__info">
                      <div className="product-card__category" />
                      <div className="product-card__name" />
                      <div className="product-card__price-row" />
                    </div>
                  </div>
                ))
              : featuredProducts.map((prod) => (
                  <div key={prod.id} className="product-card">
                    <div className="product-card__image-wrap">
                      <Link to={`/products/${prod.slug}`}>
                        <img
                          src={prod.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=400&q=80'}
                          alt={prod.name}
                        />
                      </Link>
                      <div className="product-card__overlay" />
                      <button
                        type="button"
                        className={`product-card__wishlist ${wishlistIds.includes(prod.id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          toggleWishlist(prod.id)
                        }}
                        aria-label={t('home.add_wishlist')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlistIds.includes(prod.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                      </button>
                      <div className="product-card__actions">
                        <Link to={`/products/${prod.slug}`} className="btn btn--primary">
                          {t('home.view_spec')}
                        </Link>
                      </div>
                    </div>
                    <div className="product-card__info">
                      <div className="product-card__info-header">
                        <span className="product-card__category">{prod.category_name}</span>
                        <div className="product-card__rating-badge">
                          <span>★ {parseFloat(prod.rating || 5).toFixed(1)}</span>
                          <span>({prod.view_count || 0})</span>
                        </div>
                      </div>
                      <h3 className="product-card__name">
                        <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                      <div className="product-card__price-row">
                        <span className="price">
                          NT$ {Math.round(prod.base_price)}
                          {prod.compare_price && (
                            <span className="price price--compare">NT$ {Math.round(prod.compare_price)}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          <div className="home-featured__actions">
            <Link to="/products" className="btn btn--outline btn--lg">
              {t('home.view_all_products')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Story Section ── */}
      <section className="home-story">
        <div className="home-story__inner">
          <div className="home-story__img">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
              alt="Vintage store interior"
            />
          </div>
          <div className="home-story__text">
            <h2 className="section-title">
              {t('home.story_title_pre')}<span>{t('home.story_title_mid')}</span>
            </h2>
            <p className="section-subtitle">
              {t('home.story_quote')}
            </p>
            <p className="home-story__desc">
              {t('home.story_p1')}
            </p>
            <p className="home-story__desc">
              {t('home.story_p2')}
            </p>
            
            <div className="home-story__stats">
              <div className="home-story__stat">
                <strong>100%</strong>
                <span>{t('home.stat_curated')}</span>
              </div>
              <div className="home-story__stat">
                <strong>24h</strong>
                <span>{t('home.stat_shipping')}</span>
              </div>
              <div className="home-story__stat">
                <strong>7+</strong>
                <span>{t('home.stat_returns')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
