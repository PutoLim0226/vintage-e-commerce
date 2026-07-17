import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 詳情彈窗狀態
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

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
                    <span style={{ color: 'var(--color-gold)' }}>
                      NT$ {Math.round(item.unit_price * item.quantity)}
                    </span>
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
    </main>
  )
}
