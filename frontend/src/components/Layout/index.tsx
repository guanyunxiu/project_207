import { useState } from 'react'
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  theme,
} from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  HeartOutlined,
  HistoryOutlined,
  FolderOpenOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
} from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import { Role } from '@/types'

const { Header, Sider, Content } = AntLayout

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAppStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const isSuperAdmin = user?.role === Role.SUPER_ADMIN

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">首页</Link>,
    },
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: <Link to="/documents">文档列表</Link>,
    },
    {
      key: '/favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">我的收藏</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">浏览历史</Link>,
    },
    ...(isSuperAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: [
              {
                key: '/admin/categories',
                icon: <FolderOpenOutlined />,
                label: <Link to="/admin/categories">分类管理</Link>,
              },
              {
                key: '/admin/users',
                icon: <UserOutlined />,
                label: <Link to="/admin/users">用户管理</Link>,
              },
            ],
          },
        ]
      : []),
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/admin')) {
      return ['admin', path]
    }
    if (path.startsWith('/documents/')) {
      return ['/documents']
    }
    return [path]
  }

  return (
    <AntLayout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white border-r border-gray-200"
        width={240}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <BookOutlined className="text-2xl text-blue-500" />
          {!collapsed && (
            <span className="ml-2 text-lg font-bold text-gray-800">
              知识库
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          className="border-r-0 mt-2"
        />
      </Sider>
      <AntLayout>
        <Header
          className="flex items-center justify-between px-4 bg-white border-b border-gray-200"
          style={{ padding: '0 16px', background: colorBgContainer }}
        >
          <Button
            type="text"
            icon={
              collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            }
            onClick={() => setCollapsed(!collapsed)}
            className="!w-12 !h-12"
          />
          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  size="small"
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                />
                <span className="text-gray-700">
                  {user?.nickname || user?.username}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className="m-6 p-6 bg-gray-50 min-h-[calc(100vh-64px)]"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
