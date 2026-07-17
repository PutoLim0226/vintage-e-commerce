import { useEffect, useState } from 'react'
import api from '../../api/api'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState(null)

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/api/admin/products')
      if (data.success) setProducts(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

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
            gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 120px',
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
                gridTemplateColumns: '60px 1fr 120px 100px 100px 80px 120px',
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
    </div>
  )
}
