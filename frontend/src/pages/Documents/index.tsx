import { useState, useEffect, useCallback } from 'react'
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
import { useNavigate, useLocation } from 'react-router-dom'
import { documentApi, categoryApi } from '@/api'
import type { Document, Category } from '@/types'
import { DocumentCard } from '@/components'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const DocumentList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()

  const fetchCategories = async () => {
    try {
      const categories = await categoryApi.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const fetchDocuments = useCallback(async () => {
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
      setDocuments([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, categoryId])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments, location.pathname])

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

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleCategoryChange = (value: number | undefined) => {
    setCategoryId(value)
    setPage(1)
  }

  const handlePageChange = (p: number, size?: number) => {
    if (size && size !== pageSize) {
      setPageSize(size)
      setPage(1)
    } else {
      setPage(p)
    }
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
            onSearch={handleSearch}
          />
          <Select
            placeholder="选择分类"
            allowClear
            size="large"
            style={{ width: 200 }}
            onChange={handleCategoryChange}
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
              onChange={handlePageChange}
              onShowSizeChange={(_, size) => handlePageChange(page, size)}
              showSizeChanger
              showTotal={(t) => `共 ${t} 条`}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default DocumentList
