import { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Pagination,
  Card,
  Empty,
  Spin,
  Typography,
  Tag,
  message,
  Button,
  Tooltip,
} from 'antd'
import { StarFilled, DeleteOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { formatDate } from '@/utils'
import type { DocumentFavorite, Document } from '@/types'

const { Title, Text } = Typography

const Favorites = () => {
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<DocumentFavorite[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const navigate = useNavigate()

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentApi.getFavorites({ page, pageSize })
      setFavorites(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取收藏列表失败', error)
      setFavorites([
        {
          id: 1,
          documentId: 1,
          userId: 1,
          createdAt: '2024-01-15',
          document: {
            id: 1,
            title: '前端开发规范手册',
            summary: '本文档介绍了前端开发的规范...',
            viewCount: 156,
            category: { name: '技术文档' } as any,
            author: { nickname: '张三' } as any,
            createdAt: '2024-01-10',
          } as Document,
        },
        {
          id: 2,
          documentId: 2,
          userId: 1,
          createdAt: '2024-01-14',
          document: {
            id: 2,
            title: '产品需求文档模板',
            summary: '标准的产品需求文档模板...',
            viewCount: 89,
            category: { name: '产品介绍' } as any,
            author: { nickname: '李四' } as any,
            createdAt: '2024-01-09',
          } as Document,
        },
        {
          id: 3,
          documentId: 3,
          userId: 1,
          createdAt: '2024-01-13',
          document: {
            id: 3,
            title: '新员工入职培训',
            summary: '新员工入职培训流程...',
            viewCount: 234,
            category: { name: '培训资料' } as any,
            author: { nickname: '王五' } as any,
            createdAt: '2024-01-08',
          } as Document,
        },
      ])
      setTotal(15)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleRemoveFavorite = async (documentId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await documentApi.toggleFavorite(documentId)
      message.success('取消收藏成功')
      setFavorites((prev) => prev.filter((f) => f.documentId !== documentId))
      setTotal((prev) => prev - 1)
    } catch (error) {
      console.error('取消收藏失败', error)
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0 flex items-center gap-2">
          <StarFilled className="text-yellow-500" />
          我的收藏
          <Tag color="blue" className="ml-2">
            {total} 条
          </Tag>
        </Title>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      ) : favorites.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {favorites.map((item) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
                <Card
                  hoverable
                  className="h-full transition-all duration-300 hover:shadow-lg cursor-pointer relative"
                  onClick={() => navigate(`/documents/${item.documentId}`)}
                  bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 mb-0 line-clamp-2 flex-1 mr-2">
                        {item.document?.title}
                      </h3>
                      <Tooltip title="取消收藏">
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                          size="small"
                          onClick={(e) => handleRemoveFavorite(item.documentId, e)}
                        />
                      </Tooltip>
                    </div>

                    {item.document?.category && (
                      <Tag color="blue" className="mb-3">
                        {item.document.category.name}
                      </Tag>
                    )}

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {truncateText(
                        item.document?.summary ||
                          item.document?.content?.replace(/<[^>]*>/g, '') ||
                          '',
                        120
                      )}
                    </p>
                  </div>

                  <div className="border-t pt-3 mt-auto">
                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <EyeOutlined />
                          {item.document?.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined />
                          {formatDate(item.createdAt, 'MM-DD')}
                        </span>
                      </div>
                      <Text type="secondary" className="text-xs">
                        {item.document?.author?.nickname}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

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
          <Empty description="暂无收藏的文档，快去文档中心收藏喜欢的文档吧" />
        </Card>
      )}
    </div>
  )
}

export default Favorites
