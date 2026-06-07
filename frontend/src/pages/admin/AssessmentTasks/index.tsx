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
  DatePicker,
  TreeSelect,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { assessmentsApi, usersApi } from '@/api'
import { Status, ScaleType, type AssessmentTask, type Scale, type PaginationResult, type User } from '@/types'
import { useRequest } from '@/hooks'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker
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

interface TaskForm {
  name: string
  description?: string
  scaleId: number
  targetUserIds?: number[]
  targetDepartments?: string[]
  startTime?: string
  endTime?: string
}

const AssessmentTaskManagement = () => {
  const [form] = Form.useForm<TaskForm>()
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingTask, setViewingTask] = useState<AssessmentTask | null>(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [keyword, setKeyword] = useState('')
  const [scaleId, setScaleId] = useState<number | undefined>()

  const { data, loading, refresh } = useRequest<PaginationResult<AssessmentTask>>(
    () =>
      assessmentsApi.getTasks({
        keyword,
        scaleId,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    [pagination.current, pagination.pageSize, keyword, scaleId]
  )

  const { data: scalesForSelect } = useRequest<Scale[]>(
    () => assessmentsApi.getScalesForSelect(),
    []
  )

  const { data: allUsers } = useRequest<User[]>(() => usersApi.getAllUsers(), [])

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }))
    refresh()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = async (record: AssessmentTask) => {
    setEditingId(record.id)
    const task = await assessmentsApi.getTask(record.id)
    form.setFieldsValue({
      name: task.name,
      description: task.description,
      scaleId: task.scaleId,
      targetUserIds: task.targetUserIds,
      targetDepartments: task.targetDepartments,
    })
    if (task.startTime && task.endTime) {
      form.setFieldsValue({
        startTime: task.startTime,
        endTime: task.endTime,
      })
    }
    setModalVisible(true)
  }

  const handleView = async (record: AssessmentTask) => {
    const task = await assessmentsApi.getTask(record.id)
    setViewingTask(task)
    setViewModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await assessmentsApi.deleteTask(id)
      message.success('删除成功')
      refresh()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async (values: TaskForm) => {
    try {
      const submitData = {
        ...values,
      }
      if (editingId) {
        await assessmentsApi.updateTask(editingId, submitData)
        message.success('更新成功')
      } else {
        await assessmentsApi.createTask(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      refresh()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const departments = Array.from(new Set(allUsers?.map((u) => u.department).filter(Boolean) || []))

  const userTreeData = departments.map((dept) => ({
    title: dept,
    value: `dept_${dept}`,
    children: allUsers
      ?.filter((u) => u.department === dept)
      .map((u) => ({
        title: `${u.nickname || u.username}`,
        value: u.id,
      })),
  }))

  const handleTargetChange = (value: (string | number)[]) => {
    const userIds: number[] = []
    const depts: string[] = []
    value.forEach((v) => {
      if (typeof v === 'number') {
        userIds.push(v)
      } else if (typeof v === 'string' && v.startsWith('dept_')) {
        depts.push(v.replace('dept_', ''))
      }
    })
    form.setFieldsValue({
      targetUserIds: userIds,
      targetDepartments: depts,
    })
  }

  const getInitialTargetValues = () => {
    const values: (string | number)[] = []
    const targetUserIds = form.getFieldValue('targetUserIds') || []
    const targetDepartments = form.getFieldValue('targetDepartments') || []
    targetDepartments.forEach((d: string) => values.push(`dept_${d}`))
    targetUserIds.forEach((id: number) => values.push(id))
    return values
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '量表',
      key: 'scale',
      width: 150,
      render: (_: unknown, record: AssessmentTask) =>
        record.scale ? (
          <Space>
            <Tag color={ScaleTypeColor[record.scale.type]}>
              {ScaleTypeText[record.scale.type]}
            </Tag>
            <span>{record.scale.name}</span>
          </Space>
        ) : null,
    },
    {
      title: '发放人',
      key: 'creator',
      width: 100,
      render: (_: unknown, record: AssessmentTask) =>
        record.creator?.nickname || record.creator?.username,
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
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (date: string) =>
        date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (date: string) =>
        date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: AssessmentTask) => (
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
            title="确定删除该任务吗？"
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
        title="测评任务管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            发放测评
          </Button>
        }
      >
        <Space className="mb-4">
          <Input.Search
            placeholder="搜索任务名称"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="选择量表"
            allowClear
            style={{ width: 200 }}
            onChange={(value) => {
              setScaleId(value)
              handleSearch()
            }}
          >
            {scalesForSelect?.map((scale: Scale) => (
              <Option key={scale.id} value={scale.id}>
                {scale.name}
              </Option>
            ))}
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
        title={editingId ? '编辑测评任务' : '发放测评任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>

          <Form.Item
            name="scaleId"
            label="选择量表"
            rules={[{ required: true, message: '请选择量表' }]}
          >
            <Select placeholder="请选择量表">
              {scalesForSelect?.map((scale: Scale) => (
                <Option key={scale.id} value={scale.id}>
                  <Tag color={ScaleTypeColor[scale.type]} className="mr-2">
                    {ScaleTypeText[scale.type]}
                  </Tag>
                  {scale.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="发放对象"
            name="targets"
            rules={[{ required: true, message: '请选择发放对象' }]}
          >
            <TreeSelect
              treeData={userTreeData}
              placeholder="请选择用户或部门"
              multiple
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              onChange={handleTargetChange}
              value={getInitialTargetValues()}
              treeDefaultExpandAll
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="时间范围" name="timeRange">
            <RangePicker
              showTime
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  form.setFieldsValue({
                    startTime: dates[0].toISOString(),
                    endTime: dates[1].toISOString(),
                  })
                }
              }}
            />
          </Form.Item>

          <Form.Item className="mt-6 mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? '更新' : '发放'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="测评任务详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {viewingTask && (
          <div>
            <div className="mb-4">
              <Text strong className="mr-2">
                任务名称：
              </Text>
              {viewingTask.name}
            </div>
            {viewingTask.description && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  任务描述：
                </Text>
                {viewingTask.description}
              </div>
            )}
            <div className="mb-4">
              <Text strong className="mr-2">
                关联量表：
              </Text>
              {viewingTask.scale && (
                <>
                  <Tag color={ScaleTypeColor[viewingTask.scale.type]} className="mr-2">
                    {ScaleTypeText[viewingTask.scale.type]}
                  </Tag>
                  {viewingTask.scale.name}
                </>
              )}
            </div>
            <div className="mb-4">
              <Text strong className="mr-2">
                发放人：
              </Text>
              {viewingTask.creator?.nickname || viewingTask.creator?.username}
            </div>
            <div className="mb-4">
              <Text strong className="mr-2">
                状态：
              </Text>
              <Tag color={StatusColor[viewingTask.status]}>
                {StatusText[viewingTask.status]}
              </Tag>
            </div>
            {viewingTask.targetUserIds && viewingTask.targetUserIds.length > 0 && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  <UserOutlined /> 指定用户：
                </Text>
                {viewingTask.targetUserIds.length}人
              </div>
            )}
            {viewingTask.targetDepartments && viewingTask.targetDepartments.length > 0 && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  <TeamOutlined /> 指定部门：
                </Text>
                {viewingTask.targetDepartments.join('、')}
              </div>
            )}
            {viewingTask.startTime && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  开始时间：
                </Text>
                {dayjs(viewingTask.startTime).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            )}
            {viewingTask.endTime && (
              <div className="mb-4">
                <Text strong className="mr-2">
                  截止时间：
                </Text>
                {dayjs(viewingTask.endTime).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AssessmentTaskManagement
