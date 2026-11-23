import { Link } from 'react-router-dom'
import { useTranslation } from '../context/LanguageContext'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="not-found-page">
      <div className="not-found-page__code">
        404
      </div>

      <h1 className="not-found-page__title">
        {t('notfound.title')}
      </h1>
      <p className="not-found-page__desc">
        {t('notfound.desc')}
      </p>

      <div className="not-found-page__actions">
        <Link to="/" className="btn btn--primary btn--lg">
          {t('notfound.back_home')}
        </Link>
        <Link to="/products" className="btn btn--ghost btn--lg">
          {t('notfound.browse_products')}
        </Link>
      </div>

      <div className="not-found-page__deco">
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
