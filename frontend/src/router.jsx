import { createBrowserRouter, Navigate } from 'react-router-dom'
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
  PaymentPage,
  NotFoundPage,
} from './pages'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
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
          { path: '/payment/:order_no', element: <PaymentPage /> },
        ],
      },

      // ── 404 ───────────────────────────────────────
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // ── Admin（獨立 Layout，不含 Header/Footer）────
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true,            element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard',      element: <AdminDashboardPage /> },
      { path: 'products',       element: <AdminProductsPage /> },
      { path: 'orders',         element: <AdminOrdersPage /> },
      { path: 'coupons',        element: <AdminCouponsPage /> },
    ],
  },
], {
  basename: import.meta.env.VITE_ROUTER_BASENAME || '/',
})

export default router
