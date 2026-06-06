import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Avatar,
  Row,
  Col,
  Descriptions,
  Typography,
  message,
  Space,
  Upload,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  IdcardOutlined,
  EditOutlined,
  LockOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store'
import { authApi, fileApi } from '@/api'
import { formatDate } from '@/utils'
import type { UpdateProfileParams, ChangePasswordParams } from '@/types'
import type { AppState } from '@/store'

const { Title } = Typography
const { TabPane } = Tabs

const Profile = () => {
  const user = useAppStore((state: AppState) => state.user)
  const setUser = useAppStore((state: AppState) => state.setUser)
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [avatar, setAvatar] = useState(user?.avatar || '')

  const handleUpdateProfile = async (values: UpdateProfileParams) => {
    setProfileLoading(true)
    try {
      const data: UpdateProfileParams = {
        ...values,
        avatar,
      }
      const user = await authApi.updateProfile(data)
      setUser(user)
      message.success('个人信息更新成功')
      setEditing(false)
    } catch (error) {
      console.error('更新失败', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (values: ChangePasswordParams) => {
    setPasswordLoading(true)
    try {
      await authApi.changePassword(values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      console.error('密码修改失败', error)
    } finally {
      setPasswordLoading(false)
    }
  }

  const validateConfirmPassword = ({ getFieldValue }: any) => ({
    validator(_: any, value: string) {
      if (!value || getFieldValue('newPassword') === value) {
        return Promise.resolve()
      }
      return Promise.reject(new Error('两次输入的密码不一致'))
    },
  })

  const handleAvatarUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    try {
      const result = await fileApi.uploadFile(file)
      setAvatar(result.url)
      onSuccess?.(result)
      message.success('头像上传成功')
    } catch (error) {
      console.error('上传失败', error)
      onError?.(error as Error)
    }
  }

  const roleMap: Record<string, string> = {
    super_admin: '超级管理员',
    hr_admin: '人事管理员',
    assessment_admin: '考核管理员',
    employee: '普通员工',
  }

  const avatarUploadProps = {
    name: 'file',
    customRequest: handleAvatarUpload,
    showUploadList: false,
    accept: 'image/*',
  }

  return (
    <div className="space-y-6">
      <Title level={3} className="!mb-0">
        个人中心
      </Title>

      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
          <div className="flex flex-col items-center gap-4">
            <Avatar
              src={avatar}
              icon={<UserOutlined />}
              size={120}
              className="border-4 border-gray-100"
            />
            {editing && (
              <Upload {...avatarUploadProps}>
                <Button icon={<UploadOutlined />} size="small">
                  更换头像
                </Button>
              </Upload>
            )}
          </div>

          <div className="flex-1 w-full">
            <Descriptions
              column={{ xs: 1, md: 2 }}
              title={
                <div className="flex items-center justify-between">
                  <span>基本信息</span>
                  {!editing && (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditing(true)
                        profileForm.setFieldsValue({
                          nickname: user?.nickname,
                          phone: user?.phone,
                          department: user?.department,
                          position: user?.position,
                        })
                      }}
                    >
                      编辑信息
                    </Button>
                  )}
                </div>
              }
              bordered
              className="w-full"
            >
              <Descriptions.Item label="用户名">
                <Space>
                  <UserOutlined />
                  {user?.username}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="昵称">
                <Space>
                  <IdcardOutlined />
                  {user?.nickname || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space>
                  <MailOutlined />
                  {user?.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  <PhoneOutlined />
                  {user?.phone || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                <Space>
                  <TeamOutlined />
                  {user?.department || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="职位">
                <Space>
                  <IdcardOutlined />
                  {user?.position || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                {roleMap[user?.role || 'employee'] || user?.role}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {formatDate(user?.createdAt || '')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>

        <Tabs defaultActiveKey="profile" className="mt-6">
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <EditOutlined />
                编辑个人信息
              </span>
            }
            key="profile"
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
              initialValues={{
                nickname: user?.nickname,
                phone: user?.phone,
                department: user?.department,
                position: user?.position,
              }}
              className="max-w-2xl"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="nickname"
                    label="昵称"
                    rules={[
                      { max: 20, message: '昵称最多20个字符' },
                    ]}
                  >
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="请输入昵称"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
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
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="请输入手机号"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="department"
                    label="部门"
                    rules={[
                      { max: 50, message: '部门名称最多50个字符' },
                    ]}
                  >
                    <Input
                      prefix={<TeamOutlined />}
                      placeholder="请输入部门"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="position"
                    label="职位"
                    rules={[
                      { max: 50, message: '职位最多50个字符' },
                    ]}
                  >
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="请输入职位"
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item className="!mb-0">
                <Space size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={profileLoading}
                    icon={<EditOutlined />}
                  >
                    保存修改
                  </Button>
                  {editing && (
                    <Button
                      size="large"
                      onClick={() => setEditing(false)}
                    >
                      取消
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <LockOutlined />
                修改密码
              </span>
            }
            key="password"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              className="max-w-md"
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                  { max: 20, message: '密码最多20个字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  validateConfirmPassword,
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请再次输入新密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={passwordLoading}
                  icon={<LockOutlined />}
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Profile
