import { useState, useEffect } from 'react'
import {
  List,
  Card,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Empty,
  Tag,
  Avatar,
  Popconfirm,
  Badge,
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  MessageOutlined,
  LikeOutlined,
  AuditOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '@/api'
import { formatDate } from '@/utils'
import { NotificationType } from '@/types'
import type { Notification } from '@/types'

const { Title, Text } = Typography

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.COMMENT:
      return <MessageOutlined className="text-blue-500" />
    case NotificationType.MENTION:
      return <UserOutlined className="text-purple-500" />
    case NotificationType.LIKE:
      return <LikeOutlined className="text-red-500" />
    case NotificationType.REVIEW:
      return <AuditOutlined className="text-orange-500" />
    case NotificationType.SYSTEM:
      return <BellOutlined className="text-gray-500" />
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
    case NotificationType.SYSTEM:
      return '系统'
    default:
      return '通知'
  }
}

const Notifications = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<NotificationType | undefined>()

  useEffect(() => {
    fetchNotifications()
  }, [page, pageSize, filterType])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const result = await notificationApi.getNotifications({
        page,
        pageSize,
        type: filterType,
      })
      setNotifications(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取通知失败', error)
      message.error('获取通知失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, isRead: true } : item))
      )
      message.success('标记已读成功')
    } catch (error) {
      console.error('标记已读失败', error)
      message.error('标记已读失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev =>
        prev.map(item => ({ ...item, isRead: true }))
      )
      message.success('全部标记已读成功')
    } catch (error) {
      console.error('标记已读失败', error)
      message.error('标记已读失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id)
      setNotifications(prev => prev.filter(item => item.id !== id))
      setTotal(prev => prev - 1)
      message.success('删除成功')
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    if (notification.documentId) {
      navigate(`/documents/${notification.documentId}`)
    }
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1">
            通知中心
          </Title>
          <Text type="secondary">
            共 {total} 条通知，其中 {notifications.filter(n => !n.isRead).length} 条未读
          </Text>
        </div>
        <Space>
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter(n => !n.isRead).length === 0}
          >
            全部标为已读
          </Button>
        </Space>
      </div>

      <Card className="shadow-md">
        <Space className="mb-4">
          <Button
            type={filterType === undefined ? 'primary' : 'default'}
            onClick={() => setFilterType(undefined)}
          >
            全部
          </Button>
          <Button
            type={filterType === NotificationType.COMMENT ? 'primary' : 'default'}
            onClick={() => setFilterType(NotificationType.COMMENT)}
          >
            评论
          </Button>
          <Button
            type={filterType === NotificationType.MENTION ? 'primary' : 'default'}
            onClick={() => setFilterType(NotificationType.MENTION)}
          >
            @提及
          </Button>
          <Button
            type={filterType === NotificationType.LIKE ? 'primary' : 'default'}
            onClick={() => setFilterType(NotificationType.LIKE)}
          >
            点赞
          </Button>
          <Button
            type={filterType === NotificationType.REVIEW ? 'primary' : 'default'}
            onClick={() => setFilterType(NotificationType.REVIEW)}
          >
            审核
          </Button>
        </Space>

        {notifications.length === 0 ? (
          <Empty description="暂无通知" />
        ) : (
          <List
            dataSource={notifications}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${!item.isRead ? 'bg-blue-50/50' : ''}`}
                onClick={() => handleClick(item)}
                actions={[
                  !item.isRead && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(item.id)
                      }}
                    >
                      标为已读
                    </Button>
                  ),
                  <Popconfirm
                    title="确定删除这条通知吗？"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      handleDelete(item.id)
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      删除
                    </Button>
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={!item.isRead}>
                      {item.sender ? (
                        <Avatar
                          src={item.sender.avatar}
                          icon={<EyeOutlined />}
                          size="default"
                        />
                      ) : (
                        <Avatar icon={getNotificationIcon(item.type)} />
                      )}
                    </Badge>
                  }
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color={item.isRead ? 'default' : 'blue'}>
                        {getNotificationTypeText(item.type)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      {item.content && (
                        <p className="text-gray-600 mb-1">{item.content}</p>
                      )}
                      <Text type="secondary" className="text-xs">
                        {formatDate(item.createdAt)}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default Notifications
