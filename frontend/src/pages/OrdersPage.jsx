import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 詳情彈窗狀態
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // 評價彈窗狀態
  const [reviewingItem, setReviewingItem] = useState(null) // 存放當前選中欲評價的商品
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const { data } = await api.get('/api/me/orders')
        if (data.success) {
          setOrders(data.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

  const handleViewDetails = async (orderNo) => {
    setModalLoading(true)
    try {
      const { data } = await api.get(`/api/orders/${orderNo}`)
      if (data.success) {
        setSelectedOrder(data.data)
      }
    } catch (err) {
      alert(err.response?.data?.message || '讀取訂單明細失敗')
    } finally {
      setModalLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewingItem || !selectedOrder) return

    setSubmittingReview(true)
    try {
      const { data } = await api.post('/api/reviews', {
        order_id: selectedOrder.id,
        product_id: reviewingItem.product_id,
        rating: reviewRating,
        comment: reviewComment
      })
      if (data.success) {
        alert(data.message || '評價提交成功！')
        // 更新當前訂單的 item 狀態為已評價
        setSelectedOrder(prev => {
          if (!prev) return null
          return {
            ...prev,
            items: prev.items.map(it => 
              it.product_id === reviewingItem.product_id ? { ...it, has_review: 1 } : it
            )
          }
        })
        setReviewingItem(null)
        setReviewComment('')
        setReviewRating(5)
      }
    } catch (err) {
      alert(err.response?.data?.message || '提交評價失敗，請稍後再試')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':   return { text: '待付款', class: 'badge--new' }
      case 'paid':      return { text: '已付款', class: 'badge--gold' }
      case 'processing':return { text: '處理中', class: 'badge--gold' }
      case 'shipped':   return { text: '已出貨', class: 'badge--gold' }
      case 'delivered': return { text: '已送達', class: 'badge--new' }
      case 'cancelled': return { text: '已取消', class: 'badge--sale' }
      case 'refunded':  return { text: '已退款', class: 'badge--sale' }
      default:          return { text: status, class: 'badge--ghost' }
    }
  }

  const getShipMethodLabel = (method) => {
    switch (method) {
      case 'home_delivery': return '黑貓宅急便 (宅配)'
      case 'cvs_711':        return '7-11 超商取貨'
      case 'cvs_family':     return '全家超商取貨'
      default:               return method
    }
  }

  return (
    <main className="container section" style={{ minHeight: '80dvh' }}>
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">首頁</Link></span>
        <span className="breadcrumb__item">會員中心</span>
      </div>

      <div className="layout-sidebar">
        {/* Sidebar Nav */}
        <aside className="checkout__form-section" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            會員功能
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>
              <Link to="/profile" className="btn--text">
                修改個人資料
              </Link>
            </li>
            <li>
              <Link to="/profile/orders" className="btn--text active" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>
                歷史訂單記錄
              </Link>
            </li>
          </ul>
        </aside>

        {/* Main Orders List */}
        <div className="checkout__form-section">
          <h3>訂單歷史記錄</h3>

          {loading ? (
            <p style={{ color: 'var(--color-cream-muted)', textAlign: 'center', paddingBlock: '32px' }}>
              載入訂單紀錄中...
            </p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', paddingBlock: '48px', color: 'var(--color-cream-faint)' }}>
              <p>您目前沒有任何訂單記錄</p>
              <Link to="/products" className="btn btn--outline btn--sm" style={{ marginTop: '16px' }}>
                前往選購
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-cream-faint)', fontSize: '14px' }}>
                    <th style={{ padding: '12px 8px' }}>訂單編號</th>
                    <th style={{ padding: '12px 8px' }}>下單日期</th>
                    <th style={{ padding: '12px 8px' }}>總金額</th>
                    <th style={{ padding: '12px 8px' }}>狀態</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const statusObj = getStatusLabel(ord.status)
                    return (
                      <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '15px' }}>
                        <td style={{ padding: '16px 8px', fontWeight: 'bold', color: 'var(--color-cream)' }}>
                          {ord.order_no}
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--color-cream-muted)' }}>
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--color-gold)' }}>
                          NT$ {Math.round(ord.total)}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <span className={`badge ${statusObj.class}`}>{statusObj.text}</span>
                        </td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            onClick={() => handleViewDetails(ord.order_no)}
                          >
                            明細
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <>
          <div className="overlay" onClick={() => setSelectedOrder(null)} />
          <div className="modal">
            <div className="modal__box" style={{ maxWidth: '640px' }}>
              <div className="modal__header">
                <h2 className="modal__title">訂單明細</h2>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-cream-faint)' }}>訂單號碼</span>
                  <strong style={{ color: 'var(--color-gold)' }}>{selectedOrder.order_no}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-cream-faint)' }}>建立日期</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-cream-faint)' }}>配送狀態</span>
                  <span className={`badge ${getStatusLabel(selectedOrder.status).class}`}>
                    {getStatusLabel(selectedOrder.status).text}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>商品清單</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', background: 'var(--color-bg-surface)', padding: '8px 12px', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-cream)' }}>{item.product_name}</div>
                      <div style={{ color: 'var(--color-cream-faint)', fontSize: '12px', marginTop: '2px' }}>
                        規格: {item.sku_color || '預設'} / {item.sku_size || '預設'} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'var(--color-gold)', whiteSpace: 'nowrap' }}>
                        NT$ {Math.round(item.unit_price * item.quantity)}
                      </span>
                      {['paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                        parseInt(item.has_review) > 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-cream-faint)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>已評價</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--sm btn--outline"
                            style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                            onClick={() => setReviewingItem(item)}
                          >
                            評價
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>收件資訊</h4>
              <div style={{ background: 'var(--color-bg-surface)', padding: '16px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-cream-muted)', marginBottom: '24px' }}>
                <div><strong>收件人姓名:</strong> {selectedOrder.ship_name}</div>
                <div><strong>收件人電話:</strong> {selectedOrder.ship_phone}</div>
                <div><strong>配送方式:</strong> {getShipMethodLabel(selectedOrder.ship_method)}</div>
                <div><strong>詳細地址:</strong> {selectedOrder.ship_zip} {selectedOrder.ship_city}{selectedOrder.ship_district}{selectedOrder.ship_address}</div>
                {selectedOrder.notes && <div><strong>備註事項:</strong> {selectedOrder.notes}</div>}
              </div>

              {/* Summary Rows */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>商品小計</span>
                  <span>NT$ {Math.round(selectedOrder.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>運費</span>
                  <span>NT$ {Math.round(selectedOrder.shipping_fee)}</span>
                </div>
                {parseFloat(selectedOrder.discount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                    <span>折價券折抵</span>
                    <span>- NT$ {Math.round(selectedOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-gold)', paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                  <span>實付總額</span>
                  <span>NT$ {Math.round(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Product Review Modal ── */}
      {reviewingItem && (
        <>
          <div className="overlay" style={{ zIndex: 1100 }} onClick={() => setReviewingItem(null)} />
          <div className="modal" style={{ zIndex: 1200 }}>
            <div className="modal__box" style={{ maxWidth: '440px', padding: '32px' }}>
              <div className="modal__header" style={{ marginBottom: '20px' }}>
                <h3 className="modal__title" style={{ fontSize: '18px' }}>撰寫商品評價</h3>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setReviewingItem(null)}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: '16px', color: 'var(--color-cream-muted)', fontSize: '14px' }}>
                評價商品：<strong style={{ color: 'var(--color-cream)' }}>{reviewingItem.product_name}</strong>
              </div>

              <form onSubmit={handleSubmitReview}>
                {/* Stars Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>商品評分 (1 - 5 星)</label>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '28px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: star <= reviewRating ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)',
                          transition: 'transform 0.15s, color 0.15s',
                          padding: 0
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  <label htmlFor="reviewComment" style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>評價內容 (選填)</label>
                  <textarea
                    id="reviewComment"
                    rows="4"
                    placeholder="分享您穿著這件單品的心得，幫助更多喜歡古著的朋友..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={submittingReview}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-cream)',
                      resize: 'none',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setReviewingItem(null)}
                    disabled={submittingReview}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submittingReview}
                    style={{ padding: '8px 24px', fontSize: '14px' }}
                  >
                    {submittingReview ? '提交中...' : '送出評價'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
