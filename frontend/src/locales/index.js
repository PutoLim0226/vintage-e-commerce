import zhTW from './zh-TW'
import zhCN from './zh-CN'
import en from './en'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-TW', name: '繁體中文', shortName: '繁中', flag: '🇹🇼' },
  { code: 'zh-CN', name: '简体中文', shortName: '简中', flag: '🇨🇳' },
  { code: 'en', name: 'English', shortName: 'EN', flag: '🇬🇧' },
]

export const DEFAULT_LANGUAGE = 'zh-TW'

export const translations = {
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  en: en,
}
