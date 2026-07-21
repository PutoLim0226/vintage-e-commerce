import { useEffect, useState } from 'react'
import api from '../../api/api'

export default function AdminDashboardPage() {
  const [data, setData]       = useState(null)
  const [period, setPeriod]   = useState('7d')
  const [loading, setLoading] = useState(true)

  const loadDashboard = async (p = '7d') => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/dashboard?period=${p}`)
      if (res.data.success) {
        setData(res.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard(period)
  }, [period])

  const kpi = data?.kpi || {}
  const trend = data?.trend || []
  const topProducts = data?.top_products || []
  const lowStockSkus = data?.low_stock_skus || []

  // 計算 SVG 圖表座標
  const maxRevenue = Math.max(...trend.map(t => parseFloat(t.revenue || 0)), 100)
  const svgWidth  = 600
  const svgHeight = 200
  const padding   = 30

  const points = trend.map((item, idx) => {
    const x = padding + (idx / Math.max(trend.length - 1, 1)) * (svgWidth - padding * 2)
    const rev = parseFloat(item.revenue || 0)
    const y = svgHeight - padding - (rev / maxRevenue) * (svgHeight - padding * 2)
    return { x, y, rev, date: item.date }
  })

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPoints = points.length
    ? `${points[0].x},${svgHeight - padding} ${polylinePoints} ${points[points.length - 1].x},${svgHeight - padding}`
    : ''

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">營收儀表板 (Analytics Dashboard)</h1>
          <p className="subtitle">即時監控全站營收成長、訂單趨勢與進銷存狀態</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-cream-muted)', textAlign: 'center', padding: '60px 0' }}>
          資料加載中...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">💰 總累計營業額</div>
              <div className="kpi-value">NT$ {Math.round(kpi.total_revenue || 0).toLocaleString()}</div>
              <div className="kpi-subtext">今日: NT$ {Math.round(kpi.today_revenue || 0).toLocaleString()}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">📦 總訂單數量</div>
              <div className="kpi-value">{kpi.total_orders || 0} 筆</div>
              <div className="kpi-subtext">待處理訂單: {kpi.pending_orders || 0} 筆</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">📊 平均客單價 (AOV)</div>
              <div className="kpi-value">NT$ {Math.round(kpi.avg_order_value || 0).toLocaleString()}</div>
              <div className="kpi-subtext">本月營收: NT$ {Math.round(kpi.monthly_revenue || 0).toLocaleString()}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">👥 註冊會員總數</div>
              <div className="kpi-value">{kpi.total_users || 0} 人</div>
              <div className="kpi-subtext">消費回饋率 1% 點數獎勵</div>
            </div>
          </div>

          {/* Charts & Reports */}
          <div className="dashboard-charts-grid">
            {/* SVG 營收趨勢圖 */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">📈 營收成長趨勢 (純 SVG 渲染)</h3>
                <div className="period-selector">
                  {['7d', '30d', '1y'].map(p => (
                    <button
                      key={p}
                      className={`period-btn ${period === p ? 'active' : ''}`}
                      onClick={() => setPeriod(p)}
                    >
                      {p === '7d' ? '近 7 天' : p === '30d' ? '近 30 天' : '全年度'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="svg-chart-container">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8a96e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#c8a96e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* 網格背景 */}
                  <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="rgba(200, 169, 110, 0.1)" strokeDasharray="4" />
                  <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="rgba(200, 169, 110, 0.1)" strokeDasharray="4" />
                  <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="rgba(200, 169, 110, 0.2)" />

                  {/* 面積區域 */}
                  {areaPoints && <polygon points={areaPoints} className="chart-area" />}

                  {/* 趨勢折線 */}
                  {polylinePoints && <polyline points={polylinePoints} className="chart-line" />}

                  {/* 數據圓點 */}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" className="chart-dot">
                        <title>{`${p.date}: NT$ ${p.rev.toLocaleString()}`}</title>
                      </circle>
                      <text x={p.x} y={svgHeight - 10} textAnchor="middle" className="chart-axis-text">
                        {p.date ? p.date.substring(5) : ''}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Top 5 熱銷商品 */}
            <div className="chart-card">
              <h3 className="chart-title" style={{ marginBottom: '16px' }}>🏆 熱銷商品 Top 5</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topProducts.length === 0 ? (
                  <div style={{ color: 'var(--color-cream-faint)', fontSize: '13px' }}>尚無銷售紀錄</div>
                ) : (
                  topProducts.map((p, index) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'var(--color-bg-surface)',
                        borderRadius: '6px',
                        borderLeft: index === 0 ? '3px solid var(--color-gold)' : '3px solid transparent',
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whitespace: 'nowrap', maxWidth: '60%' }}>
                        <span style={{ color: 'var(--color-gold)', fontWeight: 'bold', marginRight: '8px' }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-cream)' }}>{p.name}</span>
                      </div>
                      <div style={{ fontSize: '13px', textAlign: 'right' }}>
                        <div style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>
                          已售 {p.total_sold} 件
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-cream-faint)' }}>
                          NT$ {Math.round(p.total_revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 低庫存警示卡片 */}
          <div className="admin-table-card">
            <h3 className="chart-title" style={{ color: 'var(--color-warning)', marginBottom: '16px' }}>
              ⚠️ 低庫存 (Stock &le; 5) 進銷存預警
            </h3>
            {lowStockSkus.length === 0 ? (
              <div style={{ color: 'var(--color-success)', fontSize: '14px', padding: '12px 0' }}>
                ✅ 所有商品規格庫存皆充足，無需補貨！
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>商品名稱</th>
                      <th>SKU 編碼</th>
                      <th>顏色 / 尺寸</th>
                      <th>剩餘庫存</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockSkus.map(sku => (
                      <tr key={sku.sku_id}>
                        <td style={{ color: 'var(--color-cream)', fontWeight: 500 }}>{sku.product_name}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--color-gold-light)' }}>{sku.sku_code}</td>
                        <td>{sku.color || '-'} / {sku.size || '-'}</td>
                        <td style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>{sku.stock} 件</td>
                        <td>
                          <span className="status-badge badge-cancelled">急需補貨</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
