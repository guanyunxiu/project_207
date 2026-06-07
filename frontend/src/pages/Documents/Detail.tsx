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
  Form,
  Input,
  List,
  Modal,
  Select,
  Dropdown,
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
  LikeOutlined,
  LikeFilled,
  CommentOutlined,
  HistoryOutlined,
  DownloadOutlined,
  MoreOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
  GlobalOutlined,
  LockOutlined,
  ReloadOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { documentApi, userApi } from '@/api'
import { useAppStore } from '@/store'
import { formatDate } from '@/utils'
import {
  Role,
  Status,
  DocumentPermission,
} from '@/types'
import type {
  Document,
  DocumentComment,
  User,
} from '@/types'
import type { AppState } from '@/store'
import type { MenuProps } from 'antd'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const getStatusColor = (status: Status) => {
  switch (status) {
    case Status.PUBLISHED:
      return 'green'
    case Status.PENDING_REVIEW:
      return 'orange'
    case Status.DRAFT:
      return 'default'
    case Status.REJECTED:
      return 'red'
    default:
      return 'default'
  }
}

const getStatusText = (status: Status) => {
  switch (status) {
    case Status.PUBLISHED:
      return '已发布'
    case Status.PENDING_REVIEW:
      return '待审核'
    case Status.DRAFT:
      return '草稿'
    case Status.REJECTED:
      return '已拒绝'
    default:
      return status
  }
}

const getPermissionIcon = (permission: DocumentPermission) => {
  switch (permission) {
    case DocumentPermission.PUBLIC:
      return <GlobalOutlined />
    case DocumentPermission.DEPARTMENT:
      return <TeamOutlined />
    case DocumentPermission.PRIVATE:
      return <LockOutlined />
  }
}

const getPermissionText = (permission: DocumentPermission) => {
  switch (permission) {
    case DocumentPermission.PUBLIC:
      return '公开'
    case DocumentPermission.DEPARTMENT:
      return '部门可见'
    case DocumentPermission.PRIVATE:
      return '仅自己可见'
  }
}

