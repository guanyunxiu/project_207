import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppStore } from '@/store'
import { Role } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: Role[]
}

const AuthGuard = ({ children, requiredRoles = [] }: AuthGuardProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, isAuthenticated } = useAppStore()

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', {
        state: { from: location.pathname },
        replace: true,
      })
      return
    }

    if (user && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        navigate('/forbidden', { replace: true })
      }
    }
  }, [token, user, isAuthenticated, requiredRoles, navigate, location])

  if (!isAuthenticated || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}

export default AuthGuard
