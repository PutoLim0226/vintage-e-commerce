import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 步驟狀態: 'fill' | 'success'
  const [step, setStep] = useState('fill')
  const [createdOrder, setCreatedOrder] = useState(null)

  // 收件人表單狀態
  const [shipName, setShipName] = useState('')
  const [shipPhone, setShipPhone] = useState('')
  const [shipZip, setShipZip] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipDistrict, setShipDistrict] = useState('')
  const [shipAddress, setShipAddress] = useState('')
  const [shipMethod, setShipMethod] = useState('home_delivery')
  const [notes, setNotes] = useState('')

  // 折價券代碼
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [discount, setDiscount] = useState(0)

  // 紅利點數
  const [userPoints, setUserPoints] = useState(0)
  const [usePoints, setUsePoints] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // 購物車是空的就不給結帳
    if (step === 'fill' && (!cart.items || cart.items.length === 0)) {
      navigate('/cart')
    }
  }, [cart, navigate, step])

  useEffect(() => {
    // 獲取會員最新點數
    const fetchUserPoints = async () => {
      try {
        const { data } = await api.get('/api/me')
        if (data.success) {
          setUserPoints(parseInt(data.data.points || 0, 10))
        }
      } catch (err) {
        console.error('Failed to load user profile points', err)
      }
    }
    fetchUserPoints()
  }, [])

  // 前端估算運費
  const calcShippingFee = () => {
    if (shipMethod === 'home_delivery') {
      return cart.total >= 1500 ? 0 : 120
    }
    return 60 // 超商 60
  }

  const shippingFee = calcShippingFee()
  // 計算點數折抵金額
  const pointsDiscount = usePoints ? Math.min(userPoints, Math.floor(cart.total - discount)) : 0
  const orderTotal = Math.max(0, cart.total - discount - pointsDiscount + shippingFee)

  const validate = () => {
    const tempErrors = {}
    if (!shipName.trim()) tempErrors.shipName = t('checkout.error_name_required')
    if (!shipPhone.trim() || !/^\d{8,11}$/.test(shipPhone.trim())) tempErrors.shipPhone = t('checkout.error_phone_invalid')
    if (!shipCity.trim()) tempErrors.shipCity = t('checkout.error_city_required')
    if (!shipDistrict.trim()) tempErrors.shipDistrict = t('checkout.error_district_required')
    if (!shipAddress.trim()) tempErrors.shipAddress = t('checkout.error_address_required')
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setLoading(true)
    try {
      const { data } = await api.post('/api/coupons/check', {
        coupon_code: couponCode.trim(),
        subtotal: cart.total
      })
      if (data.success) {
        setAppliedCoupon(data.data.code)
        setDiscount(parseFloat(data.data.discount || 0))
        alert(t('checkout.coupon_applied_alert', { code: data.data.code, discount: Math.round(data.data.discount) }))
      }
    } catch (err) {
      setAppliedCoupon('')
      setDiscount(0)
      alert(err.response?.data?.message || t('checkout.coupon_invalid'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      const payload = {
        ship_name: shipName,
        ship_phone: shipPhone,
        ship_zip: shipZip,
        ship_city: shipCity,
        ship_district: shipDistrict,
        ship_address: shipAddress,
        ship_method: shipMethod,
        notes: notes,
      }

      if (appliedCoupon) {
        payload.coupon_code = appliedCoupon
      }

      if (usePoints) {
        payload.use_points = true
      }

      const { data } = await api.post('/api/orders', payload)

      if (data.success) {
        setCreatedOrder(data.data) // { order_no, total }
        clearCart() // 清空購物車
        setStep('success')
      }
    } catch (err) {
      alert(err.response?.data?.message || t('checkout.order_create_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success' && createdOrder) {
    return (
      <main className="container section checkout-success">
        <div className="checkout-success__box">
          <div className="checkout-success__icon">🎉</div>
          <h2 className="section-title">
            {t('checkout.order_created_title_pre')}<span>{t('checkout.order_created_title_post')}</span>
          </h2>
          <p className="checkout-success__desc">
            {t('checkout.order_created_desc')}
          </p>

          <div className="checkout-success__meta">
            <div className="checkout-success__meta-row">
              <span>{t('checkout.order_no_label')}</span>
              <strong>{createdOrder.order_no}</strong>
            </div>
            <div className="checkout-success__meta-row">
              <span>{t('checkout.amount_payable')}</span>
              <strong>NT$ {Math.round(createdOrder.total)}</strong>
            </div>
          </div>

          <div className="checkout-success__actions">
            <Link to={`/payment/${createdOrder.order_no}`} className="btn btn--primary checkout-success__pay-btn">
              {t('checkout.go_to_payment')}
            </Link>
            <div className="checkout-success__sub-actions">
              <Link to="/profile/orders" className="btn btn--outline btn--sm">
                {t('payment.view_orders')}
              </Link>
              <Link to="/" className="btn btn--outline btn--sm">
                {t('payment.back_home')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout">
      {/* Step Indicator */}
      <div className="checkout__steps">
        <div className="checkout__step active">
          <span className="checkout__step-num">1</span>
          <span className="checkout__step-label">{t('checkout.breadcrumb')}</span>
          <span className="checkout__step-line" />
        </div>
        <div className="checkout__step">
          <span className="checkout__step-num">2</span>
          <span className="checkout__step-label">{t('payment.title')}</span>
        </div>
      </div>

      <div className="checkout__inner">
        {/* Left Form */}
        <form onSubmit={handleSubmit}>
          <div className="checkout__form-section">
            <h3>{t('checkout.customer_info')}</h3>

            <div className="checkout__form-row">
              <div className={`checkout__field ${errors.shipName ? 'checkout__field--error' : ''}`}>
                <label htmlFor="shipName">{t('checkout.name')}</label>
                <input
                  id="shipName"
                  type="text"
                  placeholder={t('checkout.name')}
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  disabled={loading}
                />
                {errors.shipName && <span className="error-msg">{errors.shipName}</span>}
              </div>

              <div className={`checkout__field ${errors.shipPhone ? 'checkout__field--error' : ''}`}>
                <label htmlFor="shipPhone">{t('checkout.phone')}</label>
                <input
                  id="shipPhone"
                  type="text"
                  placeholder="0912345678"
                  value={shipPhone}
                  onChange={(e) => setShipPhone(e.target.value)}
                  disabled={loading}
                />
                {errors.shipPhone && <span className="error-msg">{errors.shipPhone}</span>}
              </div>
            </div>

            <div className="checkout__form-row">
              <div className={`checkout__field ${errors.shipCity ? 'checkout__field--error' : ''}`}>
                <label htmlFor="shipCity">City</label>
                <input
                  id="shipCity"
                  type="text"
                  placeholder="City"
                  value={shipCity}
                  onChange={(e) => setShipCity(e.target.value)}
                  disabled={loading}
                />
                {errors.shipCity && <span className="error-msg">{errors.shipCity}</span>}
              </div>

              <div className={`checkout__field ${errors.shipDistrict ? 'checkout__field--error' : ''}`}>
                <label htmlFor="shipDistrict">District</label>
                <input
                  id="shipDistrict"
                  type="text"
                  placeholder="District"
                  value={shipDistrict}
                  onChange={(e) => setShipDistrict(e.target.value)}
                  disabled={loading}
                />
                {errors.shipDistrict && <span className="error-msg">{errors.shipDistrict}</span>}
              </div>
            </div>

            <div className="checkout__form-row checkout__form-row--full">
              <div className="checkout__field">
                <label htmlFor="shipZip">Zip Code</label>
                <input
                  id="shipZip"
                  type="text"
                  placeholder="106"
                  value={shipZip}
                  onChange={(e) => setShipZip(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="checkout__form-row checkout__form-row--full">
              <div className={`checkout__field ${errors.shipAddress ? 'checkout__field--error' : ''}`}>
                <label htmlFor="shipAddress">{t('checkout.address')}</label>
                <input
                  id="shipAddress"
                  type="text"
                  placeholder={t('checkout.address')}
                  value={shipAddress}
                  onChange={(e) => setShipAddress(e.target.value)}
                  disabled={loading}
                />
                {errors.shipAddress && <span className="error-msg">{errors.shipAddress}</span>}
              </div>
            </div>
          </div>

          <div className="checkout__form-section">
            <h3>{t('checkout.shipping_method')}</h3>

            <div className="checkout__form-row checkout__form-row--full">
              <div className="checkout__field">
                <label htmlFor="shipMethod">{t('checkout.shipping_method')}</label>
                <select
                  id="shipMethod"
                  value={shipMethod}
                  onChange={(e) => setShipMethod(e.target.value)}
                  disabled={loading}
                >
                  <option value="home_delivery">{t('checkout.ship_standard')}</option>
                  <option value="cvs_711">7-11 ({t('checkout.ship_cvs')})</option>
                  <option value="cvs_family">FamilyMart ({t('checkout.ship_cvs')})</option>
                </select>
              </div>
            </div>

            <div className="checkout__form-row checkout__form-row--full">
              <div className="checkout__field">
                <label htmlFor="notes">{t('checkout.note')}</label>
                <textarea
                  id="notes"
                  placeholder={t('checkout.note')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows="3"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Right Summary Panel */}
        <div className="checkout__summary">
          <h3 className="checkout__summary-title">{t('checkout.order_items', { count: cart.items?.length || 0 })}</h3>

          <div className="checkout__summary-items">
            {cart.items?.map((item) => (
              <div key={item.id} className="checkout__summary-item">
                <img
                  src={item.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=150&q=80'}
                  alt={item.product_name}
                />
                <div className="checkout__summary-item-info">
                  <h4 className="checkout__summary-item-name">{t(`products_name.${item.slug}`, item.product_name)}</h4>
                  <div className="checkout__summary-item-meta">
                    {t(`colors.${item.color}`, item.color)} / {item.size} × {item.quantity}
                  </div>
                </div>
                <span className="checkout__summary-item-price">
                  NT$ {Math.round(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon Input */}
          <form onSubmit={handleApplyCoupon} className="checkout__coupon">
            <input
              type="text"
              placeholder={t('checkout.coupon_placeholder')}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn--ghost btn--sm" disabled={loading}>
              {t('checkout.coupon_apply')}
            </button>
          </form>

          {appliedCoupon && (
            <div className="checkout__coupon-success">
              ✓ {t('checkout.coupon_applied', { amount: `NT$ ${discount}` })}
            </div>
          )}

          {/* Checkout Totals */}
          <div className="checkout__summary-rows">
            <div className="checkout__summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>NT$ {Math.round(cart.total)}</span>
            </div>
            <div className="checkout__summary-row">
              <span>{t('cart.shipping')}</span>
              <span>NT$ {Math.round(shippingFee)}</span>
            </div>
            {appliedCoupon && (
              <div className="checkout__summary-row checkout__summary-row--discount">
                <span>{t('common.discount')}</span>
                <span>- NT$ {Math.round(discount)}</span>
              </div>
            )}
            <div className="checkout__summary-row checkout__summary-row--total">
              <span>{t('cart.total')}</span>
              <span>NT$ {Math.round(orderTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--full btn--lg checkout__submit-btn"
            onClick={handleSubmit}
            disabled={loading || !cart.items || cart.items.length === 0}
          >
            {loading ? t('checkout.processing') : t('checkout.submit_order')}
          </button>
        </div>
      </div>
    </main>
  )
}