const getPermissionColor = (permission: DocumentPermission) => {
  switch (permission) {
    case DocumentPermission.PUBLIC:
      return 'green'
    case DocumentPermission.DEPARTMENT:
      return 'blue'
    case DocumentPermission.PRIVATE:
      return 'orange'
  }
}

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAppStore((state: AppState) => state.user)
  const [loading, setLoading] = useState(true)
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentForm] = Form.useForm()
  const [submittingComment, setSubmittingComment] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [mentionModalVisible, setMentionModalVisible] = useState(false)
  const [selectedMentionUsers, setSelectedMentionUsers] = useState<number[]>([])
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html'>('markdown')
  const [exporting, setExporting] = useState(false)
  const [replyTo, setReplyTo] = useState<DocumentComment | null>(null)

  const canEdit =
    user &&
    currentDoc &&
    (user.id === currentDoc.authorId ||
      (user.role as Role) === Role.SUPER_ADMIN)

  const canReview =
    user &&
    currentDoc &&
    currentDoc.status === Status.PENDING_REVIEW &&
    ((user.role as Role) === Role.SUPER_ADMIN ||
     (user.role as Role) === Role.ADMIN)

  useEffect(() => {
    if (id) {
      fetchDocument()
      fetchComments()
      fetchUsers()
    }
  }, [id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const doc = await documentApi.getDocument(Number(id))
      setCurrentDoc(doc)
      setIsFavorite(doc.isFavorite || false)
      setIsLiked(doc.isLiked || false)
      setLikeCount(doc.likeCount || 0)
    } catch (error) {
      console.error('获取文档失败', error)
      message.error('获取文档失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      const result = await documentApi.getComments(Number(id))
      setComments(result.list || [])
    } catch (error) {
      console.error('获取评论失败', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const result = await userApi.getAllUsers()
      setUsers(result || [])
    } catch (error) {
      console.error('获取用户列表失败', error)
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

  const handleLike = async () => {
    if (!id || !user) {
      message.warning('请先登录')
      return
    }
    try {
      const result = await documentApi.toggleLike(Number(id))
      setIsLiked(result.isLiked)
      setLikeCount(result.likeCount)
    } catch (error) {
      console.error('点赞失败', error)
      message.error('点赞失败')
    }
  }

  const handleSubmitComment = async (values: { content: string }) => {
    if (!id || !user) return

    try {
      setSubmittingComment(true)
      await documentApi.createComment({
        documentId: Number(id),
        content: values.content,
        parentId: replyTo?.id,
        mentionedUserIds: selectedMentionUsers.length > 0 ? selectedMentionUsers : undefined,
      })
      message.success('评论成功')
      commentForm.resetFields()
      setSelectedMentionUsers([])
      setReplyTo(null)
      fetchComments()
      if (currentDoc) {
        setCurrentDoc({
          ...currentDoc,
          commentCount: (currentDoc.commentCount || 0) + 1,
        })
      }
    } catch (error) {
      console.error('评论失败', error)
      message.error('评论失败')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await documentApi.deleteComment(commentId)
      message.success('删除成功')
      fetchComments()
      if (currentDoc) {
        setCurrentDoc({
          ...currentDoc,
          commentCount: Math.max(0, (currentDoc.commentCount || 0) - 1),
        })
      }
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleExport = async () => {
    if (!id) return
    try {
      setExporting(true)
      const result = await documentApi.exportDocument(Number(id), exportFormat)
      
      const blob = new Blob([result.content], {
        type: exportFormat === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/html;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = result.filename || `${currentDoc?.title || 'document'}.${exportFormat === 'markdown' ? 'md' : 'html'}`
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      message.success('导出成功')
      setExportModalVisible(false)
    } catch (error) {
      console.error('导出失败', error)
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!id) return
    try {
      await documentApi.submitForReview(Number(id))
      message.success('已提交审核')
      fetchDocument()
    } catch (error) {
      console.error('提交审核失败', error)
      message.error('提交审核失败')
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!id) return
    Modal.confirm({
      title: action === 'approve' ? '审核通过' : '审核拒绝',
      content: `确定要${action === 'approve' ? '通过' : '拒绝'}这篇文档的审核吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: action === 'reject' },
      onOk: async () => {
        try {
          await documentApi.reviewDocument(Number(id), {
            status: action === 'approve' ? Status.PUBLISHED : Status.REJECTED,
          })
          message.success(action === 'approve' ? '审核通过' : '审核拒绝')
          fetchDocument()
        } catch (error) {
          console.error('审核失败', error)
          message.error('审核失败')
        }
      },
    })
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

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'versions',
      label: '版本历史',
      icon: <HistoryOutlined />,
      onClick: () => navigate(`/documents/${id}/versions`),
    },
    {
      key: 'export',
      label: '导出文档',
      icon: <DownloadOutlined />,
      onClick: () => setExportModalVisible(true),
    },
  ]

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
            icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
            type={isLiked ? 'primary' : 'default'}
            onClick={handleLike}
          >
            <span className="flex items-center gap-1">
              {isLiked ? '已点赞' : '点赞'}
              <Text type="secondary" className="!text-inherit">
                ({likeCount})
              </Text>
            </span>
          </Button>
          <Button
            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
            type={isFavorite ? 'primary' : 'default'}
            danger={isFavorite}
            onClick={handleFavorite}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
          <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
            <Button icon={<MoreOutlined />} />
          </Dropdown>
          {currentDoc?.status === Status.DRAFT && canEdit && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleSubmitReview}
            >
              提交审核
            </Button>
          )}
          {canReview && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleReview('approve')}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReview('reject')}
              >
                拒绝
              </Button>
            </>
          )}
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
            {currentDoc?.title}
          </Title>
          <div className="flex flex-wrap items-center gap-4 text-gray-500">
            <Space>
              <Avatar
                src={currentDoc?.author?.avatar}
                icon={<UserOutlined />}
                size="small"
              />
              <span>{currentDoc?.author?.nickname || currentDoc?.author?.username}</span>
            </Space>
            <Space>
              <CalendarOutlined />
              <span>{currentDoc?.createdAt && formatDate(currentDoc.createdAt)}</span>
            </Space>
            <Space>
              <FolderOutlined />
              <span>{currentDoc?.category?.name || '未分类'}</span>
            </Space>
            <Space>
              <EyeOutlined />
              <span>{currentDoc?.viewCount || 0} 次浏览</span>
            </Space>
            <Space>
              <CommentOutlined />
              <span>{currentDoc?.commentCount || 0} 条评论</span>
            </Space>
            {currentDoc?.status && (
              <Tag color={getStatusColor(currentDoc?.status as Status)}>
                {getStatusText(currentDoc?.status as Status)}
              </Tag>
            )}
            {currentDoc?.permission && (
              <Tag
                color={getPermissionColor(currentDoc?.permission as DocumentPermission)}
                icon={getPermissionIcon(currentDoc?.permission as DocumentPermission)}
              >
                {getPermissionText(currentDoc?.permission as DocumentPermission)}
              </Tag>
            )}
            {currentDoc?.status === Status.REJECTED && currentDoc?.reviewComment && (
              <Tag color="red" className="ml-2">
                拒绝原因：{currentDoc?.reviewComment}
              </Tag>
            )}
          </div>
        </div>

        {currentDoc?.summary && (
          <>
            <Divider />
            <div className="mb-6">
              <Title level={5} className="!mb-2">
                摘要
              </Title>
              <Paragraph type="secondary" className="!mb-0">
                {currentDoc?.summary}
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
            dangerouslySetInnerHTML={{ __html: currentDoc?.content || '' }}
          />
        </div>
      </Card>

      <Card
        title={
          <span className="flex items-center gap-2">
            <CommentOutlined />
            评论 ({currentDoc?.commentCount || 0})
          </span>
        }
        className="shadow-md"
      >
        {user && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <Form
              form={commentForm}
              onFinish={handleSubmitComment}
              layout="vertical"
            >
              {replyTo && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm">
                  <span className="text-blue-600">
                    回复 @{replyTo.author?.nickname || replyTo.author?.username}：
                  </span>
                  <span className="ml-2">{replyTo.content}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    className="float-right"
                    onClick={() => setReplyTo(null)}
                  />
                </div>
              )}
              <Form.Item
                name="content"
                rules={[{ required: true, message: '请输入评论内容' }]}
                className="!mb-2"
              >
                <TextArea
                  rows={3}
                  placeholder={replyTo ? `回复 @${replyTo.author?.nickname || replyTo.author?.username}...` : '发表评论...'}
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
              <div className="flex items-center justify-between">
                <Button
                  type="text"
                  icon={<UserOutlined />}
                  onClick={() => setMentionModalVisible(true)}
                >
                  {selectedMentionUsers.length > 0
                    ? `已@${selectedMentionUsers.length}人`
                    : '@员工'}
                </Button>
                <Space>
                  {replyTo && (
                    <Button onClick={() => setReplyTo(null)}>
                      取消回复
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={submittingComment}
                  >
                    发表评论
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}

        <List
          loading={commentsLoading}
          dataSource={comments}
          locale={{ emptyText: '暂无评论，快来抢沙发吧~' }}
          renderItem={(comment) => (
            <List.Item
              key={comment.id}
              className="!py-4 !px-0 !border-b !border-gray-100 last:!border-b-0"
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={comment.author?.avatar}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Space>
                    <span className="font-medium">
                      {comment.author?.nickname || comment.author?.username}
                    </span>
                    {comment.parentId && comment.parentComment && (
                      <Text type="secondary" className="text-sm">
                        回复 @{comment.parentComment.author?.nickname || comment.parentComment.author?.username}
                      </Text>
                    )}
                    <Text type="secondary" className="text-sm">
                      {formatDate(comment.createdAt)}
                    </Text>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph className="!mb-2 text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </Paragraph>
                    {comment.mentionedUsers && comment.mentionedUsers.length > 0 && (
                      <div className="mb-2">
                        {comment.mentionedUsers.map((u) => (
                          <Tag key={u.id} color="blue">
                            @{u.nickname || u.username}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        icon={<CommentOutlined />}
                        onClick={() => {
                          setReplyTo(comment)
                          commentForm.resetFields()
                        }}
                      >
                        回复
                      </Button>
                      {user && (user.id === comment.authorId || (user.role as Role) === Role.SUPER_ADMIN) && (
                        <Popconfirm
                          title="确定删除这条评论吗？"
                          onConfirm={() => handleDeleteComment(comment.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="选择要@的员工"
        open={mentionModalVisible}
        onCancel={() => setMentionModalVisible(false)}
        onOk={() => setMentionModalVisible(false)}
        width={500}
      >
        <Select
          mode="multiple"
          placeholder="搜索并选择员工"
          style={{ width: '100%' }}
          value={selectedMentionUsers}
          onChange={setSelectedMentionUsers}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={users.map((u) => ({
            label: `${u.nickname || u.username} (${u.department || '未分配'})`,
            value: u.id,
          }))}
        />
      </Modal>

      <Modal
        title="导出文档"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setExportModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExport}
          >
            导出
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Paragraph type="secondary">
            选择导出格式：
          </Paragraph>
          <Select
            value={exportFormat}
            onChange={setExportFormat}
            style={{ width: '100%' }}
          >
            <Option value="markdown">Markdown (.md)</Option>
            <Option value="html">HTML (.html)</Option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentDetail
