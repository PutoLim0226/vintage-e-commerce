import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'

export default function ProductListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '')

  // 複合篩選 State
  const [filterMetadata, setFilterMetadata] = useState({ colors: [], sizes: [], min_price: 0, max_price: 5000 })
  const [selectedColors, setSelectedColors] = useState(searchParams.get('colors') ? searchParams.get('colors').split(',') : [])
  const [selectedSizes, setSelectedSizes] = useState(searchParams.get('sizes') ? searchParams.get('sizes').split(',') : [])
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')

  // 願望清單 State
  const [wishlistIds, setWishlistIds] = useState([])

  // Header 導航過來時同步搜尋框文字與篩選欄
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '')
    setSelectedColors(searchParams.get('colors') ? searchParams.get('colors').split(',') : [])
    setSelectedSizes(searchParams.get('sizes') ? searchParams.get('sizes').split(',') : [])
    setMinPrice(searchParams.get('min_price') || '')
    setMaxPrice(searchParams.get('max_price') || '')
  }, [searchParams])

  // 取得參數
  const currentCategory = searchParams.get('category') || ''
  const currentSort     = searchParams.get('sort') || 'newest'
  const currentPage     = parseInt(searchParams.get('page') || '1', 10)

  useEffect(() => {
    // 載入分類清單與篩選元數據
    const loadInitData = async () => {
      try {
        const [catRes, metaRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/products/filter-metadata')
        ])
        if (catRes.data.success) setCategories(catRes.data.data)
        if (metaRes.data.success) setFilterMetadata(metaRes.data.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadInitData()
  }, [])

  // 載入會員願望清單
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

        // 帶入複合篩選參數
        const colorsParam = searchParams.get('colors')
        if (colorsParam) params.colors = colorsParam

        const sizesParam = searchParams.get('sizes')
        if (sizesParam) params.sizes = sizesParam

        const minPriceParam = searchParams.get('min_price')
        if (minPriceParam) params.min_price = minPriceParam

        const maxPriceParam = searchParams.get('max_price')
        if (maxPriceParam) params.max_price = maxPriceParam

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

  const applyFilters = (newColors, newSizes, newMin, newMax) => {
    const nextParams = new URLSearchParams(searchParams)
    
    if (newColors && newColors.length > 0) nextParams.set('colors', newColors.join(','))
    else nextParams.delete('colors')

    if (newSizes && newSizes.length > 0) nextParams.set('sizes', newSizes.join(','))
    else nextParams.delete('sizes')

    if (newMin !== undefined && newMin !== '') nextParams.set('min_price', newMin)
    else nextParams.delete('min_price')

    if (newMax !== undefined && newMax !== '') nextParams.set('max_price', newMax)
    else nextParams.delete('max_price')

    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleColorToggle = (color) => {
    const next = selectedColors.includes(color) 
      ? selectedColors.filter(c => c !== color) 
      : [...selectedColors, color]
    setSelectedColors(next)
    applyFilters(next, selectedSizes, minPrice, maxPrice)
  }

  const handleSizeToggle = (size) => {
    const next = selectedSizes.includes(size) 
      ? selectedSizes.filter(s => s !== size) 
      : [...selectedSizes, size]
    setSelectedSizes(next)
    applyFilters(selectedColors, next, minPrice, maxPrice)
  }

  const handlePriceApply = (e) => {
    e.preventDefault()
    applyFilters(selectedColors, selectedSizes, minPrice, maxPrice)
  }

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

  const clearAllFilters = () => {
    const nextParams = new URLSearchParams()
    const search = searchParams.get('search')
    if (search) nextParams.set('search', search)
    const cat = searchParams.get('category')
    if (cat) nextParams.set('category', cat)
    const sort = searchParams.get('sort')
    if (sort) nextParams.set('sort', sort)
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
                  borderLeft: !currentCategory ? '3px solid var(--color-gold)' : '3px solid transparent',
                  paddingLeft: !currentCategory ? '10px' : '4px',
                  transition: 'all 0.2s'
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
                    borderLeft: currentCategory === cat.slug ? '3px solid var(--color-gold)' : '3px solid transparent',
                    paddingLeft: currentCategory === cat.slug ? '10px' : '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.name}
                </button>
                {cat.children && cat.children.length > 0 && (
                  <ul style={{ paddingLeft: '14px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cat.children.map(sub => (
                      <li key={sub.id}>
                        <button
                          className={`btn--text ${currentCategory === sub.slug ? 'active' : ''}`}
                          onClick={() => handleCategorySelect(sub.slug)}
                          style={{
                            color: currentCategory === sub.slug ? 'var(--color-gold)' : 'var(--color-cream-faint)',
                            fontSize: '13px',
                            fontWeight: currentCategory === sub.slug ? 'bold' : 'normal',
                            textAlign: 'left',
                            borderLeft: currentCategory === sub.slug ? '3px solid var(--color-gold)' : '3px solid transparent',
                            paddingLeft: currentCategory === sub.slug ? '10px' : '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          └ {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
          {/* 複合篩選：價格區間 */}
          <h3 style={{ fontSize: '18px', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            價格區間
          </h3>
          <form onSubmit={handlePriceApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="最低"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ padding: '8px', width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-cream)', borderRadius: '4px' }}
              />
              <span style={{ color: 'var(--color-cream-faint)' }}>~</span>
              <input
                type="number"
                placeholder="最高"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ padding: '8px', width: '100%', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-cream)', borderRadius: '4px' }}
              />
            </div>
            <button type="submit" className="btn btn--sm btn--outline" style={{ width: '100%' }}>
              套用價格
            </button>
          </form>

          {/* 複合篩選：顏色 */}
          {filterMetadata.colors?.length > 0 && (
            <>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                顏色篩選
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {filterMetadata.colors.map(color => {
                  const isActive = selectedColors.includes(color)
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorToggle(color)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: isActive ? 'var(--color-gold)' : 'var(--color-bg-card)',
                        border: '1px solid ' + (isActive ? 'var(--color-gold)' : 'var(--color-border)'),
                        color: isActive ? 'var(--color-bg-dark)' : 'var(--color-cream)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isActive ? '0 2px 8px rgba(200, 169, 110, 0.4)' : 'none'
                      }}
                    >
                      {isActive && <span style={{ fontWeight: 'bold' }}>✓</span>}
                      {color}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 複合篩選：尺寸 */}
          {filterMetadata.sizes?.length > 0 && (
            <>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                尺寸篩選
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {filterMetadata.sizes.map(size => {
                  const isActive = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: isActive ? 'var(--color-gold)' : 'var(--color-bg-card)',
                        border: '1px solid ' + (isActive ? 'var(--color-gold)' : 'var(--color-border)'),
                        color: isActive ? 'var(--color-bg-dark)' : 'var(--color-cream)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isActive ? '0 2px 8px rgba(200, 169, 110, 0.4)' : 'none'
                      }}
                    >
                      {isActive && <span style={{ fontWeight: 'bold' }}>✓</span>}
                      {size}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 清除全部篩選 */}
          {(selectedColors.length > 0 || selectedSizes.length > 0 || minPrice || maxPrice) && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn--sm btn--ghost"
              style={{ width: '100%', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' }}
            >
              清除所有篩選
            </button>
          )}
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
                {products.map((prod) => {
                  const isSoldOut = parseInt(prod.total_stock || 0) === 0
                  return (
                    <div key={prod.id} className="product-card">
                      <div className="product-card__image-wrap">
                        <Link to={`/products/${prod.slug}`}>
                          <img
                            src={prod.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=400&q=80'}
                            alt={prod.name}
                            style={isSoldOut ? { filter: 'grayscale(1)' } : {}}
                          />
                        </Link>
                        {isSoldOut && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(18, 13, 7, 0.65)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5
                          }}>
                            <span style={{
                              border: '2px solid var(--color-gold)', color: 'var(--color-gold)',
                              padding: '6px 16px', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.15em',
                              background: 'var(--color-bg)'
                            }}>
                              SOLD OUT
                            </span>
                          </div>
                        )}
                        <div className="product-card__overlay" />
                        <button
                          type="button"
                          className={`product-card__wishlist ${wishlistIds.includes(prod.id) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault()
                            toggleWishlist(prod.id)
                          }}
                          aria-label="加入收藏"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlistIds.includes(prod.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        </button>
                        <div className="product-card__actions">
                          <Link to={`/products/${prod.slug}`} className="btn btn--primary">
                            {isSoldOut ? '查看補貨狀態' : '查看規格'}
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
                )
                })}
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
