import { useState } from 'react'
import { Form, Input, Button, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authApi } from '@/api'
import { useAppStore } from '@/store'
import { LoginParams } from '@/types'

const { Title, Text } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken, setUser } = useAppStore()

  const onFinish = async (values: LoginParams) => {
    try {
      setLoading(true)
      const { token, user } = await authApi.login(values)
      setToken(token)
      setUser(user)
      message.success('登录成功')
      const from = (location.state as any)?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-2xl">
          <div className="text-center mb-8">
            <Title level={2} className="!mb-2">
              企业知识库
            </Title>
            <Text type="secondary">欢迎回来，请登录您的账号</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary">
                还没有账号？{' '}
                <Link to="/register" className="text-blue-500">
                  立即注册
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default Login
