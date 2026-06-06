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
  const { user, token } = useAppStore()

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', {
        state: { from: location.pathname },
        replace: true,
      })
      return
    }

    if (requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        navigate('/forbidden', { replace: true })
      }
    }
  }, [token, user, requiredRoles, navigate, location])

  if (!token || !user) {
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
