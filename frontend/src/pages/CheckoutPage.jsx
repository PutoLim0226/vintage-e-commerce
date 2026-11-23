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
    if (!shipName.trim()) tempErrors.shipName = '收件人姓名必填'
    if (!shipPhone.trim() || !/^\d{8,11}$/.test(shipPhone.trim())) tempErrors.shipPhone = '請輸入正確的聯絡電話格式'
    if (!shipCity.trim()) tempErrors.shipCity = '收件城市必填'
    if (!shipDistrict.trim()) tempErrors.shipDistrict = '收件地區必填'
    if (!shipAddress.trim()) tempErrors.shipAddress = '收件詳細地址必填'
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
        alert(`成功套用折價券「${data.data.code}」，已折抵 NT$ ${Math.round(data.data.discount)}`)
      }
    } catch (err) {
      setAppliedCoupon('')
      setDiscount(0)
      alert(err.response?.data?.message || '折價券無效或未達消費門檻')
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
      alert(err.response?.data?.message || '建立訂單失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success' && createdOrder) {
    return (
      <main className="container section" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="checkout__form-section" style={{ width: '100%', maxWidth: '520px', textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 className="section-title">訂單<span>已建立</span></h2>
          <p style={{ color: 'var(--color-cream-muted)', marginBottom: '24px' }}>
            感謝您的購買！您的訂單已成功建立，以下是訂單資訊：
          </p>

          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--color-cream-faint)' }}>訂單編號:</span>
              <strong style={{ color: 'var(--color-gold)' }}>{createdOrder.order_no}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-cream-faint)' }}>應付總額:</span>
              <strong style={{ color: 'var(--color-gold)' }}>NT$ {Math.round(createdOrder.total)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <Link to={`/payment/${createdOrder.order_no}`} className="btn btn--primary" style={{ width: '100%', maxWidth: '280px' }}>
              💳 立即前往模擬付款 ➔
            </Link>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/profile/orders" className="btn btn--outline btn--sm">
                查看訂單記錄
              </Link>
              <Link to="/" className="btn btn--outline btn--sm">
                返回首頁
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

            <div className="checkout__form-row checkout__form-row--full" style={{ marginBottom: '20px' }}>
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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-cream)',
                    resize: 'vertical',
                  }}
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
                  <h4 className="checkout__summary-item-name">{item.product_name}</h4>
                  <div className="checkout__summary-item-meta">
                    {item.color} / {item.size} × {item.quantity}
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
            <div style={{ fontSize: '13px', color: 'var(--color-success)', marginBottom: '16px' }}>
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
              <div className="checkout__summary-row checkout__summary-row--discount" style={{ color: 'var(--color-gold)' }}>
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
            className="btn btn--primary btn--full btn--lg"
            onClick={handleSubmit}
            disabled={loading || !cart.items || cart.items.length === 0}
            style={{ marginTop: '16px' }}
          >
            {loading ? t('checkout.processing') : t('checkout.submit_order')}
          </button>
        </div>
      </div>
    </main>
  )
}
