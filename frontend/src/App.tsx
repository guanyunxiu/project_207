import { useEffect, useState } from 'react'
import { ConfigProvider, App as AntApp, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router, RouterProvider } from '@/router'
import { useAppStore } from '@/store'

function App() {
  const { token, user, fetchProfile, fetchCategories, isAuthenticated } = useAppStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initApp = async () => {
      if (isAuthenticated && token && !user) {
        try {
          await fetchProfile()
          await fetchCategories()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
        }
      }
      setInitializing(false)
    }
    initApp()
  }, [token, user, isAuthenticated, fetchProfile, fetchCategories])

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spin size="large" />
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
