import { useEffect, useState } from 'react'
import api from '../../api/api'

export default function AdminCouponsPage() {
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

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await api.put(`/api/admin/coupons/${id}/toggle`)
      if (res.data.success) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: res.data.data.is_active } : c))
      }
    } catch (err) {
      alert('切換開關失敗')
    }
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`確定要刪除折價券 [${code}] 嗎？`)) return
    try {
      const res = await api.delete(`/api/admin/coupons/${id}`)
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      alert('刪除失敗')
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
          alert('折價券已成功更新！')
          setModalOpen(false)
          fetchCoupons()
        }
      } else {
        const res = await api.post('/api/admin/coupons', formData)
        if (res.data.success) {
          alert('折價券新增成功！')
          setModalOpen(false)
          fetchCoupons()
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || '儲存失敗，請檢查輸入內容')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-coupons">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">折價券管理 (Coupon Promotions)</h1>
          <p className="subtitle">建立與管理全站促銷優惠碼、設定折扣金額、滿額門檻與使用次數上限</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          + 新增折價券
        </button>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <div style={{ color: 'var(--color-cream-muted)', textAlign: 'center', padding: '60px 0' }}>
            載入折價券清單中...
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ color: 'var(--color-cream-faint)', textAlign: 'center', padding: '60px 0' }}>
            目前尚無任何折價券資料，點擊上方按鈕立即建立。
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>優惠碼 Code</th>
                  <th>折扣類型 / 數值</th>
                  <th>最低消費門檻</th>
                  <th>使用次數 / 上限</th>
                  <th>到期時間</th>
                  <th>啟用狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--color-gold)', fontWeight: 'bold', fontSize: '15px' }}>
                      {coupon.code}
                    </td>
                    <td style={{ color: 'var(--color-cream)' }}>
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
                    <td style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('zh-TW') : '無效期限制'}
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(coupon.is_active)}
                          onChange={() => handleToggleActive(coupon.id, coupon.is_active)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn--ghost"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={() => openEditModal(coupon)}
                        >
                          編輯
                        </button>
                        <button
                          className="btn btn--ghost"
                          style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--color-error)' }}
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                        >
                          刪除
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
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: 'var(--color-gold)', fontFamily: 'var(--font-heading)' }}>
                {editingCoupon ? `✏️ 編輯折價券 [${editingCoupon.code}]` : '🎟️ 新增行銷折價券'}
              </h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                  優惠代碼 (Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如: VINTAGE2026"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-gold)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '15px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                    折扣類型 *
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="percent">百分比打折 (% OFF)</option>
                    <option value="fixed">固定現折金額 (NT$)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                    折扣數值 *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder={formData.type === 'percent' ? '如 15 (代表 85 折)' : '如 200 (代表現折200)'}
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                    最低滿額消費 (NT$)
                  </label>
                  <input
                    type="number"
                    placeholder="0 表示不限門檻"
                    value={formData.min_order}
                    onChange={e => setFormData({ ...formData, min_order: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                    使用次數上限
                  </label>
                  <input
                    type="number"
                    placeholder="留空表示不限次數"
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-cream-muted)', marginBottom: '4px' }}>
                  有效截止日期
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg-dark)', color: 'var(--color-cream)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={submitting}
                >
                  {submitting ? '處理中...' : '儲存折價券'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
