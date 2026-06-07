import { useState, useEffect } from 'react'
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  theme,
  Badge,
  List,
  Typography,
  Empty,
  Space,
  Tag,
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
  BellOutlined,
  AuditOutlined,
  FormOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import { Role, NotificationType } from '@/types'
import { notificationApi } from '@/api'
import { formatDate } from '@/utils'
import type { Notification } from '@/types'

const { Header, Sider, Content } = AntLayout
const { Text } = Typography

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.COMMENT:
      return <FileTextOutlined className="text-blue-500" />
    case NotificationType.MENTION:
      return <UserOutlined className="text-purple-500" />
    case NotificationType.LIKE:
      return <HeartOutlined className="text-red-500" />
    case NotificationType.REVIEW:
      return <AuditOutlined className="text-orange-500" />
    default:
      return <BellOutlined className="text-gray-500" />
  }
}

const getNotificationTypeText = (type: NotificationType) => {
  switch (type) {
    case NotificationType.COMMENT:
      return '评论'
    case NotificationType.MENTION:
      return '@提及'
    case NotificationType.LIKE:
      return '点赞'
    case NotificationType.REVIEW:
      return '审核'
    default:
      return '系统'
  }
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAppStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const isAdmin = user?.role === Role.SUPER_ADMIN || user?.role === Role.HR_ADMIN || user?.role === Role.ASSESSMENT_ADMIN

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
    }
  }, [user?.id])

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationApi.getUnreadCount()
      setUnreadCount(result.count || 0)
    } catch (error) {
      console.error('获取未读通知数失败', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true)
      const result = await notificationApi.getNotifications({
        page: 1,
        pageSize: 5,
        isRead: false,
      })
      setNotifications(result.list || [])
    } catch (error) {
      console.error('获取通知列表失败', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await notificationApi.markAsRead(notification.id)
      setUnreadCount(Math.max(0, unreadCount - 1))
      if (notification.documentId) {
        navigate(`/documents/${notification.documentId}`)
      } else {
        navigate('/notifications')
      }
    } catch (error) {
      console.error('标记已读失败', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications([])
    } catch (error) {
      console.error('全部标记已读失败', error)
    }
  }

  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      label: (
        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
          <span className="font-medium">最新通知</span>
          <Button
            type="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleMarkAllAsRead()
            }}
          >
            全部已读
          </Button>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'list',
      label: (
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            minWidth: '320px',
          }}
        >
          {notificationLoading ? (
            <div className="p-8 text-center">
              <Empty description="加载中..." />
            </div>
          ) : notifications.length > 0 ? (
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className="!border-b !border-gray-100 cursor-pointer hover:bg-gray-50 !px-2"
                  onClick={() => handleNotificationClick(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {getNotificationIcon(item.type)}
                      </div>
                    }
                    title={
                      <Space className="w-full">
                        <span className="font-medium">{item.title}</span>
                        <Tag
                          color={
                            item.type === NotificationType.COMMENT
                              ? 'blue'
                              : item.type === NotificationType.MENTION
                              ? 'purple'
                              : item.type === NotificationType.LIKE
                              ? 'red'
                              : 'orange'
                          }
                        >
                          {getNotificationTypeText(item.type)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" className="text-sm">
                          {item.content}
                        </Text>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(item.createdAt, 'MM-DD HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="p-8 text-center">
              <Empty description="暂无新通知" />
            </div>
          )}
        </div>
      ),
      disabled: true,
    },
    {
      key: 'view-all',
      label: (
        <div
          className="text-center text-blue-600 cursor-pointer hover:text-blue-800 py-2 border-t border-gray-100"
          onClick={() => navigate('/notifications')}
        >
          查看全部通知
        </div>
      ),
      disabled: true,
    },
  ]

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
      key: '/notifications',
      icon: <BellOutlined />,
      label: (
        <Link to="/notifications" className="relative">
          通知中心
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              size="small"
              className="absolute -right-2 -top-1"
            />
          )}
        </Link>
      ),
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
    {
      key: '/assessments',
      icon: <SmileOutlined />,
      label: <Link to="/assessments">心理测评</Link>,
    },
    ...(isAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '系统管理',
            children: [
              {
                key: '/admin/documents/review',
                icon: <AuditOutlined />,
                label: <Link to="/admin/documents/review">文档审核</Link>,
              },
              {
                key: '/admin/documents',
                icon: <FileTextOutlined />,
                label: <Link to="/admin/documents">文档管理</Link>,
              },
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
          {
            key: 'assessment',
            icon: <FormOutlined />,
            label: '测评管理',
            children: [
              {
                key: '/admin/questions',
                icon: <QuestionCircleOutlined />,
                label: <Link to="/admin/questions">题库管理</Link>,
              },
              {
                key: '/admin/scales',
                icon: <UnorderedListOutlined />,
                label: <Link to="/admin/scales">量表管理</Link>,
              },
              {
                key: '/admin/assessment-tasks',
                icon: <SendOutlined />,
                label: <Link to="/admin/assessment-tasks">任务发放</Link>,
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
      key: 'notifications',
      icon: <BellOutlined />,
      label: (
        <span className="flex items-center justify-between">
          我的通知
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" />
          )}
        </span>
      ),
      onClick: () => navigate('/notifications'),
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
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              onOpenChange={(open) => open && fetchNotifications()}
            >
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  className="!w-10 !h-10"
                />
              </Badge>
            </Dropdown>
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
