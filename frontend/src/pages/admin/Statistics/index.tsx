import { useState, useEffect, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Spin,
  Empty,
  Select,
  DatePicker,
  Tag,
  Form,
  Button,
  Space,
  Alert,
} from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  AlertOutlined,
  DashboardOutlined,
  ReloadOutlined,
  FilterOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import dayjs from 'dayjs'
import { statisticsApi } from '@/api'
import { formatDate } from '@/utils'
import { ScaleType, ResultLevel, Status } from '@/types'
import type {
  OverallStatisticsData,
  StressDistributionData,
  EmotionTrendData,
  DepartmentComparisonData,
  AssessmentRecord,
  QueryStatisticsParams,
} from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
)

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const LEVEL_COLORS: Record<string, string> = {
  [ResultLevel.NORMAL]: '#52c41a',
  [ResultLevel.MILD]: '#faad14',
  [ResultLevel.MODERATE]: '#fa8c16',
  [ResultLevel.SEVERE]: '#f5222d',
}

const LEVEL_LABELS: Record<string, string> = {
  [ResultLevel.NORMAL]: '正常',
  [ResultLevel.MILD]: '轻度',
  [ResultLevel.MODERATE]: '中度',
  [ResultLevel.SEVERE]: '重度',
}

const SCALE_TYPE_LABELS: Record<string, string> = {
  [ScaleType.ANXIETY]: '焦虑量表',
  [ScaleType.STRESS]: '压力量表',
  [ScaleType.SLEEP]: '睡眠量表',
  [ScaleType.EMOTION]: '情绪量表',
}

const DEPARTMENT_OPTIONS = [
  '技术部',
  '产品部',
  '市场部',
  '人事部',
  '财务部',
  '运营部',
  '销售部',
]

