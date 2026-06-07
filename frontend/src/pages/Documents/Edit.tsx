import { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Spin,
  Breadcrumb,
  Row,
  Col,
  Tag,
  Space,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
  GlobalOutlined,
  TeamOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { documentApi, categoryApi } from '@/api'
import { QuillEditor } from '@/components'
import { Status, DocumentPermission } from '@/types'
import type { Category } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface DocumentFormData {
  title: string
  summary?: string
  content: string
  categoryId: number
  status: Status
  permission: DocumentPermission
  changeDescription?: string
}

const permissionOptions = [
  {
    value: DocumentPermission.PUBLIC,
    label: (
      <Space>
        <GlobalOutlined />
        <span>公开 - 所有员工可见</span>
      </Space>
    ),
  },
  {
    value: DocumentPermission.DEPARTMENT,
    label: (
      <Space>
        <TeamOutlined />
        <span>部门可见 - 本部门员工可见</span>
      </Space>
    ),
  },
  {
    value: DocumentPermission.PRIVATE,
    label: (
      <Space>
        <LockOutlined />
        <span>仅自己可见 - 仅作者可见</span>
      </Space>
    ),
  },
]

const DocumentEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm<DocumentFormData>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [content, setContent] = useState('')
  const [originalDocument, setOriginalDocument] = useState<any>(null)
  const isEdit = !!id

  useEffect(() => {
    fetchCategories()
    if (isEdit && id) {
      fetchDocument()
    }
  }, [id, isEdit])

  const fetchCategories = async () => {
    try {
      const categories = await categoryApi.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const doc = await documentApi.getDocument(Number(id))
      setOriginalDocument(doc)
      form.setFieldsValue({
        title: doc.title,
        summary: doc.summary,
        categoryId: doc.categoryId,
        status: doc.status,
        permission: doc.permission || DocumentPermission.PUBLIC,
      })
      setContent(doc.content)
    } catch (error) {
      console.error('Fetch document error:', error)
      message.error('获取文档信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: DocumentFormData, action: 'save' | 'submit-review' | 'publish') => {
    if (!content.trim()) {
      message.error('请输入文档内容')
      return
    }

    try {
      setSubmitting(true)
      const data = {
        ...values,
        content,
      }

      if (action === 'save') {
        data.status = Status.DRAFT
      } else if (action === 'submit-review') {
        data.status = Status.PENDING_REVIEW
      } else if (action === 'publish') {
        data.status = Status.PUBLISHED
      }

      if (isEdit) {
        await documentApi.updateDocument(Number(id), data)
        message.success('更新成功')
      } else {
        await documentApi.createDocument(data)
        message.success(action === 'save' ? '草稿保存成功' : '创建成功')
      }

      navigate('/documents')
    } catch (error) {
      console.error('Submit error:', error)
      message.error('操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit(values, 'save')
    } catch {
      // Validation failed, error shown by form
    }
  }

  const handleSubmitReview = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit(values, 'submit-review')
    } catch {
      // Validation failed, error shown by form
    }
  }

  const handlePublish = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit(values, 'publish')
    } catch {
      // Validation failed, error shown by form
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link to="/documents">文档列表</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {isEdit ? '编辑文档' : '新建文档'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Title level={3} className="!mb-6">
          {isEdit ? '编辑文档' : '新建文档'}
        </Title>

        {isEdit && originalDocument && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Space wrap className="text-sm">
              <span className="text-gray-500">当前状态：</span>
              <Tag color={originalDocument.status === Status.PUBLISHED ? 'green' : originalDocument.status === Status.PENDING_REVIEW ? 'orange' : 'default'}>
                {originalDocument.status === Status.PUBLISHED ? '已发布' : originalDocument.status === Status.PENDING_REVIEW ? '待审核' : '草稿'}
              </Tag>
              <span className="text-gray-500">当前版本：</span>
              <Tag color="blue">v{originalDocument.version}</Tag>
            </Space>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: Status.DRAFT,
            permission: DocumentPermission.PUBLIC,
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="文档标题"
                rules={[
                  { required: true, message: '请输入文档标题' },
                  { max: 100, message: '标题不能超过100字' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="请输入文档标题"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="categoryId"
                label="文档分类"
                rules={[
                  { required: true, message: '请选择文档分类' },
                ]}
              >
                <Select
                  size="large"
                  placeholder="请选择分类"
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="permission"
                label="文档权限"
                rules={[
                  { required: true, message: '请选择文档权限' },
                ]}
                tooltip="选择谁可以查看这篇文档"
              >
                <Select
                  size="large"
                  placeholder="请选择文档权限"
                  options={permissionOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="文档摘要"
            rules={[{ max: 500, message: '摘要不能超过500字' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入文档摘要（可选）"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="文档内容"
            name="content"
            rules={[{ required: true, message: '请输入文档内容' }]}
          >
            <QuillEditor
              value={content}
              onChange={setContent}
              placeholder="请输入文档内容..."
            />
          </Form.Item>

          {isEdit && (
            <Form.Item
              name="changeDescription"
              label="变更说明"
              rules={[{ max: 200, message: '变更说明不能超过200字' }]}
              tooltip="简要描述本次修改的内容，将记录到版本历史中"
            >
              <TextArea
                rows={2}
                placeholder="请输入变更说明（可选），如：修复了XX问题、更新了XX内容"
                maxLength={200}
                showCount
              />
            </Form.Item>
          )}

          <Form.Item className="!mb-0">
            <div className="flex justify-between">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/documents')}
              >
                取消
              </Button>
              <div className="flex gap-3">
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                  loading={submitting}
                >
                  保存草稿
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleSubmitReview}
                  loading={submitting}
                >
                  提交审核
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePublish}
                  loading={submitting}
                >
                  {isEdit ? '更新并发布' : '直接发布'}
                </Button>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default DocumentEdit
