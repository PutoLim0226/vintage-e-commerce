import { useEffect, useState } from 'react'
import api from '../../api/api'

const STATUS_MAP = {
  pending:   { label: '待付款', badgeClass: 'badge-pending' },
  paid:      { label: '已付款', badgeClass: 'badge-paid' },
  processing:{ label: '備貨中', badgeClass: 'badge-processing' },
  shipped:   { label: '出貨中', badgeClass: 'badge-shipped' },
  completed: { label: '已完成', badgeClass: 'badge-completed' },
  cancelled: { label: '已取消', badgeClass: 'badge-cancelled' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('')
  const [keyword, setKeyword]       = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // 出貨與狀態更新 Modal 表單 state
  const [editStatus, setEditStatus]           = useState('')
  const [shippingCarrier, setShippingCarrier] = useState('black_cat')
  const [trackingNumber, setTrackingNumber]   = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/orders?status=${activeTab}`
      if (keyword.trim()) {
        url += `&keyword=${encodeURIComponent(keyword.trim())}`
      }
      const { data } = await api.get(url)
      if (data.success) {
        setOrders(data.data.orders || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchOrders()
  }

  const openOrderDetail = async (orderId) => {
    try {
      const { data } = await api.get(`/api/admin/orders/${orderId}`)
      if (data.success) {
        setSelectedOrder(data.data)
        setEditStatus(data.data.status)
        setShippingCarrier(data.data.shipping_carrier || 'black_cat')
        setTrackingNumber(data.data.tracking_number || '')
        setDetailModal(true)
      }
    } catch (err) {
      alert('無法取得訂單細節')
    }
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    setUpdatingId(selectedOrder.id)
    try {
      const { data } = await api.put(`/api/admin/orders/${selectedOrder.id}`, {
        status: editStatus,
        shipping_carrier: shippingCarrier,
        tracking_number: trackingNumber,
      })

      if (data.success) {
        alert(data.message || '訂單狀態與出貨資訊已更新')
        setDetailModal(false)
        fetchOrders()
      }
    } catch (err) {
      alert(err.response?.data?.message || '更新失敗')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="admin-orders">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">訂單與出貨管理 (Order Fulfillment)</h1>
          <p className="subtitle">即時檢視顧客訂單、明細核對、發貨物流單號更新與退換貨處理</p>
        </div>
      </div>

      <div className="admin-table-card">
        {/* 工具列：篩選頁籤 + 關鍵字搜尋 */}
        <div className="table-toolbar">
          <div className="filter-tabs">
            <button
              className={`tab-btn ${activeTab === '' ? 'active' : ''}`}
              onClick={() => setActiveTab('')}
            >
              全部訂單
            </button>
            {Object.keys(STATUS_MAP).map(statusKey => (
              <button
                key={statusKey}
                className={`tab-btn ${activeTab === statusKey ? 'active' : ''}`}
                onClick={() => setActiveTab(statusKey)}
              >
                {STATUS_MAP[statusKey].label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="search-box">
            <input
              type="text"
              placeholder="搜尋訂單編號 / 姓名 / Email..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn--ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>
              搜尋
            </button>
          </form>
        </div>

        {/* 訂單列表 Table */}
        {loading ? (
          <div style={{ color: 'var(--color-cream-muted)', textAlign: 'center', padding: '60px 0' }}>
            載入訂單資料中...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ color: 'var(--color-cream-faint)', textAlign: 'center', padding: '60px 0' }}>
            尚無符合條件之訂單
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>訂單編號</th>
                  <th>顧客名稱 / 聯絡方式</th>
                  <th>付款總額</th>
                  <th>當前狀態</th>
                  <th>物流方式 / 單號</th>
                  <th>下單時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, badgeClass: 'badge-pending' }
                  return (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-gold-light)', fontWeight: 'bold' }}>
                        {order.order_no}
                      </td>
                      <td>
                        <div style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{order.ship_name || order.user_name || '訪客'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-cream-faint)' }}>{order.user_email || order.ship_phone}</div>
                      </td>
                      <td style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>
                        NT$ {Math.round(order.total || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-badge ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{order.ship_method === 'home_delivery' ? '宅配通' : '超商取貨'}</div>
                        {order.tracking_number && (
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-cream-muted)' }}>
                            {order.tracking_number}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleString('zh-TW') : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn--secondary"
                          style={{
                            fontSize: '12px',
                            padding: '6px 12px',
                            color: '#f3e5ab',
                            backgroundColor: 'rgba(200, 169, 110, 0.25)',
                            borderColor: '#c8a96e',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={() => openOrderDetail(order.id)}
                        >
                          檢視 / 履約出貨
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

      {/* 訂單明細與出貨Modal */}
      {detailModal && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--color-gold)', fontFamily: 'var(--font-heading)' }}>
                📋 訂單履約與明細 #{selectedOrder.order_no}
              </h3>
              <button className="modal-close" onClick={() => setDetailModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '20px 0' }}>
              {/* 收件資訊快照 */}
              <div style={{ background: 'var(--color-bg-surface)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--color-cream)', marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>
                  📍 收件人資料
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--color-cream-muted)', lineHeight: '1.6' }}>
                  <div><strong>姓名：</strong>{selectedOrder.ship_name} ({selectedOrder.ship_phone})</div>
                  <div><strong>地址：</strong>[{selectedOrder.ship_zip}] {selectedOrder.ship_city}{selectedOrder.ship_district}{selectedOrder.ship_address}</div>
                  <div><strong>配送方式：</strong>{selectedOrder.ship_method === 'home_delivery' ? '黑貓宅配到府' : '超商門市取貨'}</div>
                </div>
              </div>

              {/* 訂單商品細項 */}
              <h4 style={{ color: 'var(--color-cream)', marginBottom: '12px', fontSize: '14px' }}>
                🛍️ 訂購商品清單
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {(selectedOrder.items || []).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg-card)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{item.product_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-cream-faint)' }}>規格: {item.sku_color || '-'} / {item.sku_size || '-'}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px' }}>
                      <div>NT$ {Math.round(item.unit_price).toLocaleString()} x {item.quantity}</div>
                      <div style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>NT$ {Math.round(item.subtotal).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 結帳明細試算 */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-cream-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>小計:</span> <span>NT$ {Math.round(selectedOrder.subtotal || 0).toLocaleString()}</span>
                </div>
                {parseFloat(selectedOrder.discount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-gold)' }}>
                    <span>折價券優惠 ({selectedOrder.coupon_code || ''}):</span> <span>- NT$ {Math.round(selectedOrder.discount).toLocaleString()}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.points_discount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                    <span>會員紅利點數折抵:</span> <span>- NT$ {Math.round(selectedOrder.points_discount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', color: 'var(--color-gold-light)', marginTop: '8px' }}>
                  <span>實付總額:</span> <span>NT$ {Math.round(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* 出貨與訂單狀態變更表單 */}
              <form onSubmit={handleUpdateStatus} style={{ background: 'rgba(200, 169, 110, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ color: 'var(--color-gold)', marginTop: 0, marginBottom: '12px', fontSize: '14px' }}>
                  🚚 更新訂單與物流狀態
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                      訂單狀態:
                    </label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="pending">待付款 (Pending)</option>
                      <option value="paid">已付款 (Paid)</option>
                      <option value="processing">備貨中 (Processing)</option>
                      <option value="shipped">出貨中 (Shipped)</option>
                      <option value="completed">已完成 (Completed)</option>
                      <option value="cancelled">已取消 (Cancelled - 自動退庫存與點數)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                      物流承運商:
                    </label>
                    <select
                      value={shippingCarrier}
                      onChange={e => setShippingCarrier(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="black_cat">黑貓宅急便 (Black Cat)</option>
                      <option value="t_cat">宅配通 (T-Cat)</option>
                      <option value="post_office">中華郵政 (Post Office)</option>
                      <option value="cvs_711">7-11 物流</option>
                      <option value="cvs_family">全家店到店</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                    物流追蹤單號 (Tracking Number):
                  </label>
                  <input
                    type="text"
                    placeholder="請輸入包裹追蹤序號 (如 BC-998823)"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setDetailModal(false)}
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={updatingId === selectedOrder.id}
                    style={{ padding: '6px 20px', fontSize: '13px' }}
                  >
                    {updatingId === selectedOrder.id ? '儲存中...' : '確認並儲存狀態'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
