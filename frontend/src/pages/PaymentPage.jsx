import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/api'

export default function PaymentPage() {
  const { order_no } = useParams()
  const navigate     = useNavigate()

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
            alert('此訂單已完成付款！')
            navigate('/profile/orders')
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || '讀取訂單失敗')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [order_no, navigate])

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
      return alert('請填寫完整的信用卡付款資訊')
    }

    setPayStatus('processing')

    // 模擬安全校驗動畫 2 秒
    setTimeout(async () => {
      try {
        // 呼叫 Webhook API 模擬金流商異步扣款對帳成功
        const { data } = await api.post('/api/webhook/payment', {
          order_no: order_no,
          Status: 'SUCCESS',
          MerchantOrderNo: order_no
        })

        setPayStatus('success')
      } catch (err) {
        console.error(err)
        alert('金流介接失敗，請稍後再試')
        setPayStatus('idle')
      }
    }, 2200)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cream-faint)' }}>
        安全金流連接中...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '80dvh', textAlign: 'center', paddingBlock: '80px', color: 'var(--color-error)' }}>
        <h3>{error || '訂單不存在'}</h3>
        <button onClick={() => navigate('/profile/orders')} className="btn btn--outline" style={{ marginTop: '20px' }}>
          返回訂單列表
        </button>
      </div>
    )
  }

  return (
    <main className="container section" style={{ minHeight: '80dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {payStatus === 'success' ? (
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center', padding: '48px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'scaleUp 0.3s ease-out' }}>💳</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-gold)', fontSize: '28px', marginBottom: '12px' }}>
            模擬付款成功！
          </h2>
          <p style={{ color: 'var(--color-cream-muted)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
            後端金流 Webhook 已對帳成功，訂單狀態已同步更新。
          </p>
          <button onClick={() => navigate('/profile/orders')} className="btn btn--primary btn--full">
            返回訂單歷史記錄
          </button>
        </div>
      ) : (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(25,18,12,0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              SECURE SANDBOX GATEWAY
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--color-cream)', marginTop: '4px' }}>
              金流支付測試
            </h2>
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-cream-faint)' }}>訂單: {order.order_no}</span>
              <strong style={{ color: 'var(--color-gold)' }}>NT$ {Math.round(order.total).toLocaleString()}</strong>
            </div>
          </div>

          {/* Processing overlay */}
          {payStatus === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', color: 'var(--color-cream)' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-gold)' }}>
                安全交易授權中...
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-cream-faint)', marginTop: '6px' }}>
                正在發送 Webhook 模擬信號至後端
              </div>
            </div>
          ) : (
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Dynamic Card Display */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '180px',
                perspective: '1000px',
                marginBottom: '16px'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #a17c4f 0%, #684a2c 100%)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                  padding: '20px',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Front Side */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', letterSpacing: '0.1em', opacity: 0.8 }}>VINTAGE CARD</span>
                      <div style={{ width: '40px', height: '28px', background: '#e5c080', borderRadius: '4px', opacity: 0.3 }} /> {/* Chip */}
                    </div>
                    <div style={{ fontSize: '18px', letterSpacing: '0.15em', fontFamily: 'monospace', textAlign: 'center', marginBlock: '10px' }}>
                      {cardNo.map((n) => n.padEnd(4, '•')).join(' ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div>
                        <div style={{ fontSize: '9px', opacity: 0.6 }}>HOLDER</div>
                        <div style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>{cardName || 'CARDHOLDER NAME'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', opacity: 0.6 }}>EXPIRES</div>
                        <div style={{ fontFamily: 'monospace' }}>{cardExpiry ? `${cardExpiry.slice(0, 2)}/${cardExpiry.slice(2, 4)}` : 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ background: '#000', height: '36px', width: '112%', marginLeft: '-24px', marginTop: '10px' }} /> {/* Mag stripe */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '8px', opacity: 0.6, marginRight: '8px' }}>CVC</span>
                      <div style={{ background: '#fff', color: '#000', padding: '4px 10px', borderRadius: '3px', fontFamily: 'monospace', fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                        {cardCvc || '•••'}
                      </div>
                    </div>
                    <div style={{ fontSize: '8px', opacity: 0.4, textAlign: 'center' }}>
                      Sandbox test card only. Do not enter real credit card.
                    </div>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>卡片號碼 (Card Number)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
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
                      style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)', textAlign: 'center', fontSize: '15px' }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>持卡人姓名 (Cardholder Name)</label>
                <input
                  type="text"
                  placeholder="請輸入英文姓名"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  onFocus={() => setIsFlipped(false)}
                  style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>到期日 (MMYY)</label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="如: 1228"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setIsFlipped(false)}
                    style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>安全碼 (CVC)</label>
                  <input
                    type="text"
                    maxLength="3"
                    placeholder="123"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                    style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn--primary btn--full btn--lg" style={{ marginTop: '16px' }}>
                確認模擬付款 (NT$ {Math.round(order.total).toLocaleString()})
              </button>
              <button type="button" onClick={() => navigate('/profile/orders')} className="btn btn--ghost btn--full" style={{ marginTop: '4px' }}>
                取消返回訂單列表
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  )
}
