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
  const { t } = useTranslation()
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
        setError(err.response?.data?.message || '載入商品失敗')
      } finally {
        setLoading(false)
      }
    }
    loadProductAndReviews()
  }, [slug])

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
      alert(err.response?.data?.message || '補貨訂閱失敗')
    } finally {
      setSubmittingSub(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-cream-muted)' }}>尋找珍貴古著單品中...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail" style={{ minHeight: '80dvh', textAlign: 'center', paddingBlock: '80px' }}>
        <h3 style={{ color: 'var(--color-error)' }}>{error || '商品未上架或已被下架'}</h3>
        <Link to="/products" className="btn btn--outline" style={{ marginTop: '24px' }}>
          返回商品列表
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
      alert(err.response?.data?.message || '加入購物車失敗，請再試一次')
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
        <span className="breadcrumb__item">{product.name}</span>
      </div>

      <div className="product-detail__inner">
        {/* ── Gallery Left Column ── */}
        <div className="product-detail__gallery">
          <div className="product-detail__main-img">
            <img src={activeImage} alt={product.name} />
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
          <h1 className="product-detail__name">{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--color-cream-faint)', marginTop: '8px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
              ★ {parseFloat(product.rating || 5).toFixed(1)}
            </span>
            <span>•</span>
            <span>{reviews.length} 則評價</span>
            <span>•</span>
            <span>{product.view_count || 0} 次點擊人氣</span>
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
                {t('product_detail.color')}: <span>{selectedColor || t('product_detail.select_spec')}</span>
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
                      {color}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-cream-faint)' }}>
                    {t('product_detail.in_stock', { count: currentSku.stock })}
                  </span>
                </div>
              </div>

              <div className="product-detail__actions" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAddToCart}
                  disabled={adding}
                  style={{ flex: 1 }}
                >
                  {adding ? t('common.loading') : t('product_detail.add_to_cart')}
                </button>
                <button
                  type="button"
                  className={`btn btn--lg ${wishlistIds.includes(product.id) ? 'btn--primary' : 'btn--outline'}`}
                  style={{
                    width: '56px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderColor: wishlistIds.includes(product.id) ? '#e05454' : '',
                    backgroundColor: wishlistIds.includes(product.id) ? '#e05454' : '',
                    color: wishlistIds.includes(product.id) ? '#ffffff' : ''
                  }}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={t('home.add_wishlist')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistIds.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              {addSuccess && (
                <div style={{ padding: '12px', background: 'rgba(76,175,114,0.1)', border: '1px solid rgba(76,175,114,0.3)', borderRadius: '8px', color: 'var(--color-success)', marginBottom: '24px', textAlign: 'center' }}>
                  🎉 {t('product_detail.added_to_cart')}
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button className="btn btn--ghost btn--lg" style={{ flex: 1 }} disabled>
                  {t('product_detail.out_of_stock')}
                </button>
                <button
                  type="button"
                  className={`btn btn--lg ${wishlistIds.includes(product.id) ? 'btn--primary' : 'btn--outline'}`}
                  style={{
                    width: '56px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderColor: wishlistIds.includes(product.id) ? '#e05454' : '',
                    backgroundColor: wishlistIds.includes(product.id) ? '#e05454' : '',
                    color: wishlistIds.includes(product.id) ? '#ffffff' : ''
                  }}
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={t('home.add_wishlist')}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistIds.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              {subscribed ? (
                <div style={{ padding: '12px', background: 'rgba(200, 169, 110, 0.1)', border: '1px solid var(--color-gold)', borderRadius: '6px', color: 'var(--color-gold)', fontSize: '14px', textAlign: 'center' }}>
                  📬 補貨訂閱成功！商品上架時將第一時間透過 Email 與 LINE 通知您。
                </div>
              ) : (
                <div style={{ padding: '16px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-cream-muted)', marginBottom: '12px' }}>
                    📬 本單品目前缺貨中，點擊下方按鈕，在商品重新上架時，我們將自動發送 Email 與 LINE 官方帳號通知您！
                  </p>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    style={{ width: '100%' }}
                    onClick={handleSubscribe}
                    disabled={submittingSub}
                  >
                    {submittingSub ? '訂閱中...' : '🔔 補貨與降價通知我'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="product-detail__desc">
            <h3 style={{ fontSize: '18px', color: 'var(--color-cream)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              商品細節 & 故事
            </h3>
            <p style={{ whiteSpace: 'pre-line' }}>{product.description || '無詳細說明'}</p>
          </div>

          {/* Customer Reviews Section */}
          <div style={{ marginTop: '48px', borderTop: '1px solid var(--color-border)', paddingTop: '32px' }}>
            <h3 style={{ fontSize: '20px', color: 'var(--color-cream)', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
              顧客真實回饋 ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--color-cream-faint)', fontSize: '14px', fontStyle: 'italic' }}>
                目前尚無評價，歡迎購入後留下您的刻痕。
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-cream)' }}>
                          {rev.user_name}
                        </span>
                        <span style={{ color: 'var(--color-gold)', fontSize: '14px' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
                        {new Date(rev.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--color-cream-muted)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {rev.comment || '僅留下星等評分，未填寫文字描述。'}
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
