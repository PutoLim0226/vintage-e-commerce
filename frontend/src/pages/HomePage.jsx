import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/api'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
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
  }, [])

  return (
    <div className="main-content">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__text">
            <span className="hero__eyebrow">復古服飾零售</span>
            <h1 className="hero__title">
              復古刻痕
              <em>Vintage Aesthetics</em>
            </h1>
            <p className="hero__desc">
              在現代的浪潮中尋找時間的遺痕。每一件復古單品都蘊含著獨一無二的故事與手感刻痕，等待與你重逢。
            </p>
            <div className="hero__cta">
              <Link to="/products" className="btn btn--primary btn--lg">
                探索全部單品
              </Link>
              <a href="#featured" className="btn btn--outline btn--lg">
                精選推薦
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
          <span>向下滾動</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section className="home-categories">
        <div className="container">
          <h2 className="section-title">依<span>分類</span>瀏覽</h2>
          <p className="section-subtitle">精心挑選的復古服飾分類，尋找適合你獨特風格的系列單品</p>
          
          <div className="home-categories__grid">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <div key={i} className="home-categories__card" style={{ background: '#261c12' }} />
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
                      <span>探索系列</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products Section ── */}
      <section id="featured" className="home-featured">
        <div className="container">
          <h2 className="section-title">最新<span>到貨</span>推薦</h2>
          <p className="section-subtitle">本季剛發掘的珍貴經典，限量到貨，每件僅此一個或少數庫存</p>

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
                      <div className="product-card__actions">
                        <Link to={`/products/${prod.slug}`} className="btn btn--primary">
                          查看規格
                        </Link>
                      </div>
                    </div>
                    <div className="product-card__info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="product-card__category">{prod.category_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-cream-faint)' }}>
                          <span style={{ color: 'var(--color-gold)' }}>★ {parseFloat(prod.rating || 5).toFixed(1)}</span>
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

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/products" className="btn btn--outline btn--lg">
              瀏覽所有商品
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
            <h2 className="section-title" style={{ textAlign: 'left' }}>復古的<span>精神</span></h2>
            <p className="section-subtitle" style={{ textAlign: 'left', marginInline: 0, marginBottom: '24px' }}>
              「復古不是過時的重複，而是對過去手工藝與黃金年代的無聲敬意。」
            </p>
            <p style={{ color: 'var(--color-cream-muted)', marginBottom: '16px' }}>
              我們奔走於世界各地的古著倉庫、二手市集，發掘數十年前的單品。它們身上帶有年代感的洗滌刻痕、五金氧化的光澤以及昔日裁縫師精心剪裁的針腳。
            </p>
            <p style={{ color: 'var(--color-cream-muted)' }}>
              我們提供的不僅是服飾，更是一種抗拒快時尚污染、崇尚永續與經典慢生活的生活態度。
            </p>
            
            <div className="home-story__stats">
              <div className="home-story__stat">
                <strong>100%</strong>
                <span>古著精選</span>
              </div>
              <div className="home-story__stat">
                <strong>24h</strong>
                <span>快速出貨</span>
              </div>
              <div className="home-story__stat">
                <strong>7+</strong>
                <span>天安心退換</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
