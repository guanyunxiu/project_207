import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Avatar,
  Tag,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  KeyOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { userApi } from '@/api'
import { formatDate, debounce } from '@/utils'
import { Role, Status } from '@/types'
import type { User, CreateUserParams, UpdateUserParams } from '@/types'

const { Title } = Typography
const { Option } = Select

const Users = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  const roleMap: Record<string, { label: string; color: string }> = {
    super_admin: { label: '超级管理员', color: 'red' },
    hr_admin: { label: '人事管理员', color: 'orange' },
    assessment_admin: { label: '考核管理员', color: 'purple' },
    employee: { label: '普通员工', color: 'blue' },
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await userApi.getUsers({
        page,
        pageSize,
        keyword: keyword || undefined,
      })
      setUsers(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('获取用户列表失败', error)
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          nickname: '管理员',
          role: Role.SUPER_ADMIN,
          status: Status.ACTIVE,
          department: '技术部',
          position: '技术总监',
          phone: '13800138000',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        } as User,
        {
          id: 2,
          username: 'hr_admin',
          email: 'hr@example.com',
          nickname: '人事管理员',
          role: Role.HR_ADMIN,
          status: Status.ACTIVE,
          department: '人事部',
          position: '人事经理',
          phone: '13800138001',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        } as User,
        {
          id: 3,
          username: 'employee1',
          email: 'emp1@example.com',
          nickname: '张三',
          role: Role.EMPLOYEE,
          status: Status.ACTIVE,
          department: '技术部',
          position: '前端工程师',
          phone: '13800138002',
          createdAt: '2024-01-03',
          updatedAt: '2024-01-03',
        } as User,
        {
          id: 4,
          username: 'employee2',
          email: 'emp2@example.com',
          nickname: '李四',
          role: Role.EMPLOYEE,
          status: Status.ACTIVE,
          department: '产品部',
          position: '产品经理',
          phone: '13800138003',
          createdAt: '2024-01-04',
          updatedAt: '2024-01-04',
        } as User,
        {
          id: 5,
          username: 'employee3',
          email: 'emp3@example.com',
          nickname: '王五',
          role: Role.EMPLOYEE,
          status: Status.INACTIVE,
          department: '市场部',
          position: '市场专员',
          phone: '13800138004',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-05',
        } as User,
      ])
      setTotal(25)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, keyword])

  const handleSearch = debounce((value: string) => {
    setKeyword(value)
    setPage(1)
  }, 300)

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      status: user.status,
      phone: user.phone,
      department: user.department,
      position: user.position,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await userApi.deleteUser(id)
      message.success('删除成功')
      fetchUsers()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleResetPassword = async (id: number) => {
    try {
      const defaultPassword = '123456'
      await userApi.resetPassword(id, defaultPassword)
      Modal.success({
        title: '密码重置成功',
        content: `新密码为：${defaultPassword}`,
      })
    } catch (error) {
      console.error('重置密码失败', error)
    }
  }

  const handleSubmit = async (values: CreateUserParams) => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values as UpdateUserParams)
        message.success('更新成功')
      } else {
        await userApi.createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error('操作失败', error)
    }
  }

  const columns = [
    {
      title: '用户信息',
      dataIndex: 'user',
      key: 'user',
      render: (_: any, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.nickname || record.username}</div>
            <div className="text-sm text-gray-500">@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <span className="flex items-center gap-1">
          <MailOutlined className="text-gray-400" />
          {text}
        </span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const info = roleMap[role] || { label: role, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '部门/职位',
      key: 'department',
      render: (_: any, record: User) => (
        <div>
          <div>{record.department || '-'}</div>
          <div className="text-sm text-gray-500">{record.position || '-'}</div>
        </div>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <span className="flex items-center gap-1">
          <PhoneOutlined className="text-gray-400" />
          {text || '-'}
        </span>
      ),
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
      width: 220,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record.id)}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，确定要删除该用户吗？"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title level={3} className="!mb-0 flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          用户管理
        </Title>
        <div className="flex items-center gap-4">
          <Input.Search
            placeholder="搜索用户名、昵称、邮箱"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 300 }}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名最多20个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
              ]}
            >
              <Input placeholder="请输入用户名" size="large" disabled={!!editingUser} />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" size="large" />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label="初始密码"
                rules={[
                  { required: true, message: '请输入初始密码' },
                  { min: 6, message: '密码至少6个字符' },
                  { max: 20, message: '密码最多20个字符' },
                ]}
              >
                <Input.Password placeholder="请输入初始密码" size="large" />
              </Form.Item>
            )}

            <Form.Item
              name="nickname"
              label="昵称"
              rules={[
                { max: 20, message: '昵称最多20个字符' },
              ]}
            >
              <Input placeholder="请输入昵称（选填）" size="large" />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
              initialValue={Role.EMPLOYEE}
            >
              <Select size="large">
                <Option value={Role.SUPER_ADMIN}>超级管理员</Option>
                <Option value={Role.HR_ADMIN}>人事管理员</Option>
                <Option value={Role.ASSESSMENT_ADMIN}>考核管理员</Option>
                <Option value={Role.EMPLOYEE}>普通员工</Option>
              </Select>
            </Form.Item>

            {editingUser && (
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
            )}

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入有效的手机号',
                },
              ]}
            >
              <Input placeholder="请输入手机号（选填）" size="large" />
            </Form.Item>

            <Form.Item
              name="department"
              label="部门"
              rules={[
                { max: 50, message: '部门名称最多50个字符' },
              ]}
            >
              <Input placeholder="请输入部门（选填）" size="large" />
            </Form.Item>

            <Form.Item
              name="position"
              label="职位"
              rules={[
                { max: 50, message: '职位最多50个字符' },
              ]}
            >
              <Input placeholder="请输入职位（选填）" size="large" />
            </Form.Item>
          </div>

          <Form.Item className="!mb-0">
            <div className="flex justify-end gap-4">
              <Button size="large" onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit">
                {editingUser ? '保存' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
