import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/api'
import { useCart } from '../context/CartContext'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { setCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 規格選擇狀態
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')

  const [adding, setAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/api/products/${slug}`)
        if (data.success) {
          setProduct(data.data)
          setActiveImage(data.data.cover_image_url)

          // 預設選取第一個有庫存的 SKU 規格
          const firstAvailableSku = data.data.skus?.find(s => s.stock > 0 && s.is_active)
          if (firstAvailableSku) {
            setSelectedColor(firstAvailableSku.color || '')
            setSelectedSize(firstAvailableSku.size || '')
          } else if (data.data.skus?.length > 0) {
            setSelectedColor(data.data.skus[0].color || '')
            setSelectedSize(data.data.skus[0].size || '')
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || '載入商品失敗')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [slug])

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
        <span className="breadcrumb__item"><Link to="/">首頁</Link></span>
        <span className="breadcrumb__item"><Link to="/products">所有單品</Link></span>
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
                顏色 Color: <span>{selectedColor || '請選擇'}</span>
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
                尺寸 Size: <span>{selectedSize || '請選擇'}</span>
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
                <span className="product-detail__qty-label">數量 Qty</span>
                <div className="product-detail__qty-control">
                  <button type="button" onClick={() => handleQtyChange('dec')}>-</button>
                  <input type="text" readOnly value={quantity} />
                  <button type="button" onClick={() => handleQtyChange('inc')}>+</button>
                </div>
                <span style={{ fontSize: '14px', color: 'var(--color-cream-faint)' }}>
                  剩餘庫存 {currentSku.stock} 件
                </span>
              </div>

              <div className="product-detail__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? '正在加入購物車...' : '加入購物車'}
                </button>
              </div>

              {addSuccess && (
                <div style={{ padding: '12px', background: 'rgba(76,175,114,0.1)', border: '1px solid rgba(76,175,114,0.3)', borderRadius: '8px', color: 'var(--color-success)', marginBottom: '24px', textAlign: 'center' }}>
                  🎉 成功加入購物車！
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: '32px' }}>
              <button className="btn btn--ghost btn--lg btn--full" disabled>
                已售罄 (Out of Stock)
              </button>
            </div>
          )}

          {/* Description */}
          <div className="product-detail__desc">
            <h3 style={{ fontSize: '18px', color: 'var(--color-cream)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              商品細節 & 故事
            </h3>
            <p style={{ whiteSpace: 'pre-line' }}>{product.description || '無詳細說明'}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
