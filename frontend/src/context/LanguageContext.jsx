import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../locales'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vintage_lang')
      if (saved && translations[saved]) {
        return saved
      }
      // 自動偵測瀏覽器語言
      const browserLang = navigator.language || navigator.userLanguage || ''
      if (browserLang.startsWith('zh-CN') || browserLang.startsWith('zh-SG')) {
        return 'zh-CN'
      }
      if (browserLang.startsWith('en')) {
        return 'en'
      }
    }
    return DEFAULT_LANGUAGE
  })

  // 同步切換 HTML lang 屬性及 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vintage_lang', language)
      document.documentElement.lang = language
    }
  }, [language])

  const changeLanguage = useCallback((code) => {
    if (translations[code]) {
      setLanguage(code)
    }
  }, [])

  // 取得多語系翻譯函數
  const t = useCallback(
    (keyPath, params = {}) => {
      const keys = keyPath.split('.')
      
      // 從目前語言取值
      let value = keys.reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), translations[language])

      // Fallback 到 DEFAULT_LANGUAGE (zh-TW)
      if (value === null || value === undefined) {
        value = keys.reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : null), translations[DEFAULT_LANGUAGE])
      }

      // 若仍然找不到，回傳 keyPath
      if (value === null || value === undefined) {
        return keyPath
      }

      // 如果不是字串，直接回傳
      if (typeof value !== 'string') {
        return value
      }

      // 參數替換：支援 {{param}} 與 {param}
      let result = value
      Object.keys(params).forEach((paramKey) => {
        const regexDouble = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g')
        const regexSingle = new RegExp(`{\\s*${paramKey}\\s*}`, 'g')
        result = result.replace(regexDouble, params[paramKey]).replace(regexSingle, params[paramKey])
      })

      return result
    },
    [language]
  )

  const currentLangMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]
  }, [language])

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      changeLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currentLanguage: currentLangMeta,
      t,
    }),
    [language, changeLanguage, currentLangMeta, t]
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useTranslation() {
  const { t, language, changeLanguage, supportedLanguages, currentLanguage } = useLanguage()
  return { t, language, changeLanguage, supportedLanguages, currentLanguage }
}
