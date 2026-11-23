import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function ProductListPage() {
  const { user } = useAuth()
  const { t, language } = useTranslation()
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

  // 行動裝置篩選狀態
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
  }, [language])

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
  }, [searchParams, currentPage, currentCategory, currentSort, language])

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
    <main className="container section product-list-page">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('products.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('products.breadcrumb_products')}</span>
      </div>

      {/* 行動裝置專用篩選展開按鈕 */}
      <button
        type="button"
        className="btn btn--outline product-list-page__mobile-toggle"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        {showMobileFilters ? `✕ ${t('common.close')}` : `🔍 ${t('products.filter_title')}...`}
      </button>

      <div className="layout-sidebar">
        {/* ── Sidebar Filter ── */}
        <aside className={`product-filter-sidebar ${showMobileFilters ? 'expanded' : ''}`}>
          <h3 className="product-filter-sidebar__title">
            {t('products.filter_category')}
          </h3>
          <ul className="product-filter-sidebar__categories-list">
            <li>
              <button
                className={`product-filter-sidebar__category-btn ${!currentCategory ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
              >
                {t('products.filter_all_categories')}
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  className={`product-filter-sidebar__category-btn ${currentCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                >
                  {cat.name}
                </button>
                {cat.children && cat.children.length > 0 && (
                  <ul className="product-filter-sidebar__subcategories-list">
                    {cat.children.map(sub => (
                      <li key={sub.id}>
                        <button
                          className={`product-filter-sidebar__subcategory-btn ${currentCategory === sub.slug ? 'active' : ''}`}
                          onClick={() => handleCategorySelect(sub.slug)}
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

          <h3 className="product-filter-sidebar__title">
            {t('products.sort_title')}
          </h3>
          <div className="checkout__field">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="product-filter-sidebar__sort-select"
            >
              <option value="newest">{t('products.sort_latest')}</option>
              <option value="price_asc">{t('products.sort_price_asc')}</option>
              <option value="price_desc">{t('products.sort_price_desc')}</option>
            </select>
          </div>
          {/* 複合篩選：價格區間 */}
          <h3 className="product-filter-sidebar__title product-filter-sidebar__title--spaced">
            {t('products.filter_price')}
          </h3>
          <form onSubmit={handlePriceApply} className="product-filter-sidebar__price-form">
            <div className="product-filter-sidebar__price-row">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>~</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--sm btn--outline product-filter-sidebar__price-btn">
              {t('common.confirm')}
            </button>
          </form>

          {/* 複合篩選：顏色 */}
          {filterMetadata.colors?.length > 0 && (
            <>
              <h3 className="product-filter-sidebar__title">
                {t('product_detail.color')}
              </h3>
              <div className="product-filter-sidebar__tags">
                {filterMetadata.colors.map(color => {
                  const isActive = selectedColors.includes(color)
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorToggle(color)}
                      className={`product-filter-sidebar__tag-btn ${isActive ? 'active' : ''}`}
                    >
                      {isActive && <span>✓</span>}
                      {t(`colors.${color}`, color)}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* 複合篩選：尺寸 */}
          {filterMetadata.sizes?.length > 0 && (
            <>
              <h3 className="product-filter-sidebar__title">
                {t('product_detail.size')}
              </h3>
              <div className="product-filter-sidebar__tags">
                {filterMetadata.sizes.map(size => {
                  const isActive = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`product-filter-sidebar__tag-btn product-filter-sidebar__tag-btn--size ${isActive ? 'active' : ''}`}
                    >
                      {isActive && <span>✓</span>}
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
              className="btn btn--sm btn--ghost product-filter-sidebar__clear-btn"
            >
              {t('products.clear_filters')}
            </button>
          )}
        </aside>

        {/* ── Main Content Area ── */}
        <div>
          {/* Search Header */}
          <form onSubmit={handleSearchSubmit} className="product-list-page__search-form">
            <div className="checkout__field">
              <input
                type="text"
                placeholder={t('header.search_placeholder')}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primary">
              {t('common.search')}
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
            <div className="product-list-page__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <h3>{t('products.empty_title')}</h3>
              <p>{t('products.empty_desc')}</p>
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
                            className={isSoldOut ? 'product-card__img--grayscale' : ''}
                          />
                        </Link>
                        {isSoldOut && (
                          <div className="product-card__sold-out-badge">
                            <span>
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
                          aria-label={t('home.add_wishlist')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlistIds.includes(prod.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        </button>
                        <div className="product-card__actions">
                          <Link to={`/products/${prod.slug}`} className="btn btn--primary">
                            {isSoldOut ? t('products.sold_out') : t('home.view_spec')}
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
                          <Link to={`/products/${prod.slug}`}>{t(`products_name.${prod.slug}`, prod.name)}</Link>
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
