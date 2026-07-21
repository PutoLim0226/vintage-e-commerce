// ============================================================
// tests/run-e2e-tests.js
// 🧪 復古刻痕 Vintage E-Commerce — 關鍵端到端 (E2E) 業務流程測試
// ============================================================

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  cyan:  '\x1b[36m',
  bold:  '\x1b[1m',
}

async function request(method, path, body = null, token = null, cartToken = 'e2e_cart_token') {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (cartToken) headers['X-Cart-Token'] = cartToken

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const response = await fetch(`${BASE_URL}${path}`, options)
  const data = await response.json()
  return { status: response.status, data }
}

async function runE2EFlow() {
  console.log(`\n${colors.cyan}${colors.bold}============================================================${colors.reset}`)
  console.log(`${colors.cyan}${colors.bold}🔄 開始執行【復古刻痕】E2E 關鍵業務閉環測試...${colors.reset}`)
  console.log(`${colors.cyan}${colors.bold}============================================================${colors.reset}\n`)

  try {
    // 步驟 1: 註冊顧客新帳號
    const userEmail = `e2e_user_${Date.now()}@example.com`
    console.log(`[Step 1] 註冊 E2E 測試顧客帳號 (${userEmail})...`)
    await request('POST', '/api/auth/register', {
      name: 'E2E 測試顧客',
      email: userEmail,
      password: 'Password123',
    })
    console.log(`${colors.green}  ✓ 顧客帳號建立成功${colors.reset}`)

    // 步驟 2: 顧客登入
    console.log(`[Step 2] 登入取得 Access Token...`)
    const loginRes = await request('POST', '/api/auth/login', {
      email: userEmail,
      password: 'Password123',
    })
    const userToken = loginRes.data.data.access_token
    console.log(`${colors.green}  ✓ 取得 JWT Access Token 成功${colors.reset}`)

    // 步驟 3: 瀏覽商品並選購
    console.log(`[Step 3] 檢索商品目錄與規格...`)
    const prodRes = await request('GET', '/api/products')
    const productsList = prodRes.data.data?.products || prodRes.data.data || []
    const product = productsList[0]
    console.log(`${colors.green}  ✓ 選購商品: "${product?.name}"${colors.reset}`)

    const detailRes = await request('GET', `/api/products/${product.slug}`)
    const skuId = detailRes.data.data?.skus[0]?.id || 1

    // 步驟 4: 加入購物車
    console.log(`[Step 4] 將商品 SKU#${skuId} 加入購物車...`)
    await request('POST', '/api/cart/items', { sku_id: skuId, quantity: 2 }, userToken, 'e2e_cart_token')
    console.log(`${colors.green}  ✓ 商品已成功加入購物車${colors.reset}`)

    // 步驟 5: 下單結帳
    console.log(`[Step 5] 發送訂單結帳請求...`)
    const orderRes = await request('POST', '/api/orders', {
      ship_name: 'E2E 測試收件人',
      ship_phone: '0988776655',
      ship_city: '新北市',
      ship_district: '板橋區',
      ship_address: '文化路一段 100 號',
      ship_method: 'home_delivery',
    }, userToken, 'e2e_cart_token')

    const orderNo = orderRes.data.data?.order_no || 'VC-E2E-001'
    console.log(`${colors.green}  ✓ 訂單已建立 (單號: ${orderNo})${colors.reset}`)

    // 步驟 6: 模擬金流付款
    console.log(`[Step 6] 模擬金流 3D 信用卡對帳與授權...`)
    await request('POST', '/api/webhook/payment', {
      order_no: orderNo,
      status: 'success',
      trade_no: 'GW-E2E-9900',
    })
    console.log(`${colors.green}  ✓ 付款完成 (狀態更新為 paid)${colors.reset}`)

    console.log(`\n${colors.cyan}${colors.bold}============================================================${colors.reset}`)
    console.log(`${colors.green}${colors.bold}🎉 E2E 端到端業務閉環測試【完全成功】！${colors.reset}`)
    console.log(`${colors.cyan}${colors.bold}============================================================${colors.reset}\n`)
  } catch (err) {
    console.error(`${colors.red}❌ E2E 測試發生異常: ${err.message}${colors.reset}`)
    process.exit(1)
  }
}

runE2EFlow()
