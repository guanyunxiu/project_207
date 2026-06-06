import AuthGuard from '../AuthGuard'
import Layout from '../Layout'
import { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: Role[]
}

const ProtectedRoute = ({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) => {
  return (
    <AuthGuard requiredRoles={requiredRoles}>
      <Layout>{children}</Layout>
    </AuthGuard>
  )
}

export default ProtectedRoute
