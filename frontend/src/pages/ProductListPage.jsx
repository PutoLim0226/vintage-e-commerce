import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/api'

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '')

  // 取得參數
  const currentCategory = searchParams.get('category') || ''
  const currentSort     = searchParams.get('sort') || 'newest'
  const currentPage     = parseInt(searchParams.get('page') || '1', 10)

  useEffect(() => {
    // 載入分類清單
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/api/categories')
        if (data.success) setCategories(data.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    // 載入商品
    const loadProducts = async () => {
      setLoading(true)
      try {
        const params = {
          page: currentPage,
          limit: 12,
          sort: currentSort,
        }
        if (currentCategory) params.category = currentCategory
        const search = searchParams.get('search')
        if (search) params.search = search

        const { data } = await api.get('/api/products', { params })
        if (data.success) {
          setProducts(data.data.products)
          setPagination(data.data.pagination)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [searchParams, currentPage, currentCategory, currentSort])

  const handleCategorySelect = (slug) => {
    const nextParams = new URLSearchParams(searchParams)
    if (slug) {
      nextParams.set('category', slug)
    } else {
      nextParams.delete('category')
    }
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleSortChange = (sortType) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('sort', sortType)
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handlePageChange = (page) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', page.toString())
    setSearchParams(nextParams)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    if (searchVal.trim()) {
      nextParams.set('search', searchVal)
    } else {
      nextParams.delete('search')
    }
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  return (
    <main className="container section" style={{ minHeight: '90dvh' }}>
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">首頁</Link></span>
        <span className="breadcrumb__item">所有單品</span>
      </div>

      <div className="layout-sidebar">
        {/* ── Sidebar Filter ── */}
        <aside className="checkout__form-section" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            商品分類
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <li>
              <button
                className={`btn--text ${!currentCategory ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
                style={{
                  color: !currentCategory ? 'var(--color-gold)' : 'var(--color-cream-muted)',
                  fontWeight: !currentCategory ? 'bold' : 'normal',
                  textAlign: 'left',
                }}
              >
                全部商品
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  className={`btn--text ${currentCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                  style={{
                    color: currentCategory === cat.slug ? 'var(--color-gold)' : 'var(--color-cream-muted)',
                    fontWeight: currentCategory === cat.slug ? 'bold' : 'normal',
                    textAlign: 'left',
                  }}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>

          <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            排序方式
          </h3>
          <div className="checkout__field">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{ padding: '8px 12px', width: '100%' }}
            >
              <option value="newest">最新上架</option>
              <option value="price_asc">價格：由低到高</option>
              <option value="price_desc">價格：由高到低</option>
            </select>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div>
          {/* Search Header */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div className="checkout__field" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="搜尋經典復古服飾、單品..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{ padding: '10px 16px' }}
              />
            </div>
            <button type="submit" className="btn btn--primary" style={{ padding: '0 24px' }}>
              搜尋
            </button>
          </form>

          {loading ? (
            <div className="product-grid">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="product-card product-card--skeleton">
                  <div className="product-card__image-wrap" />
                  <div className="product-card__info">
                    <div className="product-card__category" />
                    <div className="product-card__name" />
                    <div className="product-card__price-row" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-cream-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', color: 'var(--color-cream-faint)' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <h3>沒有找到符合的商品</h3>
              <p>請嘗試其他搜尋關鍵字或分類</p>
            </div>
          ) : (
            <>
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
                      <div className="product-card__overlay" />
                      <div className="product-card__actions">
                        <Link to={`/products/${prod.slug}`} className="btn btn--primary">
                          查看規格
                        </Link>
                      </div>
                    </div>
                    <div className="product-card__info">
                      <span className="product-card__category">{prod.category_name}</span>
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

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination__btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &lt;
                  </button>
                  {Array(pagination.total_pages).fill(0).map((_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        className={`pagination__btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    className="pagination__btn"
                    disabled={currentPage === pagination.total_pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
