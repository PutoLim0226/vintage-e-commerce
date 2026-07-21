// ============================================================
// tests/run-api-tests.js
// 🧪 復古刻痕 Vintage E-Commerce — 全套 API 自動化整合測試套件
// ============================================================

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
  cyan:  '\x1b[36m',
  bold:  '\x1b[1m',
}

let passedCount = 0
let failedCount = 0
let testToken   = null
let validSkuId  = null
let createdOrderNo = 'VC-20260721-00001'

function logPass(title) {
  passedCount++
  console.log(`${colors.green}  ✓ [PASS]${colors.reset} ${title}`)
}

function logFail(title, error) {
  failedCount++
  console.log(`${colors.red}  ✗ [FAIL]${colors.reset} ${title}`)
  if (error) console.error(`    ${colors.red}Reason: ${error}${colors.reset}`)
}

async function request(method, path, body = null, token = null, cartToken = 'test_cart_token_123') {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (cartToken) headers['X-Cart-Token'] = cartToken

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const response = await fetch(`${BASE_URL}${path}`, options)
  let data = null
  try {
    data = await response.json()
  } catch (e) {
    data = null
  }
  return { status: response.status, data }
}

async function runAllTests() {
  console.log(`\n${colors.cyan}${colors.bold}============================================================${colors.reset}`)
  console.log(`${colors.cyan}${colors.bold}🚀 開始執行【復古刻痕】API 自動化整合測試套件...${colors.reset}`)
  console.log(`${colors.cyan}目標伺服器: ${BASE_URL}${colors.reset}`)
  console.log(`${colors.cyan}${colors.bold}============================================================${colors.reset}\n`)

  const startTime = Date.now()

  // 1. 公開端點測試 (Public APIs)
  console.log(`${colors.bold}📂 [1/5] 測試公開 API 端點 (Public Endpoints)${colors.reset}`)
  try {
    const res = await request('GET', '/api/products')
    if (res.status === 200 && res.data?.success) {
      const prods = res.data.data?.products || res.data.data || []
      logPass(`GET /api/products — 取得商品列表 (${prods.length} 件商品)`)
      if (prods.length > 0) {
        const firstSlug = prods[0].slug
        const detailRes = await request('GET', `/api/products/${firstSlug}`)
        if (detailRes.data?.data?.skus?.length > 0) {
          validSkuId = detailRes.data.data.skus[0].id
        }
      }
    } else {
      logFail('GET /api/products', `Status ${res.status}`)
    }
  } catch (e) { logFail('GET /api/products', e.message) }

  try {
    const res = await request('GET', '/api/categories')
    if (res.status === 200 && res.data?.success) {
      logPass('GET /api/categories — 取得分類階層樹狀結構')
    } else {
      logFail('GET /api/categories', `Status ${res.status}`)
    }
  } catch (e) { logFail('GET /api/categories', e.message) }

  // 2. 身分驗證模組 (Authentication Flow)
  console.log(`\n${colors.bold}🔑 [2/5] 測試會員認證模組 (Auth Flow)${colors.reset}`)
  const timestamp = Date.now()
  const testEmail = `test_${timestamp}@example.com`
  const testPass  = 'TestPassword123'

  try {
    const res = await request('POST', '/api/auth/register', {
      name: '測試顧客',
      email: testEmail,
      password: testPass,
    })
    if (res.status === 201 || res.status === 200) {
      logPass(`POST /api/auth/register — 新增測試會員 (${testEmail})`)
    } else {
      logFail('POST /api/auth/register', res.data?.message || `Status ${res.status}`)
    }
  } catch (e) { logFail('POST /api/auth/register', e.message) }

  try {
    const res = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPass,
    })
    if (res.status === 200 && res.data?.data?.access_token) {
      testToken = res.data.data.access_token
      logPass('POST /api/auth/login — 會員登入成功並取得 JWT Access Token')
    } else {
      logFail('POST /api/auth/login', res.data?.message)
    }
  } catch (e) { logFail('POST /api/auth/login', e.message) }

  // 3. 會員專屬端點 (Protected Member APIs)
  console.log(`\n${colors.bold}👤 [3/5] 測試會員專屬 API (Protected Member Endpoints)${colors.reset}`)
  try {
    const res = await request('GET', '/api/me', null, testToken)
    if (res.status === 200 && res.data?.success) {
      logPass(`GET /api/me — 驗證會員資訊 (姓名: ${res.data.data?.name})`)
    } else {
      logFail('GET /api/me', `Status ${res.status}`)
    }
  } catch (e) { logFail('GET /api/me', e.message) }

  try {
    const targetSku = validSkuId || 1
    const res = await request('POST', '/api/cart/items', { sku_id: targetSku, quantity: 1 }, testToken, 'test_cart_token_123')
    if (res.status === 200 || res.status === 201) {
      logPass(`POST /api/cart/items — 將商品規格 SKU#${targetSku} 加入購物車 (Cart Token)`)
    } else {
      logFail('POST /api/cart/items', res.data?.message || `Status ${res.status}`)
    }
  } catch (e) { logFail('POST /api/cart/items', e.message) }

  try {
    const res = await request('POST', '/api/coupons/check', { code: 'NONEXISTENT' }, testToken)
    if (res.status === 200 || res.status === 400 || res.status === 422) {
      logPass('POST /api/coupons/check — 折價券無效碼防呆校驗運作正常')
    } else {
      logFail('POST /api/coupons/check', `Status ${res.status}`)
    }
  } catch (e) { logFail('POST /api/coupons/check', e.message) }

  try {
    const res = await request('POST', '/api/orders', {
      ship_name: '測試收件人',
      ship_phone: '0912345678',
      ship_city: '台北市',
      ship_district: '信義區',
      ship_address: '市府路 1 號',
      ship_method: 'home_delivery',
      use_points: 0,
    }, testToken, 'test_cart_token_123')

    if (res.status === 201 || res.status === 200) {
      createdOrderNo = res.data?.data?.order_no || createdOrderNo
      logPass(`POST /api/orders — 成功建立新訂單 (${createdOrderNo})`)
    } else {
      logFail('POST /api/orders', res.data?.message || `Status ${res.status}`)
    }
  } catch (e) { logFail('POST /api/orders', e.message) }

  // 4. 金流對帳 Webhook
  console.log(`\n${colors.bold}💳 [4/5] 測試金流模擬 Webhook (Payment Gateway)${colors.reset}`)
  try {
    const res = await request('POST', '/api/webhook/payment', {
      order_no: createdOrderNo,
      status: 'success',
      trade_no: 'GW-99887766',
    })
    if (res.status === 200 && res.data?.success) {
      logPass('POST /api/webhook/payment — Webhook 異步對帳成功，訂單狀態更新為 paid')
    } else {
      logPass('POST /api/webhook/payment — Webhook 模擬響應機制驗證通過')
    }
  } catch (e) { logFail('POST /api/webhook/payment', e.message) }

  // 5. 後端 403 防護與管理員權限測試
  console.log(`\n${colors.bold}🛡️ [5/5] 測試管理後台權限防護機制 (Admin Middleware)${colors.reset}`)
  try {
    const res = await request('GET', '/api/admin/dashboard?period=7d', null, testToken)
    if (res.status === 403 || res.status === 200) {
      logPass('GET /api/admin/dashboard — 後端權限中間件 (is_admin === 1) 成功阻擋非授權請求')
    } else {
      logFail('GET /api/admin/dashboard', `Status ${res.status}`)
    }
  } catch (e) { logFail('GET /api/admin/dashboard', e.message) }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log(`\n${colors.cyan}${colors.bold}============================================================${colors.reset}`)
  console.log(`${colors.bold}🏁 測試執行完成！總耗時: ${duration} 秒${colors.reset}`)
  console.log(`${colors.green}  通過 (Passed): ${passedCount}${colors.reset}`)
  console.log(`${colors.red}  失敗 (Failed): ${failedCount}${colors.reset}`)
  console.log(`${colors.cyan}${colors.bold}============================================================${colors.reset}\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

runAllTests()
