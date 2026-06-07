import React, { useState } from 'react'
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
  Transfer,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { assessmentsApi } from '@/api'
import { ScaleType, Status, type Scale, type Question, type PaginationResult } from '@/types'
import { useRequest } from '@/hooks'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const ScaleTypeText: Record<ScaleType, string> = {
  [ScaleType.ANXIETY]: '焦虑',
  [ScaleType.STRESS]: '压力',
  [ScaleType.SLEEP]: '睡眠',
  [ScaleType.EMOTION]: '情绪',
}

const ScaleTypeColor: Record<ScaleType, string> = {
  [ScaleType.ANXIETY]: 'orange',
  [ScaleType.STRESS]: 'red',
  [ScaleType.SLEEP]: 'blue',
  [ScaleType.EMOTION]: 'purple',
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

interface ScaleForm {
  name: string
  type: ScaleType
  description?: string
  scoreDescription?: string
  questionIds: number[]
  status: Status
}

const ScaleManagement = () => {
  const [form] = Form.useForm<ScaleForm>()
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingScale, setViewingScale] = useState<Scale | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [scaleType, setScaleType] = useState<ScaleType | undefined>()
  const [targetKeys, setTargetKeys] = useState<number[]>([])

  const { data, loading, refresh } = useRequest<PaginationResult<Scale>>(
    () =>
      assessmentsApi.getScales({
        keyword,
        type: scaleType,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    [pagination.current, pagination.pageSize, keyword, scaleType]
  )

  const { data: questionsForSelect } = useRequest<Question[]>(
    () => assessmentsApi.getQuestionsForSelect(),
    [],
    {
      ready: modalVisible,
    }
  )

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }))
    refresh()
  }

  const handleAdd = () => {
    setEditingId(null)
    setTargetKeys([])
    form.resetFields()
    form.setFieldsValue({
      type: ScaleType.ANXIETY,
      status: Status.ACTIVE,
      questionIds: [],
    })
    setModalVisible(true)
  }

  const handleEdit = async (record: Scale) => {
    setEditingId(record.id)
    const scale = await assessmentsApi.getScale(record.id)
    const questionIds = scale.scaleQuestions
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((sq) => sq.questionId)
    setTargetKeys(questionIds)
    form.setFieldsValue({
      name: scale.name,
      type: scale.type,
      description: scale.description,
      scoreDescription: scale.scoreDescription,
      status: scale.status,
      questionIds,
    })
    setModalVisible(true)
  }

  const handleView = async (record: Scale) => {
    const scale = await assessmentsApi.getScale(record.id)
    setViewingScale(scale)
    setViewModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await assessmentsApi.deleteScale(id)
      message.success('删除成功')
      refresh()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values: ScaleForm) => {
    try {
      const submitData = {
        ...values,
        questionIds: targetKeys,
      }
      if (editingId) {
        await assessmentsApi.updateScale(editingId, submitData)
        message.success('更新成功')
      } else {
        await assessmentsApi.createScale(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      refresh()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handleTransferChange = (nextTargetKeys: React.Key[]) => {
    const keys = nextTargetKeys.map((k) => Number(k))
    setTargetKeys(keys)
    form.setFieldValue('questionIds', keys)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '量表名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '量表类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ScaleType) => (
        <Tag color={ScaleTypeColor[type]}>{ScaleTypeText[type]}</Tag>
      ),
    },
    {
      title: '题目数量',
      key: 'questionCount',
      width: 100,
      render: (_: unknown, record: Scale) => record.scaleQuestions?.length || 0,
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
      width: 200,
      render: (_: unknown, record: Scale) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该量表吗？"
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

  const renderTransferItem = (item: Question) => ({
    value: item.id,
    label: `[${item.type === 'single' ? '单选' : '多选'}] ${item.content.slice(0, 50)}${item.content.length > 50 ? '...' : ''}`,
  })

  return (
    <div>
      <Card
        title="量表管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增量表
          </Button>
        }
      >
        <Space className="mb-4">
          <Input.Search
            placeholder="搜索量表名称"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="选择量表类型"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => {
              setScaleType(value)
              handleSearch()
            }}
          >
            <Option value={ScaleType.ANXIETY}>焦虑</Option>
            <Option value={ScaleType.STRESS}>压力</Option>
            <Option value={ScaleType.SLEEP}>睡眠</Option>
            <Option value={ScaleType.EMOTION}>情绪</Option>
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
        title={editingId ? '编辑量表' : '新增量表'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: ScaleType.ANXIETY,
            status: Status.ACTIVE,
          }}
        >
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item
              name="name"
              label="量表名称"
              rules={[{ required: true, message: '请输入量表名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入量表名称" />
            </Form.Item>

            <Form.Item
              name="type"
              label="量表类型"
              rules={[{ required: true, message: '请选择量表类型' }]}
              style={{ flex: 1 }}
            >
              <Select>
                <Option value={ScaleType.ANXIETY}>焦虑</Option>
                <Option value={ScaleType.STRESS}>压力</Option>
                <Option value={ScaleType.SLEEP}>睡眠</Option>
                <Option value={ScaleType.EMOTION}>情绪</Option>
              </Select>
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

          <Form.Item name="description" label="量表描述">
            <TextArea rows={2} placeholder="请输入量表描述" />
          </Form.Item>

          <Form.Item name="scoreDescription" label="总分说明">
            <TextArea
              rows={2}
              placeholder="请输入总分说明，如：0-20分表示轻度焦虑..."
            />
          </Form.Item>

          <Form.Item
            name="questionIds"
            label="选择题目（按顺序排列）"
            rules={[{ required: true, message: '请至少选择一道题目' }]}
          >
            <Transfer
              dataSource={questionsForSelect?.map(renderTransferItem) || []}
              targetKeys={targetKeys}
              onChange={handleTransferChange}
              render={(item) => item.label}
              listStyle={{
                width: 300,
                height: 300,
              }}
              titles={['待选题库', '已选题目']}
              operations={['添加', '移除']}
              showSearch
            />
          </Form.Item>
          <Text type="secondary" className="block mb-4">
            提示：已选题目将按右侧列表顺序排列，可通过拖拽调整顺序
          </Text>

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

      <Modal
        title="量表详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewingScale && (
          <div>
            <div className="mb-4">
              <Text strong className="mr-2">
                量表名称：
              </Text>
              {viewingScale.name}
            </div>
            <div className="mb-4">
              <Text strong className="mr-2">
                量表类型：
              </Text>
              <Tag color={ScaleTypeColor[viewingScale.type]}>
                {ScaleTypeText[viewingScale.type]}
              </Tag>
            </div>
            {viewingScale.description && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  量表描述：
                </Text>
                {viewingScale.description}
              </div>
            )}
            {viewingScale.scoreDescription && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  总分说明：
                </Text>
                {viewingScale.scoreDescription}
              </div>
            )}
            <div className="mb-4">
              <Text strong className="mr-2">
                题目列表：
              </Text>
              <div className="mt-2 pl-4">
                {viewingScale.scaleQuestions
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((sq, index) => (
                    <div key={sq.id} className="mb-2">
                      <Text type="secondary">{index + 1}. </Text>
                      <Text>
                        [{sq.question.type === 'single' ? '单选' : '多选'}]
                      </Text>
                      <span className="ml-1">{sq.question.content}</span>
                      <div className="pl-6 mt-1 text-gray-500 text-sm">
                        {sq.question.options
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((opt) => (
                            <div key={opt.id}>
                              {opt.label}. {opt.content}（{opt.score}分）
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ScaleManagement
