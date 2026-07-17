import { useEffect, useState } from 'react'
import api from '../../api/api'

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: accent || 'var(--color-gold)',
        borderRadius: '12px 12px 0 0',
      }} />
      <div style={{ fontSize: '13px', color: 'var(--color-cream-faint)', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(28px, 3vw, 36px)',
        fontFamily: 'var(--font-heading)',
        color: 'var(--color-cream)',
        fontWeight: 700,
        lineHeight: 1,
        marginBottom: '8px',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '13px', color: 'var(--color-cream-faint)' }}>{sub}</div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // 用 admin dashboard API + 備援直接查
        const [prodRes, ordRes] = await Promise.all([
          api.get('/api/admin/products'),
          api.get('/api/admin/orders'),
        ])
        const products = prodRes.data.data || []
        const orders   = ordRes.data.data?.orders || ordRes.data.data || []

        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

        const pendingOrders = orders.filter(o => o.status === 'pending').length

        setStats({
          productCount: products.length,
          orderCount:   orders.length,
          revenue:      totalRevenue,
          pending:      pendingOrders,
          activeProducts: products.filter(p => p.is_active).length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ color: 'var(--color-cream-faint)', textAlign: 'center', paddingTop: '80px' }}>
      載入中...
    </div>
  )

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--color-cream)', marginBottom: '8px' }}>
        總覽儀表板
      </h1>
      <p style={{ color: 'var(--color-cream-faint)', marginBottom: '40px', fontSize: '14px' }}>
        復古刻痕電商後台管理系統
      </p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          <StatCard label="上架商品" value={stats.activeProducts} sub={`共 ${stats.productCount} 件商品`} accent="var(--color-gold)" />
          <StatCard label="訂單總數" value={stats.orderCount} sub={`${stats.pending} 筆待處理`} accent="var(--color-copper)" />
          <StatCard label="累計營收" value={`NT$ ${Math.round(stats.revenue).toLocaleString()}`} sub="不含取消訂單" accent="#6eb6a0" />
        </div>
      )}

      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h3 style={{ fontSize: '16px', color: 'var(--color-cream)', marginBottom: '16px' }}>快速導覽</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '管理商品', to: '/admin/products' },
            { label: '管理訂單', to: '/admin/orders' },
          ].map(item => (
            <a
              key={item.to}
              href={item.to}
              className="btn btn--ghost"
              style={{ fontSize: '14px', padding: '8px 20px' }}
            >
              {item.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
