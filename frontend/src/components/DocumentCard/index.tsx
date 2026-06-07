import { useState, useEffect } from 'react'
import { Card, Tag, Button, Avatar, Tooltip, Popconfirm, message } from 'antd'
import {
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'
import { documentApi } from '@/api'
import { Document, Role } from '@/types'

interface DocumentCardProps {
  document: Document
  isFavorite?: boolean
  onFavoriteChange?: (id: number, isFavorite: boolean) => void
  onDelete?: (id: number) => void
  showActions?: boolean
}

const DocumentCard = ({
  document,
  isFavorite = false,
  onFavoriteChange,
  onDelete,
  showActions = true,
}: DocumentCardProps) => {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [favoriting, setFavoriting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite)

  useEffect(() => {
    setLocalIsFavorite(isFavorite)
  }, [isFavorite])

  const isAuthor = user?.id === document.authorId
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN
  const canEdit = isAuthor || isSuperAdmin

  const handleCardClick = () => {
    navigate(`/documents/${document.id}`)
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (favoriting) return

    try {
      setFavoriting(true)
      const result = await documentApi.toggleFavorite(document.id)
      const newFavoriteState = result.isFavorite
      setLocalIsFavorite(newFavoriteState)
      onFavoriteChange?.(document.id, newFavoriteState)
      message.success(newFavoriteState ? '已收藏' : '已取消收藏')
    } catch (error) {
      console.error('Favorite toggle error:', error)
      message.error('操作失败，请重试')
    } finally {
      setFavoriting(false)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/documents/${document.id}/edit`)
  }

  const handleDeleteClick = async () => {
    if (deleting) return

    try {
      setDeleting(true)
      await documentApi.deleteDocument(document.id)
      message.success('删除成功')
      onDelete?.(document.id)
    } catch (error) {
      console.error('Delete error:', error)
      message.error('删除失败，请重试')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card
      hoverable
      className="h-full transition-all duration-300 hover:shadow-lg cursor-pointer group"
      onClick={handleCardClick}
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-500 transition-colors m-0">
              {document.title}
            </h3>
            {showActions && (
              <Button
                type="text"
                icon={
                  localIsFavorite ? (
                    <HeartFilled className="text-red-500" />
                  ) : (
                    <HeartOutlined />
                  )
                }
                onClick={handleFavoriteClick}
                loading={favoriting}
                className="!flex !items-center !justify-center !p-0"
              />
            )}
          </div>
          <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-3">
            {document.summary || '暂无摘要'}
          </p>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            {document.category && (
              <Tag
                icon={<FolderOutlined />}
                color="blue"
                className="!mb-0"
              >
                {document.category.name}
              </Tag>
            )}
            {document.status && (
              <Tag
                color={
                  document.status === 'published' ? 'green' : 'orange'
                }
                className="!mb-0"
              >
                {document.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-2">
              <Avatar
                size="small"
                src={document.author?.avatar}
                icon={!document.author?.avatar && <UserOutlined />}
              />
              <span>{document.author?.nickname || document.author?.username || '未知作者'}</span>
            </div>
            <div className="flex items-center gap-1">
              <EyeOutlined />
              <span>{document.viewCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <CalendarOutlined />
              <span>{dayjs(document.createdAt).format('YYYY-MM-DD')}</span>
            </div>
            {showActions && canEdit && (
              <div className="flex items-center gap-1">
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={handleEditClick}
                    className="!p-1"
                  />
                </Tooltip>
                <Popconfirm
                  title="确定删除这篇文档吗？"
                  description="删除后无法恢复"
                  onConfirm={handleDeleteClick}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true, loading: deleting }}
                >
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="!p-1"
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default DocumentCard
