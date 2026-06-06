import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Pagination,
  Spin,
  Empty,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { documentApi, categoryApi } from '@/api'
import type { Document, Category } from '@/types'
import { DocumentCard } from '@/components'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const DocumentList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [page, pageSize, keyword, categoryId])

  const fetchCategories = async () => {
    try {
      const categories = await categoryApi.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const result = await documentApi.getDocuments({
        keyword,
        categoryId,
        page,
        pageSize,
      })
      setDocuments(result.list || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('Fetch documents error:', error)
      setDocuments([
        {
          id: 1,
          title: '前端开发规范手册',
          content: '',
          summary: '本文档介绍了前端开发的规范...',
          categoryId: 1,
          category: {
            id: 1,
            name: '技术文档',
            code: 'tech',
            sort: 1,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as Category,
          authorId: 1,
          author: {
            id: 1,
            username: 'zhangsan',
            email: 'zhangsan@example.com',
            nickname: '张三',
            role: 'user' as any,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          status: 'published',
          viewCount: 156,
          isDeleted: false,
          attachments: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        } as Document,
        {
          id: 2,
          title: '产品需求文档模板',
          content: '',
          summary: '标准的产品需求文档模板...',
          categoryId: 2,
          category: {
            id: 2,
            name: '产品文档',
            code: 'product',
            sort: 2,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as Category,
          authorId: 2,
          author: {
            id: 2,
            username: 'lisi',
            email: 'lisi@example.com',
            nickname: '李四',
            role: 'user' as any,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          status: 'published',
          viewCount: 89,
          isDeleted: false,
          attachments: [],
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14',
        } as Document,
        {
          id: 3,
          title: '新员工入职培训',
          content: '',
          summary: '新员工入职培训流程...',
          categoryId: 3,
          category: {
            id: 3,
            name: '培训资料',
            code: 'training',
            sort: 3,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          } as Category,
          authorId: 3,
          author: {
            id: 3,
            username: 'wangwu',
            email: 'wangwu@example.com',
            nickname: '王五',
            role: 'user' as any,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          status: 'published',
          viewCount: 234,
          isDeleted: false,
          attachments: [],
          createdAt: '2024-01-13',
          updatedAt: '2024-01-13',
        } as Document,
      ])
      setTotal(3)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteChange = (id: number, isFavorite: boolean) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, isFavorite } : doc
      )
    )
  }

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    setTotal((prev) => prev - 1)
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={3} className="!mb-0">
            文档列表
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/documents/create')}
          >
            新建文档
          </Button>
        </div>
        <Space wrap>
          <Search
            placeholder="搜索文档标题或内容"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 300 }}
            onSearch={(value) => {
              setKeyword(value)
              setPage(1)
            }}
          />
          <Select
            placeholder="选择分类"
            allowClear
            size="large"
            style={{ width: 200 }}
            onChange={(value) => {
              setCategoryId(value)
              setPage(1)
            }}
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : documents.length === 0 ? (
        <Empty description="暂无文档" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {documents.map((doc) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={doc.id}>
                <DocumentCard
                  document={doc}
                  isFavorite={(doc as any).isFavorite || false}
                  onFavoriteChange={handleFavoriteChange}
                  onDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
          <div className="flex justify-center mt-6">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onShowSizeChange={(_, size) => {
                setPageSize(size)
                setPage(1)
              }}
              showSizeChanger
              showTotal={(total) => `共 ${total} 条`}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default DocumentList
