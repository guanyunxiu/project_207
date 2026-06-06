import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
  Tag,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { categoryApi } from '@/api'
import { useAppStore } from '@/store'
import { formatDate } from '@/utils'
import { Status } from '@/types'
import type { Category, CreateCategoryParams, UpdateCategoryParams } from '@/types'
import type { AppState } from '@/store'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Categories = () => {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form] = Form.useForm()
  const setCategoriesStore = useAppStore((state: AppState) => state.setCategories)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const categories = await categoryApi.getCategories()
      const sorted = [...categories].sort((a, b) => a.sort - b.sort)
      setCategories(sorted)
      setCategoriesStore(sorted)
    } catch (error) {
      console.error('获取分类列表失败', error)
      setCategories([
        {
          id: 1,
          name: '技术文档',
          code: 'tech',
          description: '技术相关的文档',
          sort: 1,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as Category,
        {
          id: 2,
          name: '管理制度',
          code: 'management',
          description: '公司管理制度',
          sort: 2,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as Category,
        {
          id: 3,
          name: '培训资料',
          code: 'training',
          description: '员工培训资料',
          sort: 3,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as Category,
        {
          id: 4,
          name: '产品介绍',
          code: 'product',
          description: '产品介绍文档',
          sort: 4,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as Category,
        {
          id: 5,
          name: '其他',
          code: 'other',
          description: '其他类型文档',
          sort: 5,
          status: 'inactive',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as Category,
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = () => {
    setEditingCategory(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setFieldsValue({
      name: category.name,
      code: category.code,
      description: category.description,
      sort: category.sort,
      status: category.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryApi.deleteCategory(id)
      message.success('删除成功')
      fetchCategories()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values: CreateCategoryParams) => {
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, values as UpdateCategoryParams)
        message.success('更新成功')
      } else {
        await categoryApi.createCategory(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchCategories()
    } catch (error) {
      console.error('操作失败', error)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return
    }

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index],
    ]

    setCategories(newCategories)

    try {
      await Promise.all([
        categoryApi.updateCategory(newCategories[index].id, { sort: index + 1 }),
        categoryApi.updateCategory(newCategories[targetIndex].id, { sort: targetIndex + 1 }),
      ])
      message.success('排序成功')
      fetchCategories()
    } catch (error) {
      console.error('排序失败', error)
      fetchCategories()
    }
  }

  const columns = [
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
      render: (_: number, __: Category, index: number) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMove(index, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === categories.length - 1}
            onClick={() => handleMove(index, 'down')}
          />
          <span className="text-gray-500">{index + 1}</span>
        </Space>
      ),
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === Status.ACTIVE ? 'green' : 'default'}>
          {status === Status.ACTIVE ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Category) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确定要删除该分类吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={3} className="!mb-0 flex items-center gap-2">
          <UnorderedListOutlined className="text-blue-500" />
          分类管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增分类
        </Button>
      </div>

      <Card className="shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={categories}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '名称最多50个字符' },
            ]}
          >
            <Input placeholder="请输入分类名称" size="large" />
          </Form.Item>

          <Form.Item
            name="code"
            label="分类编码"
            rules={[
              { required: true, message: '请输入分类编码' },
              { max: 50, message: '编码最多50个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '编码只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="请输入分类编码" size="large" disabled={!!editingCategory} />
          </Form.Item>

          <Form.Item
            name="description"
            label="分类描述"
            rules={[
              { max: 500, message: '描述最多500个字符' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请输入分类描述（选填）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="sort"
              label="排序"
              rules={[{ required: true, message: '请输入排序值' }]}
              initialValue={1}
            >
              <InputNumber
                min={1}
                max={999}
                placeholder="排序值"
                size="large"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
              initialValue={Status.ACTIVE}
            >
              <Select size="large">
                <Option value={Status.ACTIVE}>启用</Option>
                <Option value={Status.INACTIVE}>禁用</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="!mb-0">
            <div className="flex justify-end gap-4">
              <Button size="large" onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit">
                {editingCategory ? '保存' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Categories
