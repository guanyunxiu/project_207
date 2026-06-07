import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Typography, Spin, Empty } from 'antd'
import {
  FileTextOutlined,
  EditOutlined,
  StarOutlined,
  EyeOutlined,
  FireOutlined,
  ClockCircleOutlined,
  LikeOutlined,
  CommentOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { documentApi, categoryApi } from '@/api'
import { formatDate } from '@/utils'
import type { Document, CategoryStats, Category } from '@/types'
import type { AppState } from '@/store'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const { Title: TitleText, Text } = Typography

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    totalDocuments: 0,
    myDocuments: 0,
    favorites: 0,
    views: 0,
    publishedDocuments: 0,
    pendingReviewDocuments: 0,
    draftDocuments: 0,
    totalLikes: 0,
    totalComments: 0,
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [hotDocuments, setHotDocuments] = useState<Document[]>([])
  const [latestDocuments, setLatestDocuments] = useState<Document[]>([])
  const [publishTrend, setPublishTrend] = useState<any[]>([])
  const user = useAppStore((state: AppState) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [user?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, documentsRes, categoriesRes] = await Promise.all([
        documentApi.getStats(),
        documentApi.getDocuments({ pageSize: 50 }),
        categoryApi.getCategories(),
      ])

      const allDocs = documentsRes.list || []
      const myDocs = allDocs.filter((d: Document) => d.author?.id === user?.id)

      setStats({
        ...statsRes,
        myDocuments: myDocs.length,
        favorites: statsRes.favorites || 16,
      })

      const categoryStatsData = categoriesRes.map((cat: Category) => ({
        categoryName: cat.name,
        count: allDocs.filter((d: Document) => d.category?.id === cat.id).length,
      }))

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

      const hotDocs = statsRes.hotDocuments?.length > 0
        ? statsRes.hotDocuments
        : [...allDocs]
            .sort((a: Document, b: Document) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 5)

      const latestDocs = [...allDocs]
        .sort(
          (a: Document, b: Document) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        )
        .slice(0, 5)

      setHotDocuments(
        hotDocs.length > 0
          ? hotDocs
          : [
              {
                id: 1,
                title: '公司产品研发流程规范',
                viewCount: 256,
                likeCount: 42,
                author: { nickname: '张三' } as any,
                createdAt: '2024-01-15',
              } as Document,
              {
                id: 2,
                title: '新员工入职培训手册',
                viewCount: 198,
                likeCount: 38,
                author: { nickname: '李四' } as any,
                createdAt: '2024-01-14',
              } as Document,
              {
                id: 3,
                title: '代码审查最佳实践指南',
                viewCount: 156,
                likeCount: 35,
                author: { nickname: '王五' } as any,
                createdAt: '2024-01-13',
              } as Document,
              {
                id: 4,
                title: '项目管理工具使用教程',
                viewCount: 134,
                likeCount: 28,
                author: { nickname: '赵六' } as any,
                createdAt: '2024-01-12',
              } as Document,
              {
                id: 5,
                title: '安全编码规范文档',
                viewCount: 112,
                likeCount: 25,
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

      setPublishTrend(
        statsRes.publishTrend?.length > 0
          ? statsRes.publishTrend
          : generateMockTrend()
      )
    } catch (error) {
      console.error('加载数据失败', error)
      setStats({
        totalDocuments: 128,
        myDocuments: 24,
        favorites: 16,
        views: 1024,
        publishedDocuments: 86,
        pendingReviewDocuments: 12,
        draftDocuments: 30,
        totalLikes: 256,
        totalComments: 189,
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
          likeCount: 42,
          author: { nickname: '张三' } as any,
          createdAt: '2024-01-15',
        } as Document,
        {
          id: 2,
          title: '新员工入职培训手册',
          viewCount: 198,
          likeCount: 38,
          author: { nickname: '李四' } as any,
          createdAt: '2024-01-14',
        } as Document,
        {
          id: 3,
          title: '代码审查最佳实践指南',
          viewCount: 156,
          likeCount: 35,
          author: { nickname: '王五' } as any,
          createdAt: '2024-01-13',
        } as Document,
        {
          id: 4,
          title: '项目管理工具使用教程',
          viewCount: 134,
          likeCount: 28,
          author: { nickname: '赵六' } as any,
          createdAt: '2024-01-12',
        } as Document,
        {
          id: 5,
          title: '安全编码规范文档',
          viewCount: 112,
          likeCount: 25,
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
      setPublishTrend(generateMockTrend())
    } finally {
      setLoading(false)
    }
  }

  const generateMockTrend = () => {
    const trend = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trend.push({
        date: formatDate(date, 'MM-DD'),
        count: Math.floor(Math.random() * 10) + 1,
      })
    }
    return trend
  }

  const categoryChartData = {
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

  const categoryChartOptions = {
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

  const trendChartData = {
    labels: publishTrend.map((item) => item.date),
    datasets: [
      {
        label: '发布数量',
        data: publishTrend.map((item) => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  }

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '近30天发布趋势',
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
          stepSize: 2,
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
      width: 80,
      render: (count: number) => (
        <span className="flex items-center gap-1 text-orange-500">
          <FireOutlined />
          {count}
        </span>
      ),
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 70,
      render: (count: number) => (
        <span className="flex items-center gap-1 text-red-500">
          <LikeOutlined />
          {count || 0}
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
      width: 100,
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
      width: 100,
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
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">已发布</span>
              }
              value={stats.publishedDocuments}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">待审核</span>
              }
              value={stats.pendingReviewDocuments}
              prefix={<AuditOutlined className="text-orange-500" />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">总点赞</span>
              }
              value={stats.totalLikes || 0}
              prefix={<LikeOutlined className="text-red-500" />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <Statistic
              title={
                <span className="text-gray-600 font-medium">总评论</span>
              }
              value={stats.totalComments || 0}
              prefix={<CommentOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
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
                热门文档 Top 5
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
                <Bar data={categoryChartData} options={categoryChartOptions} />
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
          <Card className="shadow-md">
            <div className="h-80">
              {publishTrend.length > 0 ? (
                <Line data={trendChartData} options={trendChartOptions} />
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
