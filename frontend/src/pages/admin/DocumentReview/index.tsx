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
  Avatar,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { formatDate } from '@/utils'
import { Status } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { Document } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input

const DocumentReview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchPendingReviews()
  }, [page, pageSize])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const result = await documentApi.getPendingReviews({ page, pageSize })
      setDocuments(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取待审核文档失败', error)
      message.error('获取待审核文档失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (record: Document, action: 'approve' | 'reject') => {
    setCurrentDocument(record)
    setReviewAction(action)
    setReviewModalVisible(true)
    form.resetFields()
  }

  const handleSubmitReview = async (values: { reviewComment?: string }) => {
    if (!currentDocument) return

    try {
      setSubmitting(true)
      await documentApi.reviewDocument(currentDocument.id, {
        status: reviewAction === 'approve' ? Status.PUBLISHED : Status.REJECTED,
        reviewComment: values.reviewComment,
      })
      message.success(reviewAction === 'approve' ? '审核通过' : '审核拒绝')
      setReviewModalVisible(false)
      fetchPendingReviews()
    } catch (error) {
      console.error('审核失败', error)
      message.error('审核失败')
    } finally {
      setSubmitting(false)
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
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 100,
      render: (text: string) => text || '-',
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
      title: '部门',
      dataIndex: ['author', 'department'],
      key: 'department',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            className="text-green-500"
            onClick={() => handleReview(record, 'approve')}
          >
            通过
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            className="text-red-500"
            onClick={() => handleReview(record, 'reject')}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-1">
          <AuditOutlined className="mr-2" />
          文档审核
        </Title>
        <Text type="secondary">管理待审核的文档</Text>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="待审核文档"
              value={total}
              prefix={<FileTextOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-md">
        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
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
          locale={{
            emptyText: loading ? <Spin size="large" /> : <Empty description="暂无待审核文档" />,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {reviewAction === 'approve' ? (
              <CheckOutlined className="text-green-500" />
            ) : (
              <CloseOutlined className="text-red-500" />
            )}
            {reviewAction === 'approve' ? '审核通过' : '审核拒绝'}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        {currentDocument && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <Space className="text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FileTextOutlined />
                {currentDocument.title}
              </span>
              <span className="flex items-center gap-1">
                <UserOutlined />
                {currentDocument.author?.nickname || currentDocument.author?.username}
              </span>
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                {formatDate(currentDocument.createdAt)}
              </span>
            </Space>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReview}
        >
          <Form.Item
            name="reviewComment"
            label="审核意见"
            rules={[
              { max: 500, message: '审核意见不能超过500字' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={reviewAction === 'approve' ? '请输入审核意见（可选）' : '请输入拒绝原因'}
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item className="!mb-0">
            <div className="flex justify-end gap-3">
              <Button onClick={() => setReviewModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                danger={reviewAction === 'reject'}
                htmlType="submit"
                loading={submitting}
              >
                {reviewAction === 'approve' ? '确认通过' : '确认拒绝'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DocumentReview
