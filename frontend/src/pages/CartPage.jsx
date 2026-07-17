import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../api/api'

export default function CartPage() {
  const { cart, setCart, setIsCartOpen } = useCart()

  const handleQtyChange = async (itemId, currentQty, type, stockLimit) => {
    const nextQty = type === 'inc' ? currentQty + 1 : currentQty - 1
    if (nextQty < 1) {
      handleRemoveItem(itemId)
      return
    }
    if (type === 'inc' && nextQty > stockLimit) {
      alert(`已達庫存上限 (${stockLimit} 件)`)
      return
    }
    try {
      const { data } = await api.patch(`/api/cart/items/${itemId}`, { quantity: nextQty })
      if (data.success) {
        const res = await api.get('/api/cart')
        if (res.data.success) setCart(res.data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      const { data } = await api.delete(`/api/cart/items/${itemId}`)
      if (data.success) {
        const res = await api.get('/api/cart')
        if (res.data.success) setCart(res.data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const isEmpty = !cart.items || cart.items.length === 0

  return (
    <main className="container section" style={{ minHeight: '80dvh' }}>
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">首頁</Link></span>
        <span className="breadcrumb__item">購物車</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-heading)', marginBottom: '32px', fontSize: 'clamp(28px, 4vw, 40px)' }}>
        購物 <span style={{ color: 'var(--color-gold)' }}>清單</span>
      </h1>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-cream-faint)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '20px' }}>
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--color-cream-muted)' }}>
            購物車目前是空的
          </h2>
          <p style={{ marginBottom: '32px' }}>找找看有沒有喜歡的復古單品吧！</p>
          <Link to="/products" className="btn btn--primary btn--lg">
            前往逛逛
          </Link>
        </div>
      ) : (
        <div className="layout-sidebar" style={{ alignItems: 'start' }}>
          {/* Cart Items */}
          <div>
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {cart.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '88px 1fr auto',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: idx !== cart.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                    alignItems: 'center'
                  }}
                >
                  {/* Image */}
                  <Link to={`/products/${item.slug || ''}`}>
                    <img
                      src={item.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=200&q=70'}
                      alt={item.product_name}
                      style={{ width: '88px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </Link>

                  {/* Info */}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-cream)', marginBottom: '6px' }}>
                      <Link to={`/products/${item.slug || ''}`} style={{ color: 'inherit' }}>{item.product_name}</Link>
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--color-cream-faint)', marginBottom: '12px' }}>
                      {item.color && <span>顏色：{item.color}</span>}
                      {item.color && item.size && <span>　</span>}
                      {item.size && <span>尺寸：{item.size}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="product-detail__qty-control">
                        <button type="button" onClick={() => handleQtyChange(item.id, item.quantity, 'dec', item.stock)}>-</button>
                        <input type="text" readOnly value={item.quantity} />
                        <button type="button" onClick={() => handleQtyChange(item.id, item.quantity, 'inc', item.stock)}>+</button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-cream-faint)', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--color-error)'}
                        onMouseLeave={e => e.target.style.color = 'var(--color-cream-faint)'}
                      >
                        移除
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right' }}>
                    <div className="price" style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>
                      NT$ {Math.round(item.price * item.quantity)}
                    </div>
                    {item.quantity > 1 && (
                      <div style={{ fontSize: '12px', color: 'var(--color-cream-faint)', marginTop: '2px' }}>
                        單價 NT$ {Math.round(item.price)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Link to="/products" className="btn btn--ghost">
                ← 繼續購物
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout__summary">
            <h3 className="checkout__summary-title">訂單摘要</h3>

            <div className="checkout__summary-rows">
              <div className="checkout__summary-row">
                <span>商品小計</span>
                <span>NT$ {Math.round(cart.total)}</span>
              </div>
              <div className="checkout__summary-row">
                <span>運費估算</span>
                <span style={{ color: 'var(--color-cream-faint)', fontSize: '13px' }}>
                  {cart.total >= 1500 ? '免運費 🎉' : '結帳時計算'}
                </span>
              </div>
              {cart.total < 1500 && (
                <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--color-gold)' }}>
                  再購 NT$ {Math.round(1500 - cart.total)} 即可享免運優惠！
                </div>
              )}
              <div className="checkout__summary-row checkout__summary-row--total">
                <span>預估總計</span>
                <span>NT$ {Math.round(cart.total)}</span>
              </div>
            </div>

            <Link to="/checkout" className="btn btn--primary btn--full btn--lg" style={{ marginTop: '12px', textAlign: 'center' }}>
              前往結帳
            </Link>

            <p style={{ fontSize: '12px', color: 'var(--color-cream-faint)', textAlign: 'center', marginTop: '12px' }}>
              可在結帳頁輸入折價券代碼
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
