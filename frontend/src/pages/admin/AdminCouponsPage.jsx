import { useEffect, useState } from 'react'
import { useTranslation } from '../../context/LanguageContext'
import api from '../../api/api'

export default function AdminCouponsPage() {
  const { t } = useTranslation()
  const [coupons, setCoupons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    min_order: '0',
    max_discount: '',
    usage_limit: '',
    starts_at: '',
    expires_at: '',
    is_active: 1,
  })

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/coupons')
      if (res.data.success) {
        setCoupons(res.data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleToggleActive = async (id) => {
    try {
      const res = await api.put(`/api/admin/coupons/${id}/toggle`)
      if (res.data.success) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: res.data.data.is_active } : c))
      }
    } catch (err) {
      alert(t('common.error'))
    }
  }

  const handleDelete = async (id, code) => {
    if (!confirm(t('admin.delete_confirm', { name: code }))) return
    try {
      const res = await api.delete(`/api/admin/coupons/${id}`)
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      alert(t('common.error'))
    }
  }

  const openAddModal = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      min_order: '0',
      max_discount: '',
      usage_limit: '',
      starts_at: '',
      expires_at: '',
      is_active: 1,
    })
    setModalOpen(true)
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value || '',
      min_order: coupon.min_order || '0',
      max_discount: coupon.max_discount || '',
      usage_limit: coupon.usage_limit || '',
      starts_at: coupon.starts_at ? coupon.starts_at.substring(0, 10) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.substring(0, 10) : '',
      is_active: coupon.is_active ? 1 : 0,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingCoupon) {
        const res = await api.put(`/api/admin/coupons/${editingCoupon.id}`, formData)
        if (res.data.success) {
          setModalOpen(false)
          fetchCoupons()
        }
      } else {
        const res = await api.post('/api/admin/coupons', formData)
        if (res.data.success) {
          setModalOpen(false)
          fetchCoupons()
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-coupons">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">{t('admin.coupons_title')}</h1>
          <p className="subtitle">{t('admin.coupons_subtitle')}</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          {t('admin.btn_add_coupon')}
        </button>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <div className="admin-loading">
            {t('admin.loading')}
          </div>
        ) : coupons.length === 0 ? (
          <div className="admin-empty">
            {t('admin.empty')}
          </div>
        ) : (
          <div className="admin-table-wrapper table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.col_coupon_code')}</th>
                  <th>{t('admin.col_discount')}</th>
                  <th>{t('admin.col_threshold')}</th>
                  <th>{t('admin.col_times_used')}</th>
                  <th>{t('admin.col_expiry')}</th>
                  <th>{t('admin.col_is_active')}</th>
                  <th>{t('admin.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="admin-td-code">
                      {coupon.code}
                    </td>
                    <td>
                      {coupon.type === 'percent' ? (
                        <span>{coupon.value} % OFF {coupon.max_discount ? `(最高折 NT$ ${coupon.max_discount})` : ''}</span>
                      ) : (
                        <span>立減 NT$ {Math.round(coupon.value).toLocaleString()}</span>
                      )}
                    </td>
                    <td>NT$ {Math.round(coupon.min_order).toLocaleString()}</td>
                    <td>
                      {coupon.used_count} / {coupon.usage_limit ? coupon.usage_limit : '無上限'}
                    </td>
                    <td className="admin-td-muted">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '無效期限制'}
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(coupon.is_active)}
                          onChange={() => handleToggleActive(coupon.id)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="admin-td-actions">
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEditModal(coupon)}
                        >
                          {t('admin.btn_edit')}
                        </button>
                        <button
                          className="btn btn--ghost btn--sm admin-td-danger"
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                        >
                          {t('admin.btn_delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新增 / 編輯 Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content admin-modal__box admin-modal__box--sm" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>
                {editingCoupon ? `${t('admin.btn_edit')} [${editingCoupon.code}]` : t('admin.modal_add_coupon')}
              </h3>
              <button className="admin-modal__close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-modal__form">
              <div className="admin-modal__field admin-modal__field--code">
                <label>
                  {t('admin.label_code')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VINTAGE2026"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="admin-modal__grid-2">
                <div className="admin-modal__field">
                  <label>
                    {t('admin.col_discount')} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percent">百分比打折 (% OFF)</option>
                    <option value="fixed">固定現折金額 (NT$)</option>
                  </select>
                </div>

                <div className="admin-modal__field">
                  <label>
                    {t('admin.label_discount_amount')} *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder={formData.type === 'percent' ? '15' : '200'}
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal__grid-2">
                <div className="admin-modal__field">
                  <label>
                    {t('admin.label_min_order')}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.min_order}
                    onChange={e => setFormData({ ...formData, min_order: e.target.value })}
                  />
                </div>

                <div className="admin-modal__field">
                  <label>
                    {t('admin.label_max_uses')}
                  </label>
                  <input
                    type="number"
                    placeholder="無上限"
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal__field">
                <label>
                  {t('admin.label_expires_at')}
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setModalOpen(false)}
                >
                  {t('orders.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  {submitting ? t('admin.saving') : t('admin.btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
