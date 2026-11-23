import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSelector({ variant = 'desktop' }) {
  const { language, changeLanguage, supportedLanguages, currentLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 點擊外部自動收合
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (variant === 'mobile') {
    return (
      <div className="header__lang-mobile">
        <div className="header__lang-mobile-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>語言 / Language</span>
        </div>
        <div className="header__lang-mobile-group">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`header__lang-mobile-btn ${language === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="header__lang-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`header__lang-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="header__lang-name">{currentLanguage.shortName}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <ul className="header__lang-menu">
          {supportedLanguages.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                className={`header__lang-menu-item ${language === lang.code ? 'active' : ''}`}
                onClick={() => {
                  changeLanguage(lang.code)
                  setIsOpen(false)
                }}
              >
                <span className="header__lang-item-name">{lang.name}</span>
                {language === lang.code && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
