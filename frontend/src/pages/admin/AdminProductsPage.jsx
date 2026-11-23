import { useEffect, useState } from 'react'
import { useTranslation } from '../../context/LanguageContext'
import api from '../../api/api'

export default function AdminProductsPage() {
  const { t } = useTranslation()
  const [products, setProducts]       = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState(null)

  // 新增/編輯 Modal 狀態
  const [showModal, setShowModal]     = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [form, setForm]               = useState({
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
      alert(t('common.error', '操作失敗'))
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(t('admin.delete_confirm', '確定要刪除「{{name}}」嗎？此操作無法還原。', { name: product.name }))) return
    try {
      const { data } = await api.delete(`/api/admin/products/${product.id}`)
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== product.id))
      }
    } catch (err) {
      console.error(err)
      alert(t('common.error', '刪除失敗'))
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
      alert(t('product_detail.load_failed', '讀取商品詳情失敗'))
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
    if (!form.name.trim()) return alert(t('admin.label_product_name', '商品名稱必填'))
    if (form.skus.length === 0) return alert(t('admin.sku_section_title', '商品至少需要一個 SKU 規格組合'))

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
          alert(t('common.success', '商品修改成功！'))
          loadProducts()
          setShowModal(false)
        }
      } else {
        // 新增商品
        const { data } = await api.post('/api/admin/products', payload)
        if (data.success) {
          alert(t('common.success', '商品新增成功！'))
          loadProducts()
          setShowModal(false)
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || t('common.error', '操作失敗，請檢查資料欄位'))
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
    <div className="admin-products">
      <div className="admin-products-header">
        <div className="admin-products-header__info">
          <h1 className="page-title">
            {t('admin.products_title', '商品管理')}
          </h1>
          <p className="page-count">
            {t('admin.product_total_count', '共 {{count}} 件商品', { count: products.length })}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleOpenAdd}
        >
          {t('admin.btn_add_product', '+ 新增商品')}
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">{t('admin.loading', '載入中...')}</div>
      ) : (
        <div className="table-responsive">
          <div className="admin-products-table">
            {/* Header */}
            <div className="admin-products-table__header">
              <span>{t('admin.col_image', '圖片')}</span>
              <span>{t('admin.col_product_name', '商品名稱')}</span>
              <span>{t('admin.col_category', '分類')}</span>
              <span>{t('admin.col_base_price', '售價')}</span>
              <span>{t('admin.col_stock', '庫存')}</span>
              <span>{t('admin.col_status', '狀態')}</span>
              <span>{t('admin.col_actions', '操作')}</span>
            </div>

            {/* Rows */}
            {products.map((prod) => (
              <div
                key={prod.id}
                className={`admin-products-table__row ${!prod.is_active ? 'admin-products-table__row--inactive' : ''}`}
              >
                {/* Image */}
                <img
                  src={prod.cover_image_url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=80&q=60'}
                  alt={prod.name}
                  className="admin-products-table__thumb"
                />

                {/* Name */}
                <div className="admin-products-table__name-cell">
                  <div className="title">
                    {prod.name}
                  </div>
                  <div className="slug">
                    {prod.slug}
                  </div>
                </div>

                <span className="admin-products-table__category">
                  {prod.category_name}
                </span>

                <span className="admin-products-table__price">
                  NT$ {Math.round(prod.base_price).toLocaleString()}
                </span>

                <span className={`admin-products-table__stock ${(prod.total_stock || 0) < 5 ? 'admin-products-table__stock--low' : ''}`}>
                  {t('admin.items_unit', '{{count}} 件', { count: prod.total_stock ?? 0 })}
                </span>

                {/* Toggle Active */}
                <div>
                  <button
                    type="button"
                    disabled={toggling === prod.id}
                    onClick={() => handleToggleActive(prod)}
                    className={`admin-products-table__toggle-btn ${prod.is_active ? 'admin-products-table__toggle-btn--active' : ''}`}
                  >
                    {toggling === prod.id ? '…' : prod.is_active ? t('admin.status_active', '上架中') : t('admin.status_inactive', '已下架')}
                  </button>
                </div>

                {/* Actions */}
                <div className="admin-td-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(prod)}
                    className="admin-products-table__action-btn admin-products-table__action-btn--edit"
                    title={t('admin.btn_edit', '編輯商品')}
                  >
                    ✏️
                  </button>
                  <a
                    href={`/products/${prod.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-products-table__action-btn admin-products-table__action-btn--view"
                    title={t('common.view', '前台預覽')}
                  >
                    ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(prod)}
                    className="admin-products-table__action-btn admin-products-table__action-btn--delete"
                    title={t('admin.btn_delete', '刪除商品')}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Product Create/Edit Modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => !modalLoading && setShowModal(false)}>
          <div className="modal-content admin-modal__box" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>
                {form.id ? t('admin.modal_edit_title', '✏️ 編輯商品與規格') : t('admin.modal_add_title', '＋ 新增商品')}
              </h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => !modalLoading && setShowModal(false)}
                disabled={modalLoading}
              >
                ×
              </button>
            </div>

            {modalLoading ? (
              <div className="admin-loading">{t('admin.saving', '儲存/加載中...')}</div>
            ) : (
              <form onSubmit={handleSubmit} className="admin-modal__form">
                {/* Row 1 */}
                <div className="admin-modal__grid-2">
                  <div className="admin-modal__field">
                    <label>{t('admin.label_product_name', '商品名稱')}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('admin.placeholder_prod_name', '例如: 70s 經典燈芯絨夾克')}
                      required
                    />
                  </div>
                  <div className="admin-modal__field">
                    <label>{t('admin.label_category', '所屬分類')}</label>
                    <select
                      value={form.category_id}
                      onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="admin-modal__grid-3">
                  <div className="admin-modal__field">
                    <label>{t('admin.label_base_price', '基本售價')}</label>
                    <input
                      type="number"
                      value={form.base_price}
                      onChange={e => setForm(prev => ({ ...prev, base_price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="admin-modal__field">
                    <label>{t('admin.label_compare_price', '劃線原價 (選填)')}</label>
                    <input
                      type="number"
                      value={form.compare_price}
                      onChange={e => setForm(prev => ({ ...prev, compare_price: e.target.value }))}
                    />
                  </div>
                  <div className="admin-modal__field">
                    <label>{t('admin.label_cover_image', '主圖 URL')}</label>
                    <input
                      type="text"
                      value={form.cover_image_url}
                      onChange={e => setForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder={t('admin.placeholder_img_url', 'Unsplash 圖片網址或本地檔案路徑')}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="admin-modal__field">
                  <label>{t('admin.label_desc', '商品詳情與故事')}</label>
                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('admin.placeholder_desc', '寫寫這件商品的年代、材質與背後的故事...')}
                  />
                </div>

                {/* SKU Section */}
                <div className="order-recipient-card">
                  <div className="admin-page-header">
                    <h4 className="order-recipient-card__title">
                      {t('admin.sku_section_title', 'SKU 規格組合清單')}
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSku}
                      className="btn btn--outline btn--sm"
                    >
                      {t('admin.btn_add_sku', '＋ 新增規格組合')}
                    </button>
                  </div>

                  <div className="sku-list-box">
                    {form.skus.map((sku, idx) => (
                      <div key={idx} className="sku-list-box__item">
                        <input
                          type="text"
                          placeholder={t('admin.placeholder_color', '顏色 (如:藍)')}
                          value={sku.color}
                          onChange={e => handleSkuChange(idx, 'color', e.target.value)}
                          className="sku-list-box__input"
                        />
                        <input
                          type="text"
                          placeholder={t('admin.placeholder_size', '尺寸 (如:M)')}
                          value={sku.size}
                          onChange={e => handleSkuChange(idx, 'size', e.target.value)}
                          className="sku-list-box__input"
                        />
                        <input
                          type="number"
                          placeholder={t('admin.placeholder_price', '售價')}
                          value={sku.price}
                          onChange={e => handleSkuChange(idx, 'price', e.target.value)}
                          required
                          className="sku-list-box__input"
                        />
                        <input
                          type="number"
                          placeholder={t('admin.placeholder_stock', '庫存')}
                          value={sku.stock}
                          onChange={e => handleSkuChange(idx, 'stock', e.target.value)}
                          required
                          className="sku-list-box__input"
                        />
                        <input
                          type="text"
                          placeholder={t('admin.placeholder_sku_code', 'SKU 編碼 (選填)')}
                          value={sku.sku_code}
                          onChange={e => handleSkuChange(idx, 'sku_code', e.target.value)}
                          className="sku-list-box__input sku-list-box__input--code"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSku(idx)}
                          className="sku-list-box__delete-btn"
                          title={t('admin.btn_delete', '移除')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="admin-modal__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setShowModal(false)}
                  >
                    {t('admin.btn_cancel', '取消')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                  >
                    {t('admin.btn_save', '儲存商品')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
