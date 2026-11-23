import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function CartPage() {
  const { cart, setCart, setIsCartOpen } = useCart()
  const { t } = useTranslation()

  const handleQtyChange = async (itemId, currentQty, type, stockLimit) => {
    const nextQty = type === 'inc' ? currentQty + 1 : currentQty - 1
    if (nextQty < 1) {
      handleRemoveItem(itemId)
      return
    }
    if (type === 'inc' && nextQty > stockLimit) {
      alert(t('cart.stock_limit_alert', { count: stockLimit }))
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
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('cart.title')}</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-heading)', marginBottom: '32px', fontSize: 'clamp(28px, 4vw, 40px)' }}>
        {t('cart.title')}
      </h1>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-cream-faint)' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '20px' }}>
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--color-cream-muted)' }}>
            {t('cart.empty_title')}
          </h2>
          <p style={{ marginBottom: '32px' }}>{t('cart.empty_desc')}</p>
          <Link to="/products" className="btn btn--primary btn--lg">
            {t('cart.explore_btn')}
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
                      {item.color && <span>{t('product_detail.color')}: {item.color}</span>}
                      {item.color && item.size && <span>　</span>}
                      {item.size && <span>{t('product_detail.size')}: {item.size}</span>}
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
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right' }}>
                    <div className="price" style={{ fontSize: '18px', whiteSpace: 'nowrap' }}>
                      NT$ {Math.round(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <Link to="/products" className="btn btn--ghost">
                ← {t('footer.shop_all')}
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="checkout__summary">
            <h3 className="checkout__summary-title">{t('cart.summary_title')}</h3>

            <div className="checkout__summary-rows">
              <div className="checkout__summary-row">
                <span>{t('cart.subtotal')}</span>
                <span>NT$ {Math.round(cart.total)}</span>
              </div>
              <div className="checkout__summary-row">
                <span>{t('cart.shipping')}</span>
                <span style={{ color: 'var(--color-cream-faint)', fontSize: '13px' }}>
                  {cart.total >= 1500 ? `${t('common.free_shipping')} 🎉` : t('common.loading')}
                </span>
              </div>
              <div className="checkout__summary-row checkout__summary-row--total">
                <span>{t('cart.total')}</span>
                <span>NT$ {Math.round(cart.total)}</span>
              </div>
            </div>

            <Link to="/checkout" className="btn btn--primary btn--full btn--lg" style={{ marginTop: '12px', textAlign: 'center' }}>
              {t('cart.checkout_btn')}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
