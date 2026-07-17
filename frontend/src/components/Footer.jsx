import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        {/* Brand Column */}
        <div className="footer__brand">
          <h2 className="footer__logo">
            復古<span>刻痕</span>
          </h2>
          <p className="footer__desc">
            專注於復古服飾零售，嚴選數十年前珍貴設計，手刻時代的經典與情懷。
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
          <h3 className="footer__col-title">線上購物</h3>
          <ul className="footer__links">
            <li>
              <Link to="/products" className="footer__link">
                所有單品
              </Link>
            </li>
            <li>
              <Link to="/products?category=jackets" className="footer__link">
                經典外套
              </Link>
            </li>
            <li>
              <Link to="/products?category=shirts" className="footer__link">
                復古襯衫
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div>
          <h3 className="footer__col-title">顧客服務</h3>
          <ul className="footer__links">
            <li>
              <a href="#faq" className="footer__link">
                常見問題 FAQ
              </a>
            </li>
            <li>
              <a href="#shipping" className="footer__link">
                運送與配送說明
              </a>
            </li>
            <li>
              <a href="#returns" className="footer__link">
                退換貨政策
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 3 */}
        <div>
          <h3 className="footer__col-title">聯絡資訊</h3>
          <ul className="footer__links">
            <li className="footer__link" style={{ cursor: 'default' }}>
              📍 台北市大安區復古路 19 號
            </li>
            <li className="footer__link" style={{ cursor: 'default' }}>
              📞 02-2345-6789
            </li>
            <li className="footer__link" style={{ cursor: 'default' }}>
              ✉️ service@vintage-ec.com
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <div className="footer__copy">
            © {new Date().getFullYear()} 復古刻痕 Vintage E-Commerce. All rights reserved.
          </div>
          <div className="footer__payment-icons">
            <span style={{ fontSize: '12px', color: 'var(--color-cream-faint)' }}>
              安全串接：綠界科技 / 藍新支付 / 信用卡 / CVS
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
