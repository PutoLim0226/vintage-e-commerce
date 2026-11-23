import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function CartPage() {
  const { cart, setCart } = useCart()
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
    <main className="container section cart-page">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('cart.title')}</span>
      </div>

      <h1 className="cart-page__title">
        {t('cart.title')}
      </h1>

      {isEmpty ? (
        <div className="cart-page__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          <h2>
            {t('cart.empty_title')}
          </h2>
          <p>{t('cart.empty_desc')}</p>
          <Link to="/products" className="btn btn--primary btn--lg">
            {t('cart.explore_btn')}
          </Link>
        </div>
      ) : (
        <div className="layout-sidebar cart-page__layout">
          {/* Cart Items */}
          <div>
            <div className="cart-list__wrapper">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item-row">
                  {/* Image */}
                  <Link to={`/products/${item.slug || ''}`}>
                    <img
                      src={item.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=200&q=70'}
                      alt={item.product_name}
                      className="cart-item-row__img"
                    />
                  </Link>

                  {/* Info */}
                  <div className="cart-item-row__info">
                    <h3 className="cart-item-row__name">
                      <Link to={`/products/${item.slug || ''}`}>{item.product_name}</Link>
                    </h3>
                    <div className="cart-item-row__meta">
                      {item.color && <span>{t('product_detail.color')}: {item.color}</span>}
                      {item.color && item.size && <span>　</span>}
                      {item.size && <span>{t('product_detail.size')}: {item.size}</span>}
                    </div>
                    <div className="cart-item-row__actions">
                      <div className="product-detail__qty-control">
                        <button type="button" onClick={() => handleQtyChange(item.id, item.quantity, 'dec', item.stock)}>-</button>
                        <input type="text" readOnly value={item.quantity} />
                        <button type="button" onClick={() => handleQtyChange(item.id, item.quantity, 'inc', item.stock)}>+</button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="cart-item-row__remove-btn"
                      >
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="cart-item-row__price-col">
                    <div className="cart-item-row__price">
                      NT$ {Math.round(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-list__actions">
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
                <span className="cart-summary__shipping-status">
                  {cart.total >= 1500 ? `${t('common.free_shipping')} 🎉` : t('common.loading')}
                </span>
              </div>
              <div className="checkout__summary-row checkout__summary-row--total">
                <span>{t('cart.total')}</span>
                <span>NT$ {Math.round(cart.total)}</span>
              </div>
            </div>

            {cart.total >= 1500 ? (
              <div className="cart-summary__free-hint">
                {t('cart.free_shipping_achieved')}
              </div>
            ) : (
              <div className="cart-summary__free-hint">
                {t('cart.free_shipping_threshold_hint', { amount: 1500 - Math.round(cart.total) })}
              </div>
            )}
            <p className="cart-summary__coupon-note">{t('cart.coupon_hint')}</p>

            <Link to="/checkout" className="btn btn--primary btn--full btn--lg cart-page__checkout-btn">
              {t('cart.checkout_btn')}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
