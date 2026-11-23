import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../context/LanguageContext'
import api from '../api/api'

export default function OrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // 詳情彈窗狀態
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [, setModalLoading] = useState(false)

  // 評價彈窗狀態
  const [reviewingItem, setReviewingItem] = useState(null)
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
      alert(err.response?.data?.message || t('orders.load_detail_failed'))
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
        alert(data.message || t('orders.review_success'))
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
      alert(err.response?.data?.message || t('orders.review_failed'))
    } finally {
      setSubmittingReview(false)
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':   return { text: t('orders.status_pending'), class: 'badge--new' }
      case 'paid':      return { text: t('orders.status_paid'), class: 'badge--gold' }
      case 'processing':return { text: t('orders.status_processing'), class: 'badge--gold' }
      case 'shipped':   return { text: t('orders.status_shipped'), class: 'badge--gold' }
      case 'delivered': return { text: t('orders.status_delivered'), class: 'badge--new' }
      case 'cancelled': return { text: t('orders.status_cancelled'), class: 'badge--sale' }
      case 'refunded':  return { text: t('orders.status_refunded'), class: 'badge--sale' }
      default:          return { text: status, class: 'badge--ghost' }
    }
  }

  const getShipMethodLabel = (method) => {
    switch (method) {
      case 'home_delivery': return t('orders.ship_home')
      case 'cvs_711':        return t('orders.ship_711')
      case 'cvs_family':     return t('orders.ship_family')
      default:               return method
    }
  }

  return (
    <main className="container section orders-page">
      <div className="breadcrumb">
        <span className="breadcrumb__item"><Link to="/">{t('product_detail.breadcrumb_home')}</Link></span>
        <span className="breadcrumb__item">{t('orders.member_center')}</span>
      </div>

      <div className="layout-sidebar">
        {/* Sidebar Nav */}
        <aside className="orders-page__sidebar">
          <h3 className="orders-page__sidebar-title">
            {t('orders.member_features')}
          </h3>
          <ul className="orders-page__sidebar-list">
            <li>
              <Link to="/profile" className="btn--text">
                {t('orders.nav_profile')}
              </Link>
            </li>
            <li>
              <Link to="/profile/orders" className="btn--text active">
                {t('orders.nav_orders')}
              </Link>
            </li>
          </ul>
        </aside>

        {/* Main Orders List */}
        <div className="orders-page__main">
          <h3>{t('orders.title')}</h3>

          {loading ? (
            <p className="orders-page__loading">
              {t('orders.loading_orders')}
            </p>
          ) : orders.length === 0 ? (
            <div className="orders-page__empty">
              <p>{t('orders.no_orders')}</p>
              <Link to="/products" className="btn btn--outline btn--sm">
                {t('orders.go_shopping')}
              </Link>
            </div>
          ) : (
            <div className="orders-page__table-wrap">
              <table className="orders-page__table">
                <thead>
                  <tr>
                    <th>{t('orders.col_order_no')}</th>
                    <th>{t('orders.col_order_date')}</th>
                    <th>{t('orders.col_total')}</th>
                    <th>{t('orders.col_status')}</th>
                    <th className="orders-page__table th--right">{t('orders.col_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const statusObj = getStatusLabel(ord.status)
                    return (
                      <tr key={ord.id}>
                        <td className="orders-page__table td--no">
                          {ord.order_no}
                        </td>
                        <td className="orders-page__table td--date">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                        <td className="orders-page__table td--total">
                          NT$ {Math.round(ord.total)}
                        </td>
                        <td>
                          <span className={`badge ${statusObj.class}`}>{statusObj.text}</span>
                        </td>
                        <td className="orders-page__table td--actions">
                          {ord.status === 'pending' && (
                            <Link
                              to={`/payment/${ord.order_no}`}
                              className="btn btn--sm btn--primary"
                            >
                              {t('orders.btn_pay')}
                            </Link>
                          )}
                          <button
                            type="button"
                            className="btn btn--sm btn--ghost"
                            onClick={() => handleViewDetails(ord.order_no)}
                          >
                            {t('orders.btn_view')}
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
            <div className="modal__box order-detail-modal__box">
              <div className="modal__header">
                <h2 className="modal__title">{t('orders.detail_title')}</h2>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </button>
              </div>

              <div className="order-detail-modal__meta">
                <div className="order-detail-modal__meta-row">
                  <span>{t('orders.order_no_label')}</span>
                  <strong>{selectedOrder.order_no}</strong>
                </div>
                <div className="order-detail-modal__meta-row">
                  <span>{t('orders.created_date')}</span>
                  <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="order-detail-modal__meta-row">
                  <span>{t('orders.delivery_status')}</span>
                  <span className={`badge ${getStatusLabel(selectedOrder.status).class}`}>
                    {getStatusLabel(selectedOrder.status).text}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <h4 className="order-detail-modal__section-title">{t('orders.items_list')}</h4>
              <div className="order-detail-modal__items-list">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="order-detail-modal__item">
                    <div className="order-detail-modal__item-info">
                      <div className="order-detail-modal__item-name">{t(`products_name.${item.slug}`, item.product_name)}</div>
                      <div className="order-detail-modal__item-spec">
                        {t('orders.spec_format', {
                          color: item.sku_color ? t(`colors.${item.sku_color}`, item.sku_color) : t('orders.default_spec'),
                          size: item.sku_size || t('orders.default_spec'),
                          qty: item.quantity
                        })}
                      </div>
                    </div>
                    <div className="order-detail-modal__item-right">
                      <span className="order-detail-modal__item-price">
                        NT$ {Math.round(item.unit_price * item.quantity)}
                      </span>
                      {['paid', 'processing', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                        parseInt(item.has_review) > 0 ? (
                          <span className="order-detail-modal__item-reviewed">
                            {t('orders.reviewed')}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--sm btn--outline"
                            onClick={() => setReviewingItem(item)}
                          >
                            {t('orders.btn_review')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <h4 className="order-detail-modal__section-title">{t('orders.shipping_info')}</h4>
              <div className="order-detail-modal__delivery-info">
                <div><strong>{t('orders.recipient_name')}:</strong> {selectedOrder.ship_name}</div>
                <div><strong>{t('orders.recipient_phone')}:</strong> {selectedOrder.ship_phone}</div>
                <div><strong>{t('orders.ship_method')}:</strong> {getShipMethodLabel(selectedOrder.ship_method)}</div>
                <div><strong>{t('orders.detail_address')}:</strong> {selectedOrder.ship_zip} {selectedOrder.ship_city}{selectedOrder.ship_district}{selectedOrder.ship_address}</div>
                {selectedOrder.notes && <div><strong>{t('orders.notes')}:</strong> {selectedOrder.notes}</div>}
              </div>

              {/* Summary Rows */}
              <div className="order-detail-modal__summary">
                <div className="order-detail-modal__summary-row">
                  <span>{t('orders.subtotal')}</span>
                  <span>NT$ {Math.round(selectedOrder.subtotal)}</span>
                </div>
                <div className="order-detail-modal__summary-row">
                  <span>{t('orders.shipping_fee')}</span>
                  <span>NT$ {Math.round(selectedOrder.shipping_fee)}</span>
                </div>
                {parseFloat(selectedOrder.discount) > 0 && (
                  <div className="order-detail-modal__summary-row order-detail-modal__summary-row--discount">
                    <span>{t('orders.coupon_discount')}</span>
                    <span>- NT$ {Math.round(selectedOrder.discount)}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.points_discount) > 0 && (
                  <div className="order-detail-modal__summary-row order-detail-modal__summary-row--discount">
                    <span>{t('orders.points_discount')}</span>
                    <span>- NT$ {Math.round(selectedOrder.points_discount)}</span>
                  </div>
                )}
                <div className="order-detail-modal__summary-row order-detail-modal__summary-row--total">
                  <span>{t('orders.final_total')}</span>
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
          <div className="overlay order-review-modal__overlay" onClick={() => setReviewingItem(null)} />
          <div className="modal order-review-modal__container">
            <div className="modal__box order-review-modal__box">
              <div className="modal__header order-review-modal__header">
                <h3 className="modal__title">{t('orders.write_review_title')}</h3>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => setReviewingItem(null)}
                >
                  ×
                </button>
              </div>

              <div className="order-review-modal__product-hint">
                {t('orders.reviewing_product')}<strong>{reviewingItem.product_name}</strong>
              </div>

              <form onSubmit={handleSubmitReview}>
                {/* Stars Selector */}
                <div className="order-review-modal__group">
                  <label>{t('orders.rating_label')}</label>
                  <div className="order-review-modal__stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`order-review-modal__star-btn ${star <= reviewRating ? 'order-review-modal__star-btn--active' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Area */}
                <div className="order-review-modal__group">
                  <label htmlFor="reviewComment">{t('orders.comment_label')}</label>
                  <textarea
                    id="reviewComment"
                    rows="4"
                    placeholder={t('orders.comment_placeholder')}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={submittingReview}
                    className="order-review-modal__textarea"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="order-review-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setReviewingItem(null)}
                    disabled={submittingReview}
                  >
                    {t('orders.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submittingReview}
                  >
                    {submittingReview ? t('orders.submitting') : t('orders.submit_review')}
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
