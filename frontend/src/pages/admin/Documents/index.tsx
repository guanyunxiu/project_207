import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Empty,
  Table,
  Tag,
  Avatar,
  Select,
  Input,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd'
import type { Key } from 'antd/es/table/interface'
import {
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { formatDate } from '@/utils'
import { Status, DocumentPermission } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { Document } from '@/types'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

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

const getPermissionText = (permission: DocumentPermission) => {
  switch (permission) {
    case DocumentPermission.PUBLIC:
      return '公开'
    case DocumentPermission.DEPARTMENT:
      return '部门可见'
    case DocumentPermission.PRIVATE:
      return '仅自己可见'
    default:
      return permission
  }
}

const DocumentManagement = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | undefined>()
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
  })

  useEffect(() => {
    fetchDocuments()
    fetchStats()
  }, [page, pageSize, keyword, statusFilter])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const result = await documentApi.getDocuments({
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter,
      })
      setDocuments(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取文档列表失败', error)
      message.error('获取文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await documentApi.getStats()
      setStats({
        total: result.totalDocuments,
        published: result.publishedDocuments,
        pending: result.pendingReviewDocuments,
        draft: result.draftDocuments,
      })
    } catch (error) {
      console.error('获取统计数据失败', error)
    }
  }

  const handleBatchAction = async (action: 'publish' | 'reject' | 'delete' | 'restore') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的文档')
      return
    }

    try {
      const result = await documentApi.batchManage({
        ids: selectedRowKeys.map(Number),
        action,
      })
      message.success(result.message)
      setSelectedRowKeys([])
      fetchDocuments()
      fetchStats()
    } catch (error) {
      console.error('批量操作失败', error)
      message.error('批量操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await documentApi.deleteDocument(id)
      message.success('删除成功')
      fetchDocuments()
      fetchStats()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const columns: ColumnsType<Document> = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Document) => (
        <Space>
          <span
            className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            onClick={() => navigate(`/documents/${record.id}`)}
          >
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      width: 100,
      render: (permission: DocumentPermission) => (
        <Tag color={permission === DocumentPermission.PUBLIC ? 'green' : permission === DocumentPermission.DEPARTMENT ? 'blue' : 'orange'}>
          {getPermissionText(permission)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '作者',
      key: 'author',
      width: 150,
      render: (_: any, record: Document) => (
        <Space>
          <Avatar
            size="small"
            src={record.author?.avatar}
            icon={<UserOutlined />}
          />
          <span>{record.author?.nickname || record.author?.username}</span>
        </Space>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '点赞数',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 80,
    },
    {
      title: '评论数',
      dataIndex: 'commentCount',
      key: 'commentCount',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Document) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/documents/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定删除这个文档吗？"
            onConfirm={() => handleDelete(record.id)}
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
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-1">
          <FileTextOutlined className="mr-2" />
          文档管理
        </Title>
        <Text type="secondary">批量管理所有文档</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="文档总数"
              value={stats.total}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="已发布"
              value={stats.published}
              prefix={<CheckOutlined className="text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ReloadOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="草稿"
              value={stats.draft}
              prefix={<FileTextOutlined className="text-gray-500" />}
              valueStyle={{ color: '#6b7280' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space className="flex-wrap">
            <Search
              placeholder="搜索文档标题"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={(value) => setKeyword(value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value={Status.DRAFT}>草稿</Option>
              <Option value={Status.PENDING_REVIEW}>待审核</Option>
              <Option value={Status.PUBLISHED}>已发布</Option>
              <Option value={Status.REJECTED}>已拒绝</Option>
            </Select>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleBatchAction('publish')}
              disabled={selectedRowKeys.length === 0}
            >
              批量发布
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => handleBatchAction('reject')}
              disabled={selectedRowKeys.length === 0}
            >
              批量拒绝
            </Button>
            <Popconfirm
              title="确定批量删除选中的文档吗？"
              onConfirm={() => handleBatchAction('delete')}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
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
          locale={{
            emptyText: loading ? <Spin size="large" /> : <Empty description="暂无文档" />,
          }}
        />
      </Card>
    </div>
  )
}

export default DocumentManagement
