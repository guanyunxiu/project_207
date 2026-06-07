import { useState, useEffect } from 'react'
import {
  Card,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Empty,
  Tag,
  Avatar,
  List,
  Popconfirm,
  Divider,
  Modal,
} from 'antd'
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  RollbackOutlined,
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { documentApi } from '@/api'
import { formatDate } from '@/utils'
import type { DocumentVersion } from '@/types'

const { Title, Text, Paragraph } = Typography

const DocumentVersions = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null)

  useEffect(() => {
    if (id) {
      fetchVersions()
    }
  }, [id])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const result = await documentApi.getVersions(Number(id))
      setVersions(result.list || [])
    } catch (error) {
      console.error('获取版本历史失败', error)
      message.error('获取版本历史失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (versionId: number) => {
    try {
      const version = await documentApi.getVersion(Number(id), versionId)
      setPreviewVersion(version)
      setPreviewVisible(true)
    } catch (error) {
      console.error('获取版本详情失败', error)
      message.error('获取版本详情失败')
    }
  }

  const handleRestore = async (versionId: number) => {
    try {
      const result = await documentApi.restoreVersion(Number(id), versionId)
      message.success(`恢复成功，当前版本为 v${result.version}`)
      navigate(`/documents/${id}`)
    } catch (error) {
      console.error('恢复版本失败', error)
      message.error('恢复版本失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/documents/${id}`)}
          >
            返回文档
          </Button>
          <div>
            <Title level={2} className="!mb-0">
              <HistoryOutlined className="mr-2" />
              版本历史
            </Title>
            <Text type="secondary">共 {versions.length} 个版本</Text>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        {versions.length === 0 ? (
          <Empty description="暂无版本记录" />
        ) : (
          <List
            dataSource={versions}
            renderItem={(item, index) => (
              <List.Item
                className="hover:bg-gray-50 transition-colors rounded-lg px-4"
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(item.id)}
                  >
                    查看
                  </Button>,
                  index > 0 && (
                    <Popconfirm
                      title="确定恢复到此版本吗？"
                      description="恢复后将创建一个新版本，当前内容会被保存为历史版本"
                      onConfirm={() => handleRestore(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        icon={<RollbackOutlined />}
                        className="text-orange-500"
                      >
                        恢复
                      </Button>
                    </Popconfirm>
                  ),
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<FileTextOutlined />}
                      className="bg-gradient-to-br from-blue-500 to-purple-500"
                    />
                  }
                  title={
                    <Space>
                      <Tag color="blue" className="!text-base !font-semibold">
                        v{item.version}
                      </Tag>
                      {index === 0 && (
                        <Tag color="green" className="!text-sm">
                          当前版本
                        </Tag>
                      )}
                      <span className="font-medium">{item.title}</span>
                    </Space>
                  }
                  description={
                    <div className="space-y-1">
                      {item.changeDescription && (
                        <Paragraph className="!mb-1 !text-gray-600">
                          {item.changeDescription}
                        </Paragraph>
                      )}
                      <Space className="text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <UserOutlined />
                          {item.user?.nickname || item.user?.username}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined />
                          {formatDate(item.createdAt)}
                        </span>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={`版本 v${previewVersion?.version} - ${previewVersion?.title}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Popconfirm
            key="restore"
            title="确定恢复到此版本吗？"
            onConfirm={() => {
              if (previewVersion) {
                handleRestore(previewVersion.id)
                setPreviewVisible(false)
              }
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" key="restore">
              恢复此版本
            </Button>
          </Popconfirm>,
        ]}
        width={900}
      >
        {previewVersion && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <Space className="text-sm text-gray-500">
                <span>修改人: {previewVersion.user?.nickname || previewVersion.user?.username}</span>
                <span>修改时间: {formatDate(previewVersion.createdAt)}</span>
              </Space>
              {previewVersion.changeDescription && (
                <div className="mt-2">
                  <Text type="secondary">变更说明: </Text>
                  <Text>{previewVersion.changeDescription}</Text>
                </div>
              )}
            </div>
            <Divider />
            <div className="mb-4">
              <Title level={5}>摘要</Title>
              <Paragraph>{previewVersion.summary || '无摘要'}</Paragraph>
            </div>
            <Divider />
            <div>
              <Title level={5}>正文</Title>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewVersion.content }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DocumentVersions
