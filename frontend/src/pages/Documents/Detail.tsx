import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Divider,
  Avatar,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  CalendarOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { useAppStore } from '@/store'
import { formatDate } from '@/utils'
import { Role } from '@/types'
import type { Document } from '@/types'
import type { AppState } from '@/store'

const { Title, Paragraph } = Typography

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAppStore((state: AppState) => state.user)
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<Document | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const canEdit =
    user &&
    document &&
    (user.id === document.authorId ||
      (user.role as Role) === Role.SUPER_ADMIN)

  useEffect(() => {
    if (id) {
      fetchDocument()
    }
  }, [id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const doc = await documentApi.getDocument(Number(id))
      setDocument(doc)
      setIsFavorite(doc.isFavorite || false)
    } catch (error) {
      console.error('获取文档失败', error)
      message.error('获取文档失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!id) return
    try {
      const result = await documentApi.toggleFavorite(Number(id))
      setIsFavorite(result.isFavorite)
      message.success(result.isFavorite ? '收藏成功' : '取消收藏成功')
    } catch (error) {
      console.error('操作失败', error)
      message.error('操作失败')
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await documentApi.deleteDocument(Number(id))
      message.success('删除成功')
      navigate('/documents')
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-16">
        <Paragraph type="secondary">文档不存在或已被删除</Paragraph>
        <Button type="primary" onClick={() => navigate('/documents')}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/documents')}
        >
          返回列表
        </Button>
        <Space>
          <Button
            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
            type={isFavorite ? 'primary' : 'default'}
            danger={isFavorite}
            onClick={handleFavorite}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
          {canEdit && (
            <>
              <Button
                icon={<EditOutlined />}
                type="primary"
                onClick={() => navigate(`/documents/${id}/edit`)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除这个文档吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button icon={<DeleteOutlined />} danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </div>

      <Card className="shadow-md">
        <div className="mb-6">
          <Title level={2} className="!mb-4">
            {document.title}
          </Title>
          <div className="flex flex-wrap items-center gap-4 text-gray-500">
            <Space>
              <Avatar
                src={document.author?.avatar}
                icon={<EyeOutlined />}
                size="small"
              />
              <span>{document.author?.nickname || document.author?.username}</span>
            </Space>
            <Space>
              <CalendarOutlined />
              <span>{formatDate(document.createdAt)}</span>
            </Space>
            <Space>
              <FolderOutlined />
              <span>{document.category?.name || '未分类'}</span>
            </Space>
            <Space>
              <EyeOutlined />
              <span>{document.viewCount || 0} 次浏览</span>
            </Space>
            {document.status && (
              <Tag color={document.status === 'published' ? 'green' : 'orange'}>
                {document.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            )}
          </div>
        </div>

        {document.summary && (
          <>
            <Divider />
            <div className="mb-6">
              <Title level={5} className="!mb-2">
                摘要
              </Title>
              <Paragraph type="secondary" className="!mb-0">
                {document.summary}
              </Paragraph>
            </div>
          </>
        )}

        <Divider />

        <div>
          <Title level={5} className="!mb-4">
            正文
          </Title>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>
      </Card>
    </div>
  )
}

export default DocumentDetail
