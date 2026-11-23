import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'
import { useCart } from '../context/CartContext'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { setCart } = useCart()
  const { user } = useAuth()
  const { t, language } = useTranslation()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 規格選擇狀態
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')

  const [adding, setAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  // 願望清單 & 補貨訂閱狀態
  const [wishlistIds, setWishlistIds] = useState([])
  const [subscribed, setSubscribed] = useState(false)
  const [submittingSub, setSubmittingSub] = useState(false)

  useEffect(() => {
    const loadProductAndReviews = async () => {
      setLoading(true)
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/api/products/${slug}`),
          api.get(`/api/products/${slug}/reviews`).catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (prodRes.data.success) {
          setProduct(prodRes.data.data)
          setActiveImage(prodRes.data.data.cover_image_url)

          // 預設選取第一個有庫存的 SKU 規格
          const firstAvailableSku = prodRes.data.data.skus?.find(s => s.stock > 0 && s.is_active)
          if (firstAvailableSku) {
            setSelectedColor(firstAvailableSku.color || '')
            setSelectedSize(firstAvailableSku.size || '')
          } else if (prodRes.data.data.skus?.length > 0) {
            setSelectedColor(prodRes.data.data.skus[0].color || '')
            setSelectedSize(prodRes.data.data.skus[0].size || '')
          }
        }
        if (revRes.data?.success) {
          setReviews(revRes.data.data)
        }
      } catch (err) {
        setError(err.response?.data?.message || t('product_detail.load_failed'))
      } finally {
        setLoading(false)
      }
    }
    loadProductAndReviews()
  }, [slug, t, language])

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

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setSubmittingSub(true)
    try {
      const { data } = await api.post(`/api/products/${product.id}/subscribe`)
      if (data.success) {
        setSubscribed(true)
      }
    } catch (err) {
      alert(err.response?.data?.message || t('product_detail.sub_failed'))
    } finally {
      setSubmittingSub(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail product-detail--loading">
        <p>{t('product_detail.loading')}</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail product-detail--error">
        <h3>{error || t('product_detail.not_found')}</h3>
        <Link to="/products" className="btn btn--outline">
          {t('product_detail.back_to_list')}
        </Link>
      </div>
    )
  }

  // 1. 取得所有不重複的顏色跟尺寸
  const colors = [...new Set(product.skus?.map(s => s.color).filter(Boolean))]
  const sizes  = [...new Set(product.skus?.map(s => s.size).filter(Boolean))]

  // 2. 依選定規格比對對應 SKU
  const currentSku = product.skus?.find(
    (s) => (s.color || '') === selectedColor && (s.size || '') === selectedSize
  )

  // 3. 判斷特定尺寸或顏色庫存狀態
  const isSizeAvailable = (size) => {
    return product.skus?.some(s => s.color === selectedColor && s.size === size && s.stock > 0 && s.is_active)
  }
  const isColorAvailable = (color) => {
    return product.skus?.some(s => s.color === color && s.size === selectedSize && s.stock > 0 && s.is_active)
  }

  const handleQtyChange = (type) => {
    if (type === 'dec') {
      setQuantity(prev => Math.max(1, prev - 1))
    } else {
      const maxStock = currentSku ? currentSku.stock : 1
      setQuantity(prev => Math.min(maxStock, prev + 1))
    }
  }

  const handleAddToCart = async () => {
    if (!currentSku) return
    setAdding(true)
    setAddSuccess(false)

    try {
      // 呼叫購物車 API
      const { data } = await api.post('/api/cart/items', {
        sku_id: currentSku.id,
        quantity: quantity,
      })

      if (data.success) {
        // 重新拉取購物車清單以同步 Context 狀態
        const cartRes = await api.get('/api/cart')
        if (cartRes.data.success) {
          setCart(cartRes.data.data)
        }
        setAddSuccess(true)
        setTimeout(() => setAddSuccess(false), 3000)
      }
    } catch (err) {
      alert(err.response?.data?.message || t('common.error'))
    } finally {
      setAdding(false)
    }
  }

  // 合併主圖與多圖
  const allImages = [product.cover_image_url, ...product.images?.map(i => i.url || i)].filter(Boolean)

  return (
    <main className="product-detail">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item"><Link to="/products">{t('product_detail.breadcrumb_products')}</Link></span>
        <span className="breadcrumb__item"><Link to={`/products?category=${product.category_slug}`}>{product.category_name}</Link></span>
        <span className="breadcrumb__item">{t(`products_name.${product.slug}`, product.name)}</span>
      </div>

      <div className="product-detail__inner">
        {/* ── Gallery Left Column ── */}
        <div className="product-detail__gallery">
          <div className="product-detail__main-img">
            <img src={activeImage} alt={t(`products_name.${product.slug}`, product.name)} />
          </div>
          {allImages.length > 1 && (
            <div className="product-detail__thumbs">
              {allImages.map((imgUrl, i) => (
                <div
                  key={i}
                  className={`product-detail__thumb ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`Thumbnail ${i}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info Right Column ── */}
        <div className="product-detail__info">
          <span className="product-detail__category">{product.category_name}</span>
          <h1 className="product-detail__name">{t(`products_name.${product.slug}`, product.name)}</h1>
          <div className="product-detail__meta-bar">
            <span className="product-detail__meta-bar-rating">
              ★ {parseFloat(product.rating || 5).toFixed(1)}
            </span>
            <span>•</span>
            <span>{t('product_detail.reviews_count', { count: reviews.length })}</span>
            <span>•</span>
            <span>{t('product_detail.popularity_count', { count: product.view_count || 0 })}</span>
          </div>
          
          <div className="product-detail__price-area">
            <span className="price price--large">
              NT$ {currentSku ? Math.round(currentSku.price) : Math.round(product.base_price)}
            </span>
            {product.compare_price && (
              <span className="price price--compare">
                NT$ {Math.round(product.compare_price)}
              </span>
            )}
          </div>

          {/* Color Selector */}
          {colors.length > 0 && (
            <div className="product-detail__option-group">
              <label>
                {t('product_detail.color')}: <span>{selectedColor ? t(`colors.${selectedColor}`, selectedColor) : t('product_detail.select_spec')}</span>
              </label>
              <div className="product-detail__options">
                {colors.map((color) => {
                  const outOfStock = !isColorAvailable(color)
                  return (
                    <button
                      key={color}
                      className={`product-detail__option-btn ${selectedColor === color ? 'active' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {t(`colors.${color}`, color)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="product-detail__option-group">
              <label>
                {t('product_detail.size')}: <span>{selectedSize || t('product_detail.select_spec')}</span>
              </label>
              <div className="product-detail__options">
                {sizes.map((size) => {
                  const outOfStock = !isSizeAvailable(size)
                  return (
                    <button
                      key={size}
                      className={`product-detail__option-btn ${selectedSize === size ? 'active' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {currentSku && currentSku.stock > 0 ? (
            <>
              <div className="product-detail__qty-group">
                <span className="product-detail__qty-label">{t('product_detail.quantity')}</span>
                <div className="product-detail__qty-control">
                  <button type="button" onClick={() => handleQtyChange('dec')}>-</button>
                  <input type="text" readOnly value={quantity} />
                  <button type="button" onClick={() => handleQtyChange('inc')}>+</button>
                </div>
                <span>
                  {t('product_detail.in_stock', { count: currentSku.stock })}
                </span>
              </div>

              <div className="product-detail__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? t('common.loading') : t('product_detail.add_to_cart')}
                </button>
                <button
                  type="button"
                  className={`btn btn--lg product-detail__wishlist-btn ${wishlistIds.includes(product.id) ? 'product-detail__wishlist-btn--active' : 'btn--outline'}`}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={t('home.add_wishlist')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistIds.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              {addSuccess && (
                <div className="product-detail__toast">
                  🎉 {t('product_detail.added_to_cart')}
                </div>
              )}
            </>
          ) : (
            <div className="product-detail__stock-box">
              <div className="product-detail__stock-box-row">
                <button className="btn btn--ghost btn--lg" disabled>
                  {t('product_detail.out_of_stock')}
                </button>
                <button
                  type="button"
                  className={`btn btn--lg product-detail__wishlist-btn ${wishlistIds.includes(product.id) ? 'product-detail__wishlist-btn--active' : 'btn--outline'}`}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={t('home.add_wishlist')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistIds.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              {subscribed ? (
                <div className="product-detail__stock-box-subscribed">
                  {t('product_detail.sub_success')}
                </div>
              ) : (
                <div className="product-detail__stock-box-subscribe-panel">
                  <p>
                    {t('product_detail.sub_hint')}
                  </p>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={handleSubscribe}
                    disabled={submittingSub}
                  >
                    {submittingSub ? t('product_detail.submitting') : t('product_detail.sub_btn')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="product-detail__desc">
            <h3>
              {t('product_detail.desc_title')}
            </h3>
            <p>{t(`products_desc.${product.slug}`, product.description || t('product_detail.no_desc'))}</p>
          </div>

          {/* Customer Reviews Section */}
          <div className="product-detail__reviews">
            <h3 className="product-detail__reviews-title">
              {t('product_detail.reviews_title', { count: reviews.length })}
            </h3>
            {reviews.length === 0 ? (
              <p className="product-detail__reviews-empty">
                {t('product_detail.no_reviews')}
              </p>
            ) : (
              <div className="product-detail__reviews-list">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="product-detail__reviews-item"
                  >
                    <div className="product-detail__reviews-header">
                      <div className="product-detail__reviews-user">
                        <span className="product-detail__reviews-user-name">
                          {rev.user_name}
                        </span>
                        <span className="product-detail__reviews-user-stars">
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <span className="product-detail__reviews-date">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="product-detail__reviews-content">
                      {rev.comment || t('product_detail.default_review')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
