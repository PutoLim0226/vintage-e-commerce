import { Link } from 'react-router-dom'
import { useTranslation } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="footer__main">
        {/* Brand Column */}
        <div className="footer__brand">
          <h2 className="footer__logo">
            {t('header.brand_prefix')}<span>{t('header.brand_suffix')}</span>
          </h2>
          <p className="footer__desc">
            {t('footer.brand_desc')}
          </p>
          <div className="footer__social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__social-link" aria-label="Instagram">
              IG
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer__social-link" aria-label="Facebook">
              FB
            </a>
            <a href="https://line.me" target="_blank" rel="noreferrer" className="footer__social-link" aria-label="LINE">
              LN
            </a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div>
          <h3 className="footer__col-title">{t('footer.col_shop')}</h3>
          <ul className="footer__links">
            <li>
              <Link to="/products" className="footer__link">
                {t('footer.shop_all')}
              </Link>
            </li>
            <li>
              <Link to="/products?category=jackets" className="footer__link">
                {t('footer.shop_jackets')}
              </Link>
            </li>
            <li>
              <Link to="/products?category=shirts" className="footer__link">
                {t('footer.shop_shirts')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h3 className="footer__col-title">{t('footer.col_service')}</h3>
          <ul className="footer__links">
            <li>
              <a href="#faq" className="footer__link">
                {t('footer.faq')}
              </a>
            </li>
            <li>
              <a href="#shipping" className="footer__link">
                {t('footer.shipping_info')}
              </a>
            </li>
            <li>
              <a href="#returns" className="footer__link">
                {t('footer.returns_info')}
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div>
          <h3 className="footer__col-title">{t('footer.col_contact')}</h3>
          <ul className="footer__links">
            <li className="footer__link" style={{ cursor: 'default' }}>
              {t('footer.address')}
            </li>
            <li className="footer__link" style={{ cursor: 'default' }}>
              {t('footer.phone')}
            </li>
            <li className="footer__link" style={{ cursor: 'default' }}>
              {t('footer.email')}
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <div className="footer__copy">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </div>
          <div className="footer__payment-icons">
            <span style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
              {t('footer.payment_notice')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
