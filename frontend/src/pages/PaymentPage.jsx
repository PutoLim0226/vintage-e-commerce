import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function PaymentPage() {
  const { order_no } = useParams()
  const navigate     = useNavigate()
  const { t }        = useTranslation()

  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // 信用卡卡片狀態
  const [cardNo, setCardNo]       = useState(['', '', '', ''])
  const [cardName, setCardName]   = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc]     = useState('')
  const [isFlipped, setIsFlipped] = useState(false)

  // 交易流程狀態: 'idle' | 'processing' | 'success'
  const [payStatus, setPayStatus] = useState('idle')

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { data } = await api.get(`/api/orders/${order_no}`)
        if (data.success) {
          setOrder(data.data)
          if (data.data.status !== 'pending') {
            alert(t('payment.already_paid_alert'))
            navigate('/profile/orders')
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || t('payment.order_load_failed'))
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [order_no, navigate, t])

  const handleCardNoChange = (index, val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    const newNo = [...cardNo]
    newNo[index] = clean
    setCardNo(newNo)

    // 自動跳格
    if (clean.length === 4 && index < 3) {
      document.getElementById(`card-${index + 1}`)?.focus()
    }
  }

  const handlePaySubmit = async (e) => {
    e.preventDefault()
    // 簡單驗證
    if (cardNo.join('').length !== 16 || !cardName.trim() || cardExpiry.length < 4 || cardCvc.length !== 3) {
      return alert(t('payment.card_info_required'))
    }

    setPayStatus('processing')

    // 模擬安全校驗動畫 2 秒
    setTimeout(async () => {
      try {
        // 呼叫 Webhook API 模擬金流商異步扣款對帳成功
        await api.post('/api/webhook/payment', {
          order_no: order_no,
          Status: 'SUCCESS',
          MerchantOrderNo: order_no
        })

        setPayStatus('success')
      } catch (err) {
        console.error(err)
        alert(t('payment.gateway_failed'))
        setPayStatus('idle')
      }
    }, 2200)
  }

  if (loading) {
    return (
      <div className="payment-page__loading">
        {t('payment.connecting')}
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="payment-page__error-card">
        <h3>{error || t('payment.order_not_found')}</h3>
        <button onClick={() => navigate('/profile/orders')} className="btn btn--outline">
          {t('payment.view_orders')}
        </button>
      </div>
    )
  }

  return (
    <main className="container section payment-page">
      {payStatus === 'success' ? (
        <div className="payment-page__success-card">
          <div className="payment-page__success-card-icon">💳</div>
          <h2 className="payment-page__success-card-title">
            {t('payment.success_title')}
          </h2>
          <p className="payment-page__success-card-desc">
            {t('payment.success_desc')}
          </p>
          <button onClick={() => navigate('/profile/orders')} className="btn btn--primary btn--full">
            {t('payment.view_orders')}
          </button>
        </div>
      ) : (
        <div className="payment-page__box">
          {/* Header */}
          <div className="payment-page__header">
            <span className="payment-page__header-badge">
              {t('payment.sandbox_badge')}
            </span>
            <h2 className="payment-page__header-title">
              {t('payment.sandbox_title')}
            </h2>
            <div className="payment-page__header-meta">
              <span>{t('payment.order_label')}: {order.order_no}</span>
              <strong>NT$ {Math.round(order.total).toLocaleString()}</strong>
            </div>
          </div>

          {/* Processing overlay */}
          {payStatus === 'processing' ? (
            <div className="payment-page__processing">
              <div className="payment-page__processing-spinner" />
              <div className="payment-page__processing-text">
                {t('payment.authorizing')}
              </div>
              <div className="payment-page__processing-subtext">
                {t('payment.webhook_hint')}
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaySubmit} className="payment-page__form">
              {/* Dynamic Card Display */}
              <div className="card-preview">
                <div className={`card-preview__inner ${isFlipped ? 'card-preview__inner--flipped' : ''}`}>
                  {/* Front Side */}
                  <div className="card-preview__face">
                    <div className="card-preview__top">
                      <span className="card-preview__badge">VINTAGE CARD</span>
                      <div className="card-preview__chip" />
                    </div>
                    <div className="card-preview__number">
                      {cardNo.map((n) => n.padEnd(4, '•')).join(' ')}
                    </div>
                    <div className="card-preview__bottom">
                      <div>
                        <div className="card-preview__label">HOLDER</div>
                        <div className="card-preview__val">{cardName || 'CARDHOLDER NAME'}</div>
                      </div>
                      <div>
                        <div className="card-preview__label">EXPIRES</div>
                        <div className="card-preview__val">{cardExpiry ? `${cardExpiry.slice(0, 2)}/${cardExpiry.slice(2, 4)}` : 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="card-preview__face card-preview__face--back">
                    <div className="card-preview__stripe" />
                    <div className="card-preview__cvc-row">
                      <span className="card-preview__label">CVC</span>
                      <div className="card-preview__cvc-box">
                        {cardCvc || '•••'}
                      </div>
                    </div>
                    <div className="card-preview__disclaimer">
                      {t('payment.sandbox_notice')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="payment-page__field">
                <label>{t('payment.card_number_label')}</label>
                <div className="payment-page__card-numbers">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      id={`card-${idx}`}
                      type="text"
                      maxLength="4"
                      placeholder="••••"
                      value={cardNo[idx]}
                      onChange={(e) => handleCardNoChange(idx, e.target.value)}
                      onFocus={() => setIsFlipped(false)}
                    />
                  ))}
                </div>
              </div>

              <div className="payment-page__field">
                <label>{t('payment.cardholder_name_label')}</label>
                <input
                  type="text"
                  placeholder={t('payment.cardholder_placeholder')}
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  onFocus={() => setIsFlipped(false)}
                />
              </div>

              <div className="payment-page__row">
                <div className="payment-page__field">
                  <label>{t('payment.card_expiry_label')}</label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="1228"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setIsFlipped(false)}
                  />
                </div>
                <div className="payment-page__field">
                  <label>{t('payment.card_cvc_label')}</label>
                  <input
                    type="text"
                    maxLength="3"
                    placeholder="123"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full btn--lg payment-page__submit-btn">
                {t('payment.confirm_pay_btn', { amount: Math.round(order.total).toLocaleString() })}
              </button>
              <button type="button" onClick={() => navigate('/profile/orders')} className="btn btn--ghost btn--full payment-page__cancel-btn">
                {t('payment.cancel_return_orders')}
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  )
}
