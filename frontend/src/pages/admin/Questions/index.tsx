import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Card,
  InputNumber,
  Radio,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { assessmentsApi } from '@/api'
import { QuestionType, Status, type Question, type PaginationResult } from '@/types'
import { useRequest } from '@/hooks'

const { TextArea } = Input
const { Option } = Select

const QuestionTypeText: Record<QuestionType, string> = {
  [QuestionType.SINGLE]: '单选题',
  [QuestionType.MULTIPLE]: '多选题',
}

const StatusText: Record<Status, string> = {
  [Status.ACTIVE]: '启用',
  [Status.INACTIVE]: '禁用',
  [Status.DELETED]: '已删除',
  [Status.DRAFT]: '草稿',
  [Status.PENDING_REVIEW]: '待审核',
  [Status.PUBLISHED]: '已发布',
  [Status.REJECTED]: '已拒绝',
  [Status.PENDING]: '待开始',
  [Status.IN_PROGRESS]: '进行中',
  [Status.COMPLETED]: '已完成',
  [Status.EXPIRED]: '已过期',
}

const StatusColor: Record<Status, string> = {
  [Status.ACTIVE]: 'green',
  [Status.INACTIVE]: 'orange',
  [Status.DELETED]: 'red',
  [Status.DRAFT]: 'default',
  [Status.PENDING_REVIEW]: 'orange',
  [Status.PUBLISHED]: 'green',
  [Status.REJECTED]: 'red',
  [Status.PENDING]: 'orange',
  [Status.IN_PROGRESS]: 'blue',
  [Status.COMPLETED]: 'green',
  [Status.EXPIRED]: 'red',
}

interface OptionForm {
  label: string
  content: string
  score: number
  sortOrder: number
}

interface QuestionForm {
  content: string
  type: QuestionType
  score: number
  options: OptionForm[]
  status: Status
}

const QuestionManagement = () => {
  const [form] = Form.useForm<QuestionForm>()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [questionType, setQuestionType] = useState<QuestionType | undefined>()
  const [optionCount, setOptionCount] = useState(4)

  const { data, loading, refresh } = useRequest<PaginationResult<Question>>(
    () =>
      assessmentsApi.getQuestions({
        keyword,
        type: questionType,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    [pagination.current, pagination.pageSize, keyword, questionType]
  )

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }))
    refresh()
  }

  const handleAdd = () => {
    setEditingId(null)
    setOptionCount(4)
    form.resetFields()
    form.setFieldsValue({
      type: QuestionType.SINGLE,
      score: 0,
      status: Status.ACTIVE,
      options: Array.from({ length: 4 }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        content: '',
        score: i,
        sortOrder: i,
      })),
    })
    setModalVisible(true)
  }

  const handleEdit = async (record: Question) => {
    setEditingId(record.id)
    const question = await assessmentsApi.getQuestion(record.id)
    setOptionCount(question.options.length)
    form.setFieldsValue({
      content: question.content,
      type: question.type,
      score: question.score,
      status: question.status,
      options: question.options.map((opt) => ({
        label: opt.label,
        content: opt.content,
        score: opt.score,
        sortOrder: opt.sortOrder,
      })),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await assessmentsApi.deleteQuestion(id)
      message.success('删除成功')
      refresh()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values: QuestionForm) => {
    try {
      if (editingId) {
        await assessmentsApi.updateQuestion(editingId, values)
        message.success('更新成功')
      } else {
        await assessmentsApi.createQuestion(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      refresh()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handleOptionCountChange = (count: number | null) => {
    if (count === null) return
    const currentOptions = form.getFieldValue('options') || []
    const newOptions: OptionForm[] = []
    for (let i = 0; i < count; i++) {
      if (currentOptions[i]) {
        newOptions.push(currentOptions[i])
      } else {
        newOptions.push({
          label: String.fromCharCode(65 + i),
          content: '',
          score: i,
          sortOrder: i,
        })
      }
    }
    form.setFieldValue('options', newOptions)
    setOptionCount(count)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: QuestionType) => (
        <Tag color="blue">{QuestionTypeText[type]}</Tag>
      ),
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 80,
    },
    {
      title: '选项数',
      key: 'optionCount',
      width: 80,
      render: (_: unknown, record: Question) => record.options?.length || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: Status) => (
        <Tag color={StatusColor[status]}>{StatusText[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Question) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
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
    <div>
      <Card
        title="题库管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增题目
          </Button>
        }
      >
        <Space className="mb-4">
          <Input.Search
            placeholder="搜索题目内容"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="选择题型"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => {
              setQuestionType(value)
              handleSearch()
            }}
          >
            <Option value={QuestionType.SINGLE}>单选题</Option>
            <Option value={QuestionType.MULTIPLE}>多选题</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) =>
              setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑题目' : '新增题目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: QuestionType.SINGLE,
            score: 0,
            status: Status.ACTIVE,
          }}
        >
          <Form.Item
            name="content"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>

          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item
              name="type"
              label="题型"
              rules={[{ required: true, message: '请选择题型' }]}
              style={{ flex: 1 }}
            >
              <Radio.Group>
                <Radio value={QuestionType.SINGLE}>单选题</Radio>
                <Radio value={QuestionType.MULTIPLE}>多选题</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="score"
              label="题目分值"
              style={{ flex: 1 }}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value={Status.ACTIVE}>启用</Option>
                <Option value={Status.INACTIVE}>禁用</Option>
              </Select>
            </Form.Item>
          </Space>

          <div className="mb-4">
            <span className="mr-2">选项数量：</span>
            <InputNumber
              min={2}
              max={10}
              value={optionCount}
              onChange={handleOptionCountChange}
            />
          </div>

          <Form.List name="options">
            {(fields, { remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`选项 ${String.fromCharCode(65 + index)}`}
                    extra={
                      optionCount > 2 ? (
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => {
                            remove(field.name)
                            setOptionCount(optionCount - 1)
                          }}
                        >
                          删除
                        </Button>
                      ) : null
                    }
                    className="mb-3"
                  >
                    <Space direction="vertical" className="w-full">
                      <Form.Item
                        name={[field.name, 'label']}
                        hidden
                        initialValue={String.fromCharCode(65 + index)}
                      >
                        <Input />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'content']}
                        label="选项内容"
                        rules={[{ required: true, message: '请输入选项内容' }]}
                      >
                        <Input placeholder="请输入选项内容" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'score']}
                        label="选项分值"
                        initialValue={index}
                      >
                        <InputNumber min={0} className="w-full" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'sortOrder']}
                        hidden
                        initialValue={index}
                      >
                        <InputNumber />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item className="mt-6 mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuestionManagement
