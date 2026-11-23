import { useEffect, useState } from 'react'
import { useTranslation } from '../../context/LanguageContext'
import api from '../../api/api'

export default function AdminDashboardPage() {
  const { t } = useTranslation()
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
          <h1 className="page-title">{t('admin.dashboard_title')}</h1>
          <p className="subtitle">{t('admin.dashboard_subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          {t('admin.loading')}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">💰 {t('admin.kpi_revenue')}</div>
              <div className="kpi-value">NT$ {Math.round(kpi.total_revenue || 0).toLocaleString()}</div>
              <div className="kpi-subtext">{t('admin.kpi_sub_revenue')}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">📦 {t('admin.kpi_orders')}</div>
              <div className="kpi-value">{kpi.total_orders || 0}</div>
              <div className="kpi-subtext">{kpi.total_orders || 0} {t('admin.kpi_sub_orders')}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">📊 {t('admin.kpi_aov')}</div>
              <div className="kpi-value">NT$ {Math.round(kpi.avg_order_value || 0).toLocaleString()}</div>
              <div className="kpi-subtext">{t('admin.kpi_aov')}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">🧥 {t('admin.kpi_products')}</div>
              <div className="kpi-value">{kpi.total_products || 0}</div>
              <div className="kpi-subtext">{t('admin.kpi_sub_products')}</div>
            </div>
          </div>

          {/* Charts & Reports */}
          <div className="dashboard-charts-grid">
            {/* SVG 營收趨勢圖 */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">{t('admin.chart_revenue_trend')}</h3>
                <div className="period-selector">
                  {['7d', '30d', '1y'].map(p => (
                    <button
                      key={p}
                      className={`period-btn ${period === p ? 'active' : ''}`}
                      onClick={() => setPeriod(p)}
                    >
                      {p === '7d' ? t('admin.chart_period_7d') : p === '30d' ? t('admin.chart_period_30d') : t('admin.chart_period_12m')}
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
              <h3 className="chart-title">{t('admin.chart_top_products')}</h3>
              <div className="dashboard-top-products">
                {topProducts.length === 0 ? (
                  <div className="admin-empty">{t('admin.no_sales_record')}</div>
                ) : (
                  topProducts.map((p, index) => (
                    <div
                      key={p.id}
                      className="dashboard-top-products__item"
                    >
                      <div className="dashboard-top-products__left">
                        <span className="dashboard-top-products__rank">
                          #{index + 1}
                        </span>
                        <span className="dashboard-top-products__name">{p.name}</span>
                      </div>
                      <div className="dashboard-top-products__right">
                        <div className="dashboard-top-products__revenue">
                          {t('admin.sales_count', { count: p.total_sold })}
                        </div>
                        <div className="dashboard-top-products__qty">
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
            <h3 className="chart-title stock-alert-title">
              {t('admin.stock_alert_title')}
            </h3>
            {lowStockSkus.length === 0 ? (
              <div className="stock-alert-empty">
                {t('admin.stock_sufficient')}
              </div>
            ) : (
              <div className="admin-table-wrapper table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('admin.col_product')}</th>
                      <th>{t('admin.col_sku')}</th>
                      <th>{t('product_detail.color')} / {t('product_detail.size')}</th>
                      <th>{t('admin.col_stock')}</th>
                      <th>{t('admin.col_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockSkus.map(sku => (
                      <tr key={sku.sku_id}>
                        <td>{sku.product_name}</td>
                        <td className="admin-td-code">{sku.sku_code}</td>
                        <td>{sku.color || '-'} / {sku.size || '-'}</td>
                        <td className="admin-td-danger">{sku.stock}</td>
                        <td>
                          <span className="status-badge badge-cancelled">{t('cart.stock_low', '急需補貨')}</span>
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
