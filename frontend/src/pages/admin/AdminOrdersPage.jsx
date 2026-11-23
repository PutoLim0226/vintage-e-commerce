import { useEffect, useState } from 'react'
import { useTranslation } from '../../context/LanguageContext'
import api from '../../api/api'

export default function AdminOrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState('')
  const [keyword, setKeyword]               = useState('')
  const [selectedOrder, setSelectedOrder]   = useState(null)
  const [detailModal, setDetailModal]       = useState(false)
  const [updatingId, setUpdatingId]         = useState(null)

  // 出貨與狀態更新 Modal 表單 state
  const [editStatus, setEditStatus]           = useState('')
  const [shippingCarrier, setShippingCarrier] = useState('black_cat')
  const [trackingNumber, setTrackingNumber]   = useState('')

  const statusMap = {
    pending:   { label: t('admin.status_label_pending', '待付款'), badgeClass: 'badge-pending' },
    paid:      { label: t('admin.status_label_paid', '已付款'), badgeClass: 'badge-paid' },
    processing:{ label: t('admin.status_label_processing', '備貨中'), badgeClass: 'badge-processing' },
    shipped:   { label: t('admin.status_label_shipped', '出貨中'), badgeClass: 'badge-shipped' },
    completed: { label: t('admin.status_label_completed', '已完成'), badgeClass: 'badge-completed' },
    cancelled: { label: t('admin.status_label_cancelled', '已取消'), badgeClass: 'badge-cancelled' },
  }

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
      alert(t('admin.order_load_failed', '無法取得訂單細節'))
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
        alert(data.message || t('admin.status_update_success', '訂單狀態與出貨資訊已更新'))
        setDetailModal(false)
        fetchOrders()
      }
    } catch (err) {
      alert(err.response?.data?.message || t('orders.update_failed', '更新失敗'))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="admin-orders">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">{t('admin.orders_title', '訂單與出貨管理')}</h1>
          <p className="subtitle">{t('admin.orders_subtitle', '即時檢視顧客訂單、明細核對、發貨物流單號更新與退換貨處理')}</p>
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
              {t('admin.tab_all', '全部訂單')}
            </button>
            {Object.keys(statusMap).map(statusKey => (
              <button
                key={statusKey}
                className={`tab-btn ${activeTab === statusKey ? 'active' : ''}`}
                onClick={() => setActiveTab(statusKey)}
              >
                {statusMap[statusKey].label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="search-box">
            <input
              type="text"
              placeholder={t('admin.search_orders_placeholder', '搜尋訂單編號 / 姓名 / Email...')}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn--ghost btn--sm">
              {t('common.search', '搜尋')}
            </button>
          </form>
        </div>

        {/* 訂單列表 Table */}
        {loading ? (
          <div className="admin-loading">
            {t('admin.loading', '載入訂單資料中...')}
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            {t('admin.empty', '尚無符合條件之訂單')}
          </div>
        ) : (
          <div className="table-responsive">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.col_order_no', '訂單編號')}</th>
                    <th>{t('admin.col_customer', '顧客名稱 / 聯絡方式')}</th>
                    <th>{t('admin.col_total', '付款總額')}</th>
                    <th>{t('admin.col_status', '當前狀態')}</th>
                    <th>{t('admin.col_shipping', '物流方式 / 單號')}</th>
                    <th>{t('admin.col_date', '下單時間')}</th>
                    <th>{t('admin.col_actions', '操作')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const statusInfo = statusMap[order.status] || { label: order.status, badgeClass: 'badge-pending' }
                    return (
                      <tr key={order.id}>
                        <td className="admin-td-code">
                          {order.order_no}
                        </td>
                        <td>
                          <div className="admin-order-user">
                            <div className="admin-order-user__name">
                              {order.ship_name || order.user_name || t('admin.guest_customer', '訪客')}
                            </div>
                            <div className="admin-order-user__sub">
                              {order.user_email || order.ship_phone}
                            </div>
                          </div>
                        </td>
                        <td className="admin-td-price">
                          NT$ {Math.round(order.total || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className={`status-badge ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="admin-order-carrier">
                            <div>
                              {order.ship_method === 'home_delivery'
                                ? t('admin.carrier_t_cat', '宅配通')
                                : t('checkout.ship_cvs', '超商取貨')}
                            </div>
                            {order.tracking_number && (
                              <div className="admin-order-carrier__tracking">
                                {order.tracking_number}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="admin-td-muted">
                          {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                        </td>
                        <td>
                          <button
                            className="order-fulfill-btn"
                            onClick={() => openOrderDetail(order.id)}
                          >
                            {t('admin.view_and_fulfill', '檢視 / 履約出貨')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 訂單明細與出貨Modal */}
      {detailModal && selectedOrder && (
        <div className="modal-backdrop" onClick={() => setDetailModal(false)}>
          <div className="modal-content admin-modal__box admin-modal__box--md" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>
                {t('admin.order_fulfillment_title', '📋 訂單履約與明細 #{{no}}', { no: selectedOrder.order_no })}
              </h3>
              <button className="admin-modal__close" onClick={() => setDetailModal(false)}>×</button>
            </div>

            <div className="admin-modal__body">
              {/* 收件資訊快照 */}
              <div className="order-recipient-card">
                <h4 className="order-recipient-card__title">
                  {t('admin.recipient_info_title', '📍 收件人資料')}
                </h4>
                <div className="order-recipient-card__content">
                  <div>
                    <strong>{t('admin.recipient_name_label', '姓名：')}</strong>
                    {selectedOrder.ship_name} ({selectedOrder.ship_phone})
                  </div>
                  <div>
                    <strong>{t('admin.recipient_address_label', '地址：')}</strong>
                    [{selectedOrder.ship_zip}] {selectedOrder.ship_city}{selectedOrder.ship_district}{selectedOrder.ship_address}
                  </div>
                  <div>
                    <strong>{t('admin.recipient_ship_method_label', '配送方式：')}</strong>
                    {selectedOrder.ship_method === 'home_delivery'
                      ? t('admin.carrier_black_cat', '黑貓宅急便')
                      : t('checkout.ship_cvs', '超商門市取貨')}
                  </div>
                </div>
              </div>

              {/* 訂單商品細項 */}
              <h4 className="order-recipient-card__title">
                {t('admin.order_items_title', '🛍️ 訂購商品清單')}
              </h4>
              <div className="order-items-list">
                {(selectedOrder.items || []).map(item => (
                  <div key={item.id} className="order-item-card">
                    <div className="order-item-card__left">
                      <div className="order-item-card__name">{item.product_name}</div>
                      <div className="order-item-card__spec">
                        {t('admin.spec_label', '規格: {{color}} / {{size}}', {
                          color: item.sku_color || '-',
                          size: item.sku_size || '-'
                        })}
                      </div>
                    </div>
                    <div className="order-item-card__right">
                      <div>NT$ {Math.round(item.unit_price).toLocaleString()} x {item.quantity}</div>
                      <div className="order-item-card__subtotal">NT$ {Math.round(item.subtotal).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 結帳明細試算 */}
              <div className="order-summary-breakdown">
                <div className="order-summary-breakdown__row">
                  <span>{t('admin.subtotal_label', '小計:')}</span>
                  <span>NT$ {Math.round(selectedOrder.subtotal || 0).toLocaleString()}</span>
                </div>
                {parseFloat(selectedOrder.discount || 0) > 0 && (
                  <div className="order-summary-breakdown__row order-summary-breakdown__row--discount">
                    <span>{t('admin.coupon_discount_label', '折價券優惠 ({{code}}):', { code: selectedOrder.coupon_code || '' })}</span>
                    <span>- NT$ {Math.round(selectedOrder.discount).toLocaleString()}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.points_discount || 0) > 0 && (
                  <div className="order-summary-breakdown__row order-summary-breakdown__row--points">
                    <span>{t('admin.points_discount_label', '會員紅利點數折抵:')}</span>
                    <span>- NT$ {Math.round(selectedOrder.points_discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="order-summary-breakdown__row order-summary-breakdown__row--total">
                  <span>{t('admin.actual_total_label', '實付總額:')}</span>
                  <span>NT$ {Math.round(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* 出貨與訂單狀態變更表單 */}
              <form onSubmit={handleUpdateStatus} className="order-fulfillment-form">
                <h4 className="order-fulfillment-form__title">
                  {t('admin.update_logistics_title', '🚚 更新訂單與物流狀態')}
                </h4>

                <div className="admin-modal__grid-2">
                  <div className="admin-modal__field">
                    <label>{t('admin.label_order_status', '訂單狀態:')}</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                    >
                      <option value="pending">{t('admin.status_label_pending', '待付款 (Pending)')}</option>
                      <option value="paid">{t('admin.status_label_paid', '已付款 (Paid)')}</option>
                      <option value="processing">{t('admin.status_label_processing', '備貨中 (Processing)')}</option>
                      <option value="shipped">{t('admin.status_label_shipped', '出貨中 (Shipped)')}</option>
                      <option value="completed">{t('admin.status_label_completed', '已完成 (Completed)')}</option>
                      <option value="cancelled">{t('admin.status_label_cancelled', '已取消 (Cancelled)')}</option>
                    </select>
                  </div>

                  <div className="admin-modal__field">
                    <label>{t('admin.label_carrier', '物流承運商:')}</label>
                    <select
                      value={shippingCarrier}
                      onChange={e => setShippingCarrier(e.target.value)}
                    >
                      <option value="black_cat">{t('admin.carrier_black_cat', '黑貓宅急便 (Black Cat)')}</option>
                      <option value="t_cat">{t('admin.carrier_t_cat', '宅配通 (T-Cat)')}</option>
                      <option value="post_office">{t('admin.carrier_post_office', '中華郵政 (Post Office)')}</option>
                      <option value="cvs_711">{t('admin.carrier_cvs_711', '7-11 物流')}</option>
                      <option value="cvs_family">{t('admin.carrier_cvs_family', '全家店到店')}</option>
                    </select>
                  </div>
                </div>

                <div className="admin-modal__field">
                  <label>{t('admin.label_tracking_no', '物流追蹤單號 (Tracking Number):')}</label>
                  <input
                    type="text"
                    placeholder={t('admin.tracking_number_placeholder', '請輸入包裹追蹤序號 (如 BC-998823)')}
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                  />
                </div>

                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setDetailModal(false)}
                  >
                    {t('admin.btn_cancel', '取消')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary btn--sm"
                    disabled={updatingId === selectedOrder.id}
                  >
                    {updatingId === selectedOrder.id
                      ? t('admin.status_saving', '儲存中...')
                      : t('admin.btn_confirm_save_status', '確認並儲存狀態')}
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
