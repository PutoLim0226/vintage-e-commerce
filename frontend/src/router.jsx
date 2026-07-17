import { createBrowserRouter } from 'react-router-dom'
import {
  HomePage,
  ProductListPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  OrdersPage,
  NotFoundPage,
} from './pages'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter([
  // ── 公開路由 ──────────────────────────────────
  { path: '/',             element: <HomePage /> },
  { path: '/products',     element: <ProductListPage /> },
  { path: '/products/:slug', element: <ProductDetailPage /> },
  { path: '/cart',         element: <CartPage /> },
  { path: '/login',        element: <LoginPage /> },
  { path: '/register',     element: <RegisterPage /> },

  // ── 需要登入 ─────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/checkout',       element: <CheckoutPage /> },
      { path: '/profile',        element: <ProfilePage /> },
      { path: '/profile/orders', element: <OrdersPage /> },
    ],
  },

  // ── 404 ───────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
])

export default router
