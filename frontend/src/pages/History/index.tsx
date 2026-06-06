import { useState, useEffect, useCallback } from 'react'
import {
  List,
  Pagination,
  Card,
  Empty,
  Spin,
  Typography,
  Tag,
  Avatar,
  Space,
  Button,
} from 'antd'
import {
  HistoryOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { formatDate } from '@/utils'
import type { DocumentView, Document } from '@/types'

const { Title, Text } = Typography

const History = () => {
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<DocumentView[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const navigate = useNavigate()

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentApi.getViewHistory({ page, pageSize })
      setHistory(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取浏览历史失败', error)
      setHistory([
        {
          id: 1,
          documentId: 1,
          userId: 1,
          viewedAt: '2024-01-15T14:30:00Z',
          document: {
            id: 1,
            title: '前端开发规范手册',
            summary: '本文档介绍了前端开发的规范...',
            viewCount: 156,
            category: { name: '技术文档' } as any,
            author: { nickname: '张三', avatar: '' } as any,
            createdAt: '2024-01-10',
          } as Document,
        },
        {
          id: 2,
          documentId: 2,
          userId: 1,
          viewedAt: '2024-01-15T10:20:00Z',
          document: {
            id: 2,
            title: '产品需求文档模板',
            summary: '标准的产品需求文档模板...',
            viewCount: 89,
            category: { name: '产品介绍' } as any,
            author: { nickname: '李四', avatar: '' } as any,
            createdAt: '2024-01-09',
          } as Document,
        },
        {
          id: 3,
          documentId: 3,
          userId: 1,
          viewedAt: '2024-01-14T16:45:00Z',
          document: {
            id: 3,
            title: '新员工入职培训',
            summary: '新员工入职培训流程...',
            viewCount: 234,
            category: { name: '培训资料' } as any,
            author: { nickname: '王五', avatar: '' } as any,
            createdAt: '2024-01-08',
          } as Document,
        },
        {
          id: 4,
          documentId: 4,
          userId: 1,
          viewedAt: '2024-01-14T09:15:00Z',
          document: {
            id: 4,
            title: '项目管理流程规范',
            summary: '详细的项目管理流程...',
            viewCount: 178,
            category: { name: '管理制度' } as any,
            author: { nickname: '赵六', avatar: '' } as any,
            createdAt: '2024-01-07',
          } as Document,
        },
        {
          id: 5,
          documentId: 5,
          userId: 1,
          viewedAt: '2024-01-13T15:00:00Z',
          document: {
            id: 5,
            title: '代码审查最佳实践',
            summary: '代码审查的标准流程和要点...',
            viewCount: 267,
            category: { name: '技术文档' } as any,
            author: { nickname: '孙七', avatar: '' } as any,
            createdAt: '2024-01-06',
          } as Document,
        },
      ])
      setTotal(28)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0 flex items-center gap-2">
          <HistoryOutlined className="text-blue-500" />
          浏览历史
          <Tag color="blue" className="ml-2">
            {total} 条
          </Tag>
        </Title>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      ) : history.length > 0 ? (
        <>
          <Card className="shadow-sm">
            <List
              dataSource={history}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer px-4 py-4 -mx-4 rounded-lg"
                  onClick={() => navigate(`/documents/${item.documentId}`)}
                  actions={[
                    <Button
                      type="link"
                      key="view"
                      icon={<ArrowRightOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/documents/${item.documentId}`)
                      }}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={item.document?.author?.avatar}
                        icon={<UserOutlined />}
                        size="large"
                      />
                    }
                    title={
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-gray-800 hover:text-blue-600">
                          {item.document?.title}
                        </span>
                        {item.document?.category && (
                          <Tag color="blue">{item.document.category.name}</Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="space-y-2">
                        <Text type="secondary" className="block">
                          {truncateText(
                            item.document?.summary ||
                              item.document?.content?.replace(/<[^>]*>/g, '') ||
                              '',
                            150
                          )}
                        </Text>
                        <Space size="large" className="text-gray-500 text-sm">
                          <Space size={4}>
                            <UserOutlined />
                            <span>{item.document?.author?.nickname}</span>
                          </Space>
                          <Space size={4}>
                            <EyeOutlined />
                            <span>{item.document?.viewCount || 0} 次浏览</span>
                          </Space>
                          <Space size={4}>
                            <ClockCircleOutlined />
                            <span>浏览于 {formatDate(item.viewedAt)}</span>
                          </Space>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {total > pageSize && (
            <div className="flex justify-center mt-8">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          )}
        </>
      ) : (
        <Card className="shadow-sm">
          <Empty description="暂无浏览历史，快去文档中心看看吧" />
        </Card>
      )}
    </div>
  )
}

export default History