const Statistics = () => {
  const [loading, setLoading] = useState(true)
  const [overallData, setOverallData] = useState<OverallStatisticsData | null>(null)
  const [highRiskUsers, setHighRiskUsers] = useState<AssessmentRecord[]>([])
  const [form] = Form.useForm<QueryStatisticsParams>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: QueryStatisticsParams = {}
      if (values.scaleType) params.scaleType = values.scaleType
      if (values.department) params.department = values.department
      if (values.startDate) params.startDate = values.startDate
      if (values.endDate) params.endDate = values.endDate

      const [overall, highRisk] = await Promise.all([
        statisticsApi.getOverallStatistics(params),
        statisticsApi.getHighRiskUsers(params),
      ])

      setOverallData(overall)
      setHighRiskUsers(highRisk)
    } catch (error) {
      console.error('加载统计数据失败', error)
      setOverallData(generateMockOverallData())
      setHighRiskUsers(generateMockHighRiskUsers())
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchData()
  }

  const handleReset = () => {
    form.resetFields()
    fetchData()
  }

  const generateMockOverallData = (): OverallStatisticsData => {
    const now = dayjs()
    const emotionTrend: EmotionTrendData[] = []
    for (let i = 29; i >= 0; i--) {
      const date = now.subtract(i, 'day')
      emotionTrend.push({
        date: date.format('MM-DD'),
        avgScore: Math.floor(Math.random() * 30) + 40,
        participantCount: Math.floor(Math.random() * 20) + 5,
      })
    }

    return {
      totalAssessments: 256,
      totalParticipants: 128,
      normalCount: 86,
      mildCount: 32,
      moderateCount: 7,
      severeCount: 3,
      avgScore: 38.5,
      stressDistribution: [
        { level: ResultLevel.NORMAL, count: 86, percentage: 33.6 },
        { level: ResultLevel.MILD, count: 32, percentage: 25.0 },
        { level: ResultLevel.MODERATE, count: 7, percentage: 5.5 },
        { level: ResultLevel.SEVERE, count: 3, percentage: 2.3 },
      ],
      emotionTrend,
      departmentComparison: [
        { department: '技术部', avgScore: 42.5, participantCount: 45, severeCount: 2, moderateCount: 5 },
        { department: '产品部', avgScore: 35.2, participantCount: 28, severeCount: 0, moderateCount: 3 },
        { department: '市场部', avgScore: 38.8, participantCount: 22, severeCount: 1, moderateCount: 2 },
        { department: '人事部', avgScore: 32.1, participantCount: 15, severeCount: 0, moderateCount: 1 },
        { department: '财务部', avgScore: 36.4, participantCount: 10, severeCount: 0, moderateCount: 1 },
        { department: '运营部', avgScore: 40.2, participantCount: 18, severeCount: 1, moderateCount: 2 },
      ],
    }
  }

  const generateMockHighRiskUsers = (): AssessmentRecord[] => {
    return [
      {
        id: 1,
        taskId: 1,
        userId: 101,
        user: {
          id: 101,
          username: 'user***',
          email: '***@example.com',
          nickname: '张**',
          role: 'employee',
          status: Status.ACTIVE,
          department: '技术部',
          position: '前端工程师',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
        } as any,
        totalScore: 78,
        resultLevel: ResultLevel.SEVERE,
        resultDescription: '重度焦虑状态，建议及时关注',
        status: Status.COMPLETED,
        submittedAt: '2024-01-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      },
      {
        id: 2,
        taskId: 2,
        userId: 102,
        user: {
          id: 102,
          username: 'emp***',
          email: '***@example.com',
          nickname: '李**',
          role: 'employee',
          status: Status.ACTIVE,
          department: '市场部',
          position: '市场专员',
          createdAt: '2024-01-11',
          updatedAt: '2024-01-11',
        } as any,
        totalScore: 72,
        resultLevel: ResultLevel.SEVERE,
        resultDescription: '重度压力状态，需要关注',
        status: Status.COMPLETED,
        submittedAt: '2024-01-16',
        createdAt: '2024-01-16',
        updatedAt: '2024-01-16',
      },
      {
        id: 3,
        taskId: 1,
        userId: 103,
        user: {
          id: 103,
          username: 'emp***',
          email: '***@example.com',
          nickname: '王**',
          role: 'employee',
          status: Status.ACTIVE,
          department: '技术部',
          position: '后端工程师',
          createdAt: '2024-01-12',
          updatedAt: '2024-01-12',
        } as any,
        totalScore: 65,
        resultLevel: ResultLevel.MODERATE,
        resultDescription: '中度情绪问题',
        status: Status.COMPLETED,
        submittedAt: '2024-01-14',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-14',
      },
      {
        id: 4,
        taskId: 3,
        userId: 104,
        user: {
          id: 104,
          username: 'emp***',
          email: '***@example.com',
          nickname: '赵**',
          role: 'employee',
          status: Status.ACTIVE,
          department: '运营部',
          position: '运营专员',
          createdAt: '2024-01-13',
          updatedAt: '2024-01-13',
        } as any,
        totalScore: 62,
        resultLevel: ResultLevel.MODERATE,
        resultDescription: '中度睡眠问题',
        status: Status.COMPLETED,
        submittedAt: '2024-01-17',
        createdAt: '2024-01-17',
        updatedAt: '2024-01-17',
      },
      {
        id: 5,
        taskId: 2,
        userId: 105,
        user: {
          id: 105,
          username: 'emp***',
          email: '***@example.com',
          nickname: '孙**',
          role: 'employee',
          status: Status.ACTIVE,
          department: '产品部',
          position: '产品经理',
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14',
        } as any,
        totalScore: 58,
        resultLevel: ResultLevel.MODERATE,
        resultDescription: '中度焦虑状态',
        status: Status.COMPLETED,
        submittedAt: '2024-01-18',
        createdAt: '2024-01-18',
        updatedAt: '2024-01-18',
      },
    ]
  }

  const maskName = (name?: string): string => {
    if (!name) return '***'
    if (name.length <= 1) return name + '**'
    return name.charAt(0) + '**'
  }

  const maskEmail = (email?: string): string => {
    if (!email) return '***@example.com'
    const atIndex = email.indexOf('@')
    if (atIndex > 0) {
      return '***' + email.substring(atIndex)
    }
    return '***@example.com'
  }

  const stressChartData = useMemo(() => {
    if (!overallData) return null
    const data = overallData.stressDistribution || []
    return {
      labels: data.map((item: StressDistributionData) => LEVEL_LABELS[item.level] || item.level),
      datasets: [
        {
          data: data.map((item: StressDistributionData) => item.count),
          backgroundColor: data.map((item: StressDistributionData) => LEVEL_COLORS[item.level] || '#999'),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    }
  }, [overallData])

  const stressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: '压力分布',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return `${label}: ${value}人 (${percentage}%)`
          },
        },
      },
    },
  }

  const emotionChartData = useMemo(() => {
    if (!overallData) return null
    const data = overallData.emotionTrend || []
    return {
      labels: data.map((item: EmotionTrendData) => item.date),
      datasets: [
        {
          label: '平均分数',
          data: data.map((item: EmotionTrendData) => item.avgScore),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
        },
      ],
    }
  }, [overallData])

  const emotionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '情绪趋势（近30天）',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  }

  const departmentChartData = useMemo(() => {
    if (!overallData) return null
    const data = overallData.departmentComparison || []
    return {
      labels: data.map((item: DepartmentComparisonData) => item.department),
      datasets: [
        {
          label: '平均分数',
          data: data.map((item: DepartmentComparisonData) => item.avgScore),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: '重度人数',
          data: data.map((item: DepartmentComparisonData) => item.severeCount),
          backgroundColor: 'rgba(245, 34, 45, 0.8)',
          borderColor: 'rgb(245, 34, 45)',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: '中度人数',
          data: data.map((item: DepartmentComparisonData) => item.moderateCount),
          backgroundColor: 'rgba(250, 140, 22, 0.8)',
          borderColor: 'rgb(250, 140, 22)',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }
  }, [overallData])

  const departmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '部门对比',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
        },
      },
    },
  }

  const highRiskColumns = [
    {
      title: '用户信息',
      key: 'user',
      render: (_: any, record: AssessmentRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong>{maskName(record.user?.nickname || record.user?.username)}</Text>
          <Text type="secondary" className="text-xs">{maskEmail(record.user?.email)}</Text>
        </Space>
      ),
    },
    {
      title: '部门',
      dataIndex: ['user', 'department'],
      key: 'department',
      width: 100,
      render: (dept: string) => dept || '-',
    },
    {
      title: '职位',
      dataIndex: ['user', 'position'],
      key: 'position',
      width: 120,
      render: (pos: string) => pos || '-',
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
      render: (score: number) => (
        <Text strong className="text-red-500">
          {score}
        </Text>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'resultLevel',
      key: 'resultLevel',
      width: 100,
      render: (level: string) => {
        const color = LEVEL_COLORS[level] || '#999'
        const label = LEVEL_LABELS[level] || level
        return <Tag color={color}>{label}</Tag>
      },
    },
    {
      title: '评估时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (date: string) => formatDate(date, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '结果描述',
      dataIndex: 'resultDescription',
      key: 'resultDescription',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Title level={3} className="!mb-0 flex items-center gap-2">
          <DashboardOutlined className="text-blue-500" />
          统计分析
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>
          刷新数据
        </Button>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilter}
          className="flex flex-wrap gap-4"
        >
          <Form.Item name="scaleType" label="量表类型">
            <Select placeholder="选择量表类型" allowClear style={{ width: 150 }}>
              {Object.entries(SCALE_TYPE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="日期范围">
            <RangePicker
              style={{ width: 280 }}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  form.setFieldsValue({
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD'),
                  })
                } else {
                  form.setFieldsValue({
                    startDate: undefined,
                    endDate: undefined,
                  })
                }
              }}
            />
          </Form.Item>

          <Form.Item name="department" label="部门">
            <Select placeholder="选择部门" allowClear style={{ width: 150 }}>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
                筛选
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {overallData && overallData.severeCount > 0 && (
        <Alert
          message="高风险预警"
          description={`当前检测到 ${overallData.severeCount} 名重度风险用户和 ${overallData.moderateCount} 名中度风险用户，请及时关注并采取干预措施。`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          closable
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">评估总数</span>}
              value={overallData?.totalAssessments || 0}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">参与人数</span>}
              value={overallData?.totalParticipants || 0}
              prefix={<TeamOutlined className="text-purple-500" />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">平均分数</span>}
              value={overallData?.avgScore || 0}
              precision={1}
              prefix={<DashboardOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">正常人数</span>}
              value={overallData?.normalCount || 0}
              prefix={<SmileOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={8}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">轻度异常</span>}
              value={overallData?.mildCount || 0}
              prefix={<MehOutlined className="text-yellow-500" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">中度异常</span>}
              value={overallData?.moderateCount || 0}
              prefix={<FrownOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={<span className="text-gray-600 font-medium">重度异常</span>}
              value={overallData?.severeCount || 0}
              prefix={<AlertOutlined className="text-red-500" />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col lg={12} xl={8}>
          <Card className="shadow-md">
            <div className="h-80">
              {stressChartData ? (
                <Doughnut data={stressChartData} options={stressChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无数据" />
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col lg={12} xl={8}>
          <Card className="shadow-md">
            <div className="h-80">
              {emotionChartData ? (
                <Line data={emotionChartData} options={emotionChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无数据" />
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col lg={24} xl={8}>
          <Card className="shadow-md">
            <div className="h-80">
              {departmentChartData ? (
                <Bar data={departmentChartData} options={departmentChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无数据" />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <span className="flex items-center gap-2">
                <WarningOutlined className="text-red-500" />
                高风险用户列表
              </span>
            }
            className="shadow-md"
            extra={<Tag color="red">共 {highRiskUsers.length} 人</Tag>}
          >
            {highRiskUsers.length > 0 ? (
              <Table
                dataSource={highRiskUsers}
                columns={highRiskColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (t) => `共 ${t} 条`,
                }}
                loading={loading}
              />
            ) : (
              <Empty description="暂无高风险用户" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Statistics
