import { useEffect, useState } from 'react'
import api from '../../api/api'

const STATUS_BADGE = {
  pending:    { label: '待確認', color: '#e8a838' },
  confirmed:  { label: '已確認', color: 'var(--color-gold)' },
  processing: { label: '備貨中', color: '#6eb6a0' },
  shipped:    { label: '已出貨', color: '#6b9fd4' },
  delivered:  { label: '已送達', color: '#7fb87f' },
  cancelled:  { label: '已取消', color: 'var(--color-error)' },
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/api/admin/orders')
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : (data.data?.orders || [])
        setOrders(list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      const { data } = await api.patch(`/api/admin/orders/${orderId}`, { status: newStatus })
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (err) {
      console.error(err)
      alert('狀態更新失敗')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-cream)', marginBottom: '4px' }}>
            訂單管理
          </h1>
          <p style={{ color: 'var(--color-cream-faint)', fontSize: '14px' }}>
            共 {orders.length} 筆訂單
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '14px', minWidth: '140px' }}
        >
          <option value="">全部狀態</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_BADGE[s]?.label || s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-cream-faint)', textAlign: 'center', paddingTop: '60px' }}>載入中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-cream-faint)' }}>
          尚無訂單資料
        </div>
      ) : (
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 120px 130px 160px',
            gap: '16px',
            padding: '14px 24px',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-cream-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>訂單ID</span>
            <span>客戶資訊</span>
            <span>金額</span>
            <span>狀態</span>
            <span>更新狀態</span>
          </div>

          {/* Rows */}
          {filtered.map((order, idx) => {
            const badge = STATUS_BADGE[order.status] || { label: order.status, color: 'var(--color-cream-faint)' }
            return (
              <div
                key={order.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 120px 130px 160px',
                  gap: '16px',
                  padding: '16px 24px',
                  alignItems: 'center',
                  borderBottom: idx !== filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '14px', color: 'var(--color-cream-faint)', fontFamily: 'monospace' }}>
                  #{order.id}
                </span>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--color-cream)', fontWeight: 500 }}>
                    {order.user_name || '訪客'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('zh-TW') : ''}
                  </div>
                </div>
                <span style={{ fontSize: '15px', color: 'var(--color-cream)', fontWeight: 600 }}>
                  NT$ {Math.round(order.total_amount || 0).toLocaleString()}
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: `1px solid ${badge.color}`,
                  color: badge.color,
                }}>
                  {badge.label}
                </span>
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={e => handleStatusChange(order.id, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px', minWidth: '120px' }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_BADGE[s]?.label || s}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
