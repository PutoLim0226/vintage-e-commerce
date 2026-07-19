import { useEffect, useState } from 'react'
import api from '../../api/api'

export default function AdminProductsPage() {
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [toggling, setToggling]     = useState(null)

  // 新增/編輯 Modal 狀態
  const [showModal, setShowModal]   = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [form, setForm]             = useState({
    id: null,
    name: '',
    category_id: '',
    description: '',
    base_price: '',
    compare_price: '',
    cover_image_url: '',
    is_active: 1,
    is_featured: 0,
    skus: []
  })

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/admin/products'),
        api.get('/api/categories')
      ])
      if (prodRes.data.success) setProducts(prodRes.data.data || [])
      if (catRes.data.success) setCategories(catRes.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleToggleActive = async (product) => {
    const nextVal = product.is_active ? 0 : 1
    setToggling(product.id)
    try {
      const { data } = await api.put(`/api/admin/products/${product.id}`, {
        ...product,
        is_active: nextVal,
      })
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: nextVal } : p))
      }
    } catch (err) {
      console.error(err)
      alert('操作失敗')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`確定要刪除「${product.name}」嗎？此操作無法還原。`)) return
    try {
      const { data } = await api.delete(`/api/admin/products/${product.id}`)
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== product.id))
      }
    } catch (err) {
      console.error(err)
      alert('刪除失敗')
    }
  }

  // 開啟「新增」Modal
  const handleOpenAdd = () => {
    setForm({
      id: null,
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      base_price: 1000,
      compare_price: '',
      cover_image_url: '',
      is_active: 1,
      is_featured: 0,
      skus: [
        { sku_code: '', color: '黑', size: 'M', price: 1000, stock: 10 }
      ]
    })
    setShowModal(true)
  }

  // 開啟「編輯」Modal 并加載完整 SKU
  const handleOpenEdit = async (product) => {
    setModalLoading(true)
    setShowModal(true)
    try {
      const { data } = await api.get(`/api/admin/products/${product.id}`)
      if (data.success) {
        const prod = data.data
        setForm({
          id: prod.id,
          name: prod.name,
          category_id: prod.category_id,
          description: prod.description || '',
          base_price: Math.round(prod.base_price),
          compare_price: prod.compare_price ? Math.round(prod.compare_price) : '',
          cover_image_url: prod.cover_image_url || '',
          is_active: parseInt(prod.is_active),
          is_featured: parseInt(prod.is_featured),
          skus: prod.skus ? prod.skus.map(s => ({
            id: s.id,
            sku_code: s.sku_code,
            color: s.color || '',
            size: s.size || '',
            price: Math.round(s.price),
            stock: parseInt(s.stock)
          })) : []
        })
      }
    } catch (err) {
      console.error(err)
      alert('讀取商品詳情失敗')
      setShowModal(false)
    } finally {
      setModalLoading(false)
    }
  }

  // SKU 行動控制
  const handleAddSku = () => {
    setForm(prev => ({
      ...prev,
      skus: [...prev.skus, { sku_code: '', color: '', size: '', price: prev.base_price, stock: 10 }]
    }))
  }

  const handleRemoveSku = (index) => {
    setForm(prev => ({
      ...prev,
      skus: prev.skus.filter((_, i) => i !== index)
    }))
  }

  const handleSkuChange = (index, field, value) => {
    setForm(prev => {
      const newSkus = [...prev.skus]
      newSkus[index][field] = value
      return { ...prev, skus: newSkus }
    })
  }

  // 提交商品表單
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('商品名稱必填')
    if (form.skus.length === 0) return alert('商品至少需要一個 SKU 規格組合')

    setModalLoading(true)
    try {
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      }

      if (form.id) {
        // 編輯更新
        const { data } = await api.put(`/api/admin/products/${form.id}`, payload)
        if (data.success) {
          alert('商品修改成功！')
          loadProducts()
          setShowModal(false)
        }
      } else {
        // 新增商品
        const { data } = await api.post('/api/admin/products', payload)
        if (data.success) {
          alert('商品新增成功！')
          loadProducts()
          setShowModal(false)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || '操作失敗，請檢查資料欄位')
    } finally {
      setModalLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/api/admin/products')
      if (data.success) setProducts(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-cream)', marginBottom: '4px' }}>
            商品管理
          </h1>
          <p style={{ color: 'var(--color-cream-faint)', fontSize: '14px' }}>
            共 {products.length} 件商品
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleOpenAdd}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          + 新增商品
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-cream-faint)', textAlign: 'center', paddingTop: '60px' }}>載入中...</div>
      ) : (
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 140px',
            gap: '12px',
            padding: '14px 24px',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-cream-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>圖片</span>
            <span>商品名稱</span>
            <span>分類</span>
            <span>售價</span>
            <span>庫存</span>
            <span>狀態</span>
            <span>操作</span>
          </div>

          {/* Rows */}
          {products.map((prod, idx) => (
            <div
              key={prod.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 140px',
                gap: '12px',
                padding: '14px 24px',
                alignItems: 'center',
                borderBottom: idx !== products.length - 1 ? '1px solid var(--color-border)' : 'none',
                transition: 'background 0.15s',
                opacity: prod.is_active ? 1 : 0.55,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Image */}
              <img
                src={prod.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=80&q=60'}
                alt={prod.name}
                style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
              />

              {/* Name */}
              <div>
                <div style={{ fontSize: '14px', color: 'var(--color-cream)', fontWeight: 500 }}>
                  {prod.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-cream-faint)', fontFamily: 'monospace' }}>
                  {prod.slug}
                </div>
              </div>

              <span style={{ fontSize: '13px', color: 'var(--color-cream-muted)' }}>
                {prod.category_name}
              </span>

              <span style={{ fontSize: '14px', color: 'var(--color-cream)', fontWeight: 600 }}>
                NT$ {Math.round(prod.base_price).toLocaleString()}
              </span>

              <span style={{
                fontSize: '14px',
                color: (prod.total_stock || 0) < 5 ? 'var(--color-error)' : 'var(--color-cream)',
              }}>
                {prod.total_stock ?? 0} 件
              </span>

              {/* Toggle Active */}
              <button
                type="button"
                disabled={toggling === prod.id}
                onClick={() => handleToggleActive(prod)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${prod.is_active ? 'var(--color-gold)' : 'var(--color-border)'}`,
                  background: prod.is_active ? 'rgba(198,160,87,0.12)' : 'transparent',
                  color: prod.is_active ? 'var(--color-gold)' : 'var(--color-cream-faint)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {toggling === prod.id ? '…' : prod.is_active ? '上架中' : '已下架'}
              </button>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(prod)}
                  style={{
                    fontSize: '12px', color: 'var(--color-gold)', background: 'none',
                    border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer',
                    padding: '4px 8px', transition: 'all 0.2s',
                  }}
                  title="編輯商品"
                >
                  ✏️
                </button>
                <a
                  href={`/products/${prod.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px', color: 'var(--color-cream-faint)',
                    textDecoration: 'none', padding: '4px 8px', border: '1px solid var(--color-border)',
                    borderRadius: '4px', transition: 'color 0.2s',
                  }}
                  title="前台預覽"
                >
                  ↗
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(prod)}
                  style={{
                    fontSize: '12px', color: 'var(--color-error)', background: 'none',
                    border: '1px solid transparent', borderRadius: '4px', cursor: 'pointer',
                    padding: '4px 8px', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--color-error)'}
                  onMouseLeave={e => e.target.style.borderColor = 'transparent'}
                  title="刪除商品"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product Create/Edit Modal ── */}
      {showModal && (
        <>
          <div className="overlay" style={{ zIndex: 1100 }} onClick={() => !modalLoading && setShowModal(false)} />
          <div className="modal" style={{ zIndex: 1200 }}>
            <div className="modal__box" style={{ maxWidth: '780px', padding: '32px', maxHeight: '90dvh', overflowY: 'auto' }}>
              <div className="modal__header" style={{ marginBottom: '24px' }}>
                <h3 className="modal__title" style={{ fontSize: '20px' }}>
                  {form.id ? '✏️ 編輯商品與規格' : '＋ 新增商品'}
                </h3>
                <button
                  type="button"
                  className="modal__close"
                  onClick={() => !modalLoading && setShowModal(false)}
                  disabled={modalLoading}
                >
                  ×
                </button>
              </div>

              {modalLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-cream-faint)' }}>儲存/加載中...</div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Row 1 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>商品名稱</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="例如: 70s 經典燈芯絨夾克"
                        required
                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>所屬分類</label>
                      <select
                        value={form.category_id}
                        onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>基本售價</label>
                      <input
                        type="number"
                        value={form.base_price}
                        onChange={e => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                        required
                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>劃線原價 (選填)</label>
                      <input
                        type="number"
                        value={form.compare_price}
                        onChange={e => setForm(prev => ({ ...prev, compare_price: e.target.value }))}
                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>主圖 URL</label>
                      <input
                        type="text"
                        value={form.cover_image_url}
                        onChange={e => setForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                        placeholder="Unsplash 圖片網址或本地檔案路徑"
                        style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)' }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>商品詳情與故事</label>
                    <textarea
                      rows="3"
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="寫寫這件商品的年代、材質與背後的故事..."
                      style={{ padding: '10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-cream)', resize: 'vertical' }}
                    />
                  </div>

                  {/* SKU Section */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '15px', color: 'var(--color-cream)' }}>SKU 規格組合清單</h4>
                      <button
                        type="button"
                        onClick={handleAddSku}
                        className="btn btn--outline btn--sm"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        ＋ 新增規格組合
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {form.skus.map((sku, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr 40px',
                            gap: '10px',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.01)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px dashed rgba(255,255,255,0.08)'
                          }}
                        >
                          <input
                            type="text"
                            placeholder="顏色 (如:藍)"
                            value={sku.color}
                            onChange={e => handleSkuChange(idx, 'color', e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-cream)' }}
                          />
                          <input
                            type="text"
                            placeholder="尺寸 (如:M)"
                            value={sku.size}
                            onChange={e => handleSkuChange(idx, 'size', e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-cream)' }}
                          />
                          <input
                            type="number"
                            placeholder="售價"
                            value={sku.price}
                            onChange={e => handleSkuChange(idx, 'price', e.target.value)}
                            required
                            style={{ padding: '6px 8px', fontSize: '13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-cream)' }}
                          />
                          <input
                            type="number"
                            placeholder="庫存"
                            value={sku.stock}
                            onChange={e => handleSkuChange(idx, 'stock', e.target.value)}
                            required
                            style={{ padding: '6px 8px', fontSize: '13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-cream)' }}
                          />
                          <input
                            type="text"
                            placeholder="SKU 編碼 (選填)"
                            value={sku.sku_code}
                            onChange={e => handleSkuChange(idx, 'sku_code', e.target.value)}
                            style={{ padding: '6px 8px', fontSize: '13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-cream)', fontFamily: 'monospace' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSku(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: '16px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setShowModal(false)}
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      style={{ padding: '8px 24px', fontSize: '14px' }}
                    >
                      儲存商品
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
