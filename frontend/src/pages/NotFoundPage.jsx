import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '80dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 24px'
      }}
    >
      <div
        style={{
          fontSize: 'clamp(96px, 20vw, 160px)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          lineHeight: 1,
          background: 'linear-gradient(135deg, var(--color-gold), var(--color-copper))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '16px',
          userSelect: 'none'
        }}
      >
        404
      </div>

      <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontFamily: 'var(--font-heading)', color: 'var(--color-cream)', marginBottom: '16px' }}>
        這個頁面好像迷路了
      </h1>
      <p style={{ color: 'var(--color-cream-faint)', maxWidth: '380px', lineHeight: 1.8, marginBottom: '40px' }}>
        您所尋找的頁面可能已移除、更名，或暫時無法使用。
        也許可以從這裡重新出發？
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn--primary btn--lg">
          回到首頁
        </Link>
        <Link to="/products" className="btn btn--ghost btn--lg">
          瀏覽商品
        </Link>
      </div>

      <div style={{ marginTop: '64px', opacity: 0.25, pointerEvents: 'none', userSelect: 'none' }}>
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" stroke="var(--color-gold)">
          <rect x="20" y="10" width="80" height="60" rx="4" strokeWidth="1.5"/>
          <line x1="35" y1="25" x2="85" y2="25" strokeWidth="1"/>
          <line x1="35" y1="35" x2="75" y2="35" strokeWidth="1"/>
          <line x1="35" y1="45" x2="80" y2="45" strokeWidth="1"/>
          <circle cx="92" cy="62" r="14" strokeWidth="1.5"/>
          <line x1="102" y1="72" x2="112" y2="82" strokeWidth="2"/>
        </svg>
      </div>
    </main>
  )
}
