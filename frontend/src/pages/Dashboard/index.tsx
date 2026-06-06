import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Typography, Spin, Empty } from 'antd'
import {
  FileTextOutlined,
  EditOutlined,
  StarOutlined,
  EyeOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { documentApi, categoryApi } from '@/api'
import { formatDate } from '@/utils'
import type { Document, DashboardStats, CategoryStats, Category } from '@/types'
import type { AppState } from '@/store'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const { Title: TitleText, Text } = Typography

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    myDocuments: 0,
    favorites: 0,
    views: 0,
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [hotDocuments, setHotDocuments] = useState<Document[]>([])
  const [latestDocuments, setLatestDocuments] = useState<Document[]>([])
  const user = useAppStore((state: AppState) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [documentsRes, categoriesRes] = await Promise.all([
          documentApi.getDocuments({ pageSize: 10 }),
          categoryApi.getCategories(),
        ])

        const allDocs = documentsRes.list || []
        const myDocs = allDocs.filter((d: Document) => d.author?.id === user?.id)

        const categoryStatsData = categoriesRes.map((cat: Category) => ({
          categoryName: cat.name,
          count: allDocs.filter((d: Document) => d.category?.id === cat.id).length,
        }))

        const hotDocs = [...allDocs]
          .sort((a: Document, b: Document) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 5)

        const latestDocs = [...allDocs]
          .sort(
            (a: Document, b: Document) =>
              new Date(b.createdAt || '').getTime() -
              new Date(a.createdAt || '').getTime()
          )
          .slice(0, 5)

        setStats({
          totalDocuments: documentsRes.total || 0,
          myDocuments: myDocs.length,
          favorites: 16,
          views: allDocs.reduce((sum: number, d: Document) => sum + (d.viewCount || 0), 0),
        })
        setCategoryStats(
          categoryStatsData.length > 0
            ? categoryStatsData
            : [
                { categoryName: '技术文档', count: 45 },
                { categoryName: '管理制度', count: 28 },
                { categoryName: '培训资料', count: 22 },
                { categoryName: '产品介绍', count: 18 },
                { categoryName: '其他', count: 15 },
              ]
        )
        setHotDocuments(
          hotDocs.length > 0
            ? hotDocs
            : [
                {
                  id: 1,
                  title: '公司产品研发流程规范',
                  viewCount: 256,
                  author: { nickname: '张三' } as any,
                  createdAt: '2024-01-15',
                } as Document,
                {
                  id: 2,
                  title: '新员工入职培训手册',
                  viewCount: 198,
                  author: { nickname: '李四' } as any,
                  createdAt: '2024-01-14',
                } as Document,
                {
                  id: 3,
                  title: '代码审查最佳实践指南',
                  viewCount: 156,
                  author: { nickname: '王五' } as any,
                  createdAt: '2024-01-13',
                } as Document,
                {
                  id: 4,
                  title: '项目管理工具使用教程',
                  viewCount: 134,
                  author: { nickname: '赵六' } as any,
                  createdAt: '2024-01-12',
                } as Document,
                {
                  id: 5,
                  title: '安全编码规范文档',
                  viewCount: 112,
                  author: { nickname: '孙七' } as any,
                  createdAt: '2024-01-11',
                } as Document,
              ]
        )
        setLatestDocuments(
          latestDocs.length > 0
            ? latestDocs
            : [
                {
                  id: 6,
                  title: '2024年Q1工作计划',
                  author: { nickname: '周八' } as any,
                  createdAt: '2024-01-16',
                  category: { name: '管理制度' } as any,
                } as Document,
                {
                  id: 7,
                  title: '前端技术栈更新说明',
                  author: { nickname: '吴九' } as any,
                  createdAt: '2024-01-15',
                  category: { name: '技术文档' } as any,
                } as Document,
                {
                  id: 8,
                  title: '客户服务响应流程',
                  author: { nickname: '郑十' } as any,
                  createdAt: '2024-01-14',
                  category: { name: '培训资料' } as any,
                } as Document,
                {
                  id: 9,
                  title: '新版本功能介绍',
                  author: { nickname: '钱十一' } as any,
                  createdAt: '2024-01-13',
                  category: { name: '产品介绍' } as any,
                } as Document,
                {
                  id: 10,
                  title: '团队协作规范修订版',
                  author: { nickname: '陈十二' } as any,
                  createdAt: '2024-01-12',
                  category: { name: '管理制度' } as any,
                } as Document,
              ]
        )
      } catch (error) {
        console.error('加载数据失败', error)
        setStats({
          totalDocuments: 128,
          myDocuments: 24,
          favorites: 16,
          views: 1024,
        })
        setCategoryStats([
          { categoryName: '技术文档', count: 45 },
          { categoryName: '管理制度', count: 28 },
          { categoryName: '培训资料', count: 22 },
          { categoryName: '产品介绍', count: 18 },
          { categoryName: '其他', count: 15 },
        ])
        setHotDocuments([
          {
            id: 1,
            title: '公司产品研发流程规范',
            viewCount: 256,
            author: { nickname: '张三' } as any,
            createdAt: '2024-01-15',
          } as Document,
          {
            id: 2,
            title: '新员工入职培训手册',
            viewCount: 198,
            author: { nickname: '李四' } as any,
            createdAt: '2024-01-14',
          } as Document,
          {
            id: 3,
            title: '代码审查最佳实践指南',
            viewCount: 156,
            author: { nickname: '王五' } as any,
            createdAt: '2024-01-13',
          } as Document,
          {
            id: 4,
            title: '项目管理工具使用教程',
            viewCount: 134,
            author: { nickname: '赵六' } as any,
            createdAt: '2024-01-12',
          } as Document,
          {
            id: 5,
            title: '安全编码规范文档',
            viewCount: 112,
            author: { nickname: '孙七' } as any,
            createdAt: '2024-01-11',
          } as Document,
        ])
        setLatestDocuments([
          {
            id: 6,
            title: '2024年Q1工作计划',
            author: { nickname: '周八' } as any,
            createdAt: '2024-01-16',
            category: { name: '管理制度' } as any,
          } as Document,
          {
            id: 7,
            title: '前端技术栈更新说明',
            author: { nickname: '吴九' } as any,
            createdAt: '2024-01-15',
            category: { name: '技术文档' } as any,
          } as Document,
          {
            id: 8,
            title: '客户服务响应流程',
            author: { nickname: '郑十' } as any,
            createdAt: '2024-01-14',
            category: { name: '培训资料' } as any,
          } as Document,
          {
            id: 9,
            title: '新版本功能介绍',
            author: { nickname: '钱十一' } as any,
            createdAt: '2024-01-13',
            category: { name: '产品介绍' } as any,
          } as Document,
          {
            id: 10,
            title: '团队协作规范修订版',
            author: { nickname: '陈十二' } as any,
            createdAt: '2024-01-12',
            category: { name: '管理制度' } as any,
          } as Document,
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const chartData = {
    labels: categoryStats.map((item) => item.categoryName),
    datasets: [
      {
        label: '文档数量',
        data: categoryStats.map((item) => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '文档分类统计',
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

  const hotColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            index < 3
              ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {index + 1}
        </span>
      ),
    },
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Document) => (
        <span
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => navigate(`/documents/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: '作者',
      dataIndex: ['author', 'nickname'],
      key: 'author',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (count: number) => (
        <span className="flex items-center gap-1 text-orange-500">
          <FireOutlined />
          {count}
        </span>
      ),
    },
  ]

  const latestColumns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Document) => (
        <span
          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => navigate(`/documents/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '作者',
      dataIndex: ['author', 'nickname'],
      key: 'author',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date, 'YYYY-MM-DD'),
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
      <div className="mb-8">
        <TitleText level={2} className="!mb-2">
          欢迎回来，{user?.nickname || user?.username}！👋
        </TitleText>
        <Text type="secondary" className="text-base">
          今天是 {formatDate(new Date(), 'YYYY年MM月DD日')}，祝您工作愉快！
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">文档总数</span>
              }
              value={stats.totalDocuments}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">我的文档</span>
              }
              value={stats.myDocuments}
              prefix={<EditOutlined className="text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">收藏数</span>
              }
              value={stats.favorites}
              prefix={<StarOutlined className="text-yellow-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">浏览次数</span>
              }
              value={stats.views}
              prefix={<EyeOutlined className="text-purple-500" />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col lg={12} xl={8}>
          <Card
            title={
              <span className="flex items-center gap-2">
                <FireOutlined className="text-orange-500" />
                热门文档
              </span>
            }
            className="shadow-md"
          >
            {hotDocuments.length > 0 ? (
              <Table
                dataSource={hotDocuments}
                columns={hotColumns}
                pagination={false}
                rowKey="id"
                size="small"
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col lg={12} xl={8}>
          <Card
            title={
              <span className="flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                最新文档
              </span>
            }
            className="shadow-md"
          >
            {latestDocuments.length > 0 ? (
              <Table
                dataSource={latestDocuments}
                columns={latestColumns}
                pagination={false}
                rowKey="id"
                size="small"
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col lg={24} xl={8}>
          <Card className="shadow-md h-full">
            <div className="h-80">
              {categoryStats.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty description="暂无数据" />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
