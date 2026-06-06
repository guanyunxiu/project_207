import { lazy, Suspense } from 'react'
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import { Spin } from 'antd'
import { ProtectedRoute } from '@/components'
import { Role } from '@/types'

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" />
  </div>
)

const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Documents = lazy(() => import('@/pages/Documents'))
const DocumentDetail = lazy(() => import('@/pages/Documents/Detail'))
const DocumentEdit = lazy(() => import('@/pages/Documents/Edit'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const History = lazy(() => import('@/pages/History'))
const Profile = lazy(() => import('@/pages/Profile'))
const CategoryManagement = lazy(() => import('@/pages/admin/Categories'))
const UserManagement = lazy(() => import('@/pages/admin/Users'))

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
)

const protectedRoute = (
  element: React.ReactNode,
  requiredRoles: Role[] = []
) => (
  <ProtectedRoute requiredRoles={requiredRoles}>
    <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
  </ProtectedRoute>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<Login />),
  },
  {
    path: '/register',
    element: withSuspense(<Register />),
  },
  {
    path: '/forbidden',
    element: withSuspense(<Forbidden />),
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: protectedRoute(<Dashboard />),
  },
  {
    path: '/documents',
    children: [
      {
        index: true,
        element: protectedRoute(<Documents />),
      },
      {
        path: 'create',
        element: protectedRoute(<DocumentEdit />),
      },
      {
        path: ':id',
        element: protectedRoute(<DocumentDetail />),
      },
      {
        path: ':id/edit',
        element: protectedRoute(<DocumentEdit />),
      },
    ],
  },
  {
    path: '/favorites',
    element: protectedRoute(<Favorites />),
  },
  {
    path: '/history',
    element: protectedRoute(<History />),
  },
  {
    path: '/profile',
    element: protectedRoute(<Profile />),
  },
  {
    path: '/admin',
    children: [
      {
        path: 'categories',
        element: protectedRoute(<CategoryManagement />, [Role.SUPER_ADMIN]),
      },
      {
        path: 'users',
        element: protectedRoute(<UserManagement />, [Role.SUPER_ADMIN]),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFound />),
  },
])

export { RouterProvider }

export default router
