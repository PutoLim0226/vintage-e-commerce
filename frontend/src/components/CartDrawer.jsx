import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../api/api'

export default function CartDrawer() {
  const { cart, setCart, isCartOpen, setIsCartOpen } = useCart()
  const navigate = useNavigate()

  if (!isCartOpen) return null

  const handleQtyChange = async (itemId, currentQty, type, stockLimit) => {
    let nextQty = type === 'inc' ? currentQty + 1 : currentQty - 1
    if (nextQty < 1) {
      handleRemoveItem(itemId)
      return
    }

    if (type === 'inc' && nextQty > stockLimit) {
      alert(`已達庫存上限：該規格目前最多僅能選購 ${stockLimit} 件`)
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
          <h2 className="cart-drawer__title">購物車</h2>
          <button
            type="button"
            className="modal__close"
            onClick={() => setIsCartOpen(false)}
            aria-label="關閉"
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
              <p style={{ marginTop: '16px' }}>您的購物車是空的</p>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setIsCartOpen(false)}
                style={{ marginTop: '12px' }}
              >
                前往選購
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
                    {item.color && <span>顏色: {item.color} </span>}
                    {item.size && <span>尺寸: {item.size}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <span className="price" style={{ fontSize: 'var(--font-size-md)' }}>
                      NT$ {Math.round(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label="移除品項"
                  style={{ border: 'none', background: 'none' }}
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
              <span>小計 Subtotal</span>
              <span>NT$ {Math.round(cart.total)}</span>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--full btn--lg"
              onClick={handleCheckoutClick}
            >
              前往結帳
            </button>
          </div>
        )}
      </div>
    </>
  )
}
