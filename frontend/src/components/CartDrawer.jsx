import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function CartDrawer() {
  const { cart, setCart, isCartOpen, setIsCartOpen } = useCart()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!isCartOpen) return null

  const handleQtyChange = async (itemId, currentQty, type, stockLimit) => {
    let nextQty = type === 'inc' ? currentQty + 1 : currentQty - 1
    if (nextQty < 1) {
      handleRemoveItem(itemId)
      return
    }

    if (type === 'inc' && nextQty > stockLimit) {
      alert(t('cart.stock_limit_alert', { count: stockLimit }))
      return
    }

    try {
      const { data } = await api.patch(`/api/cart/items/${itemId}`, {
        quantity: nextQty,
      })

      if (data.success) {
        // 重新拉取購物車以同步
        const cartRes = await api.get('/api/cart')
        if (cartRes.data.success) {
          setCart(cartRes.data.data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      const { data } = await api.delete(`/api/cart/items/${itemId}`)
      if (data.success) {
        const cartRes = await api.get('/api/cart')
        if (cartRes.data.success) {
          setCart(cartRes.data.data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCheckoutClick = () => {
    setIsCartOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      {/* Background Overlay */}
      <div className="overlay" onClick={() => setIsCartOpen(false)} />

      {/* Cart Drawer Panel */}
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">{t('cart.title')}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={() => setIsCartOpen(false)}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="cart-drawer__body">
          {(!cart.items || cart.items.length === 0) ? (
            <div className="cart-drawer__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              <p className="cart-drawer__empty-text">{t('cart.empty_title')}</p>
              <button
                type="button"
                className="btn btn--outline btn--sm cart-drawer__empty-btn"
                onClick={() => setIsCartOpen(false)}
              >
                {t('cart.explore_btn')}
              </button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  className="cart-item__img"
                  src={item.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=150&q=80'}
                  alt={item.product_name}
                />
                <div className="cart-item__info">
                  <h3 className="cart-item__name">{item.product_name}</h3>
                  <div className="cart-item__meta">
                    {item.color && <span>{t('product_detail.color')}: {item.color} </span>}
                    {item.size && <span>{t('product_detail.size')}: {item.size}</span>}
                  </div>
                  <div className="cart-item__bottom-row">
                    <div className="cart-item__qty-row">
                      <button
                        type="button"
                        className="cart-item__qty-btn"
                        onClick={() => handleQtyChange(item.id, item.quantity, 'dec', item.stock)}
                      >
                        -
                      </button>
                      <span className="cart-item__qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-item__qty-btn"
                        onClick={() => handleQtyChange(item.id, item.quantity, 'inc', item.stock)}
                      >
                        +
                      </button>
                    </div>
                    <span className="price cart-item__price">
                      NT$ {Math.round(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={t('cart.remove')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {cart.items && cart.items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total-row">
              <span>{t('common.subtotal')}</span>
              <span>NT$ {Math.round(cart.total)}</span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--full btn--lg"
              onClick={handleCheckoutClick}
            >
              {t('cart.checkout_btn')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
