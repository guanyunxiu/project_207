import { useState } from 'react'
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Statistic,
  Row,
  Col,
  Divider,
  Modal,
  Radio,
  Checkbox,
  message,
  Steps,
  Result,
} from 'antd'
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { assessmentsApi } from '@/api'
import {
  Status,
  ScaleType,
  QuestionType,
  type AssessmentRecord,
  type QuestionOption,
  type PaginationResult,
} from '@/types'
import { useRequest } from '@/hooks'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

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

const MyAssessments = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const [answerModalVisible, setAnswerModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<AssessmentRecord | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: pendingData, loading: pendingLoading, refresh: refreshPending } = useRequest<AssessmentRecord[]>(
    () => assessmentsApi.getMyPendingTasks(),
    [activeTab],
    {
      ready: activeTab === 'pending',
    }
  )

  const { data: historyData, loading: historyLoading, refresh: refreshHistory } = useRequest<PaginationResult<AssessmentRecord>>(
    () =>
      assessmentsApi.getRecords({
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    [pagination.current, pagination.pageSize, activeTab],
    {
      ready: activeTab === 'history',
    }
  )

  const handleStartAssessment = async (record: AssessmentRecord) => {
    try {
      const result = await assessmentsApi.startAssessment(record.taskId)
      const task = await assessmentsApi.getTask(record.taskId)
      setCurrentRecord({
        ...record,
        id: result.id,
        task,
      })
      setCurrentQuestionIndex(0)
      setAnswers({})
      setSubmitted(false)
      setAnswerModalVisible(true)
    } catch (error) {
      console.error('开始测评失败', error)
    }
  }

  const handleContinueAssessment = async (record: AssessmentRecord) => {
    const task = await assessmentsApi.getTask(record.taskId)
    setCurrentRecord({
      ...record,
      task,
    })
    setCurrentQuestionIndex(0)
    setAnswers({})
    setSubmitted(false)
    setAnswerModalVisible(true)
  }

  const handleViewResult = async (record: AssessmentRecord) => {
    navigate(`/assessments/records/${record.id}`)
  }

  const handleAnswerChange = (questionId: number, optionIds: number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIds,
    }))
  }

  const handleSubmit = async () => {
    if (!currentRecord) return

    const questions = currentRecord.task?.scale?.scaleQuestions || []
    const answeredCount = Object.keys(answers).length

    if (answeredCount < questions.length) {
      Modal.confirm({
        title: '还有题目未作答',
        content: `您还有 ${questions.length - answeredCount} 道题未作答，确定要提交吗？`,
        onOk: async () => {
          await doSubmit()
        },
      })
      return
    }

    await doSubmit()
  }

  const doSubmit = async () => {
    if (!currentRecord) return

    try {
      setSubmitting(true)
      const answerList = Object.entries(answers).map(([questionId, optionIds]) => ({
        questionId: parseInt(questionId, 10),
        optionIds,
      }))

      const result = await assessmentsApi.submitAssessment({
        recordId: currentRecord.id,
        answers: answerList,
      })

      setCurrentRecord({
        ...currentRecord,
        ...result,
      })
      setSubmitted(true)
      refreshPending()
      refreshHistory()
      message.success('提交成功')
    } catch (error) {
      console.error('提交失败', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setAnswerModalVisible(false)
    setCurrentRecord(null)
    setSubmitted(false)
    refreshPending()
    refreshHistory()
  }

  const questions = currentRecord?.task?.scale?.scaleQuestions
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sq) => sq.question) || []

  const currentQuestion = questions[currentQuestionIndex]

  const renderPendingList = () => {
    if (pendingLoading) {
      return <Empty description="加载中..." />
    }

    if (!pendingData || pendingData.length === 0) {
      return <Empty description="暂无待完成的测评" />
    }

    return (
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
        dataSource={pendingData}
        renderItem={(record) => (
          <List.Item>
            <Card
              hoverable
              actions={[
                record.status === Status.IN_PROGRESS ? (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleContinueAssessment(record)}
                  >
                    继续答题
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartAssessment(record)}
                  >
                    开始答题
                  </Button>
                ),
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    <span>{record.task?.name}</span>
                    {record.task?.scale && (
                      <Tag color={ScaleTypeColor[record.task.scale.type]}>
                        {ScaleTypeText[record.task.scale.type]}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div className="mb-2">
                      <Tag color={StatusColor[record.status]}>
                        {StatusText[record.status]}
                      </Tag>
                    </div>
                    {record.task?.description && (
                      <Paragraph ellipsis={{ rows: 2 }} className="mb-2">
                        {record.task.description}
                      </Paragraph>
                    )}
                    <div className="text-gray-500 text-sm">
                      {record.task?.startTime && (
                        <div>
                          <ClockCircleOutlined className="mr-1" />
                          开始时间：{dayjs(record.task.startTime).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                      {record.task?.endTime && (
                        <div>
                          <ClockCircleOutlined className="mr-1" />
                          截止时间：{dayjs(record.task.endTime).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    )
  }

  const renderHistoryList = () => {
    if (historyLoading) {
      return <Empty description="加载中..." />
    }

    if (!historyData?.list || historyData.list.length === 0) {
      return <Empty description="暂无测评记录" />
    }

    return (
      <List
        dataSource={historyData.list}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: historyData.total,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize })
          },
        }}
        renderItem={(record) => (
          <List.Item
            actions={[
              record.status === Status.COMPLETED && (
                <Button
                  type="link"
                  onClick={() => handleViewResult(record)}
                >
                  查看结果
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                record.status === Status.COMPLETED ? (
                  <CheckCircleOutlined className="text-2xl text-green-500" />
                ) : record.status === Status.EXPIRED ? (
                  <ClockCircleOutlined className="text-2xl text-red-500" />
                ) : (
                  <ClockCircleOutlined className="text-2xl text-orange-500" />
                )
              }
              title={
                <Space>
                  <span>{record.task?.name}</span>
                  {record.task?.scale && (
                    <Tag color={ScaleTypeColor[record.task.scale.type]}>
                      {ScaleTypeText[record.task.scale.type]}
                    </Tag>
                  )}
                  <Tag color={StatusColor[record.status]}>
                    {StatusText[record.status]}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  {record.status === Status.COMPLETED && (
                    <div className="mb-1">
                      <Text strong>得分：</Text>
                      {record.totalScore} 分
                    </div>
                  )}
                  {record.resultDescription && (
                    <Paragraph ellipsis={{ rows: 2 }} className="mb-1">
                      {record.resultDescription}
                    </Paragraph>
                  )}
                  <div className="text-gray-500 text-sm">
                    {record.submittedAt && (
                      <span>提交时间：{dayjs(record.submittedAt).format('YYYY-MM-DD HH:mm')}</span>
                    )}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  return (
    <div>
      <Card
        tabList={[
          { key: 'pending', tab: '待完成测评' },
          { key: 'history', tab: '测评记录' },
        ]}
        activeTabKey={activeTab}
        onTabChange={(key) => setActiveTab(key as 'pending' | 'history')}
      >
        {activeTab === 'pending' && (
          <div>
            <Row gutter={16} className="mb-6">
              <Col span={8}>
                <Card>
                  <Statistic
                    title="待完成测评"
                    value={pendingData?.filter((r: AssessmentRecord) => r.status === Status.PENDING).length || 0}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="进行中测评"
                    value={pendingData?.filter((r: AssessmentRecord) => r.status === Status.IN_PROGRESS).length || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<PlayCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="已完成测评"
                    value={historyData?.list?.filter((r: AssessmentRecord) => r.status === Status.COMPLETED).length || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            {renderPendingList()}
          </div>
        )}

        {activeTab === 'history' && renderHistoryList()}
      </Card>

      <Modal
        title={
          <Space>
            {currentRecord?.task?.name}
            {currentRecord?.task?.scale && (
              <Tag color={ScaleTypeColor[currentRecord.task.scale.type]}>
                {ScaleTypeText[currentRecord.task.scale.type]}
              </Tag>
            )}
          </Space>
        }
        open={answerModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
        maskClosable={false}
        destroyOnClose
      >
        {submitted && currentRecord ? (
          <Result
            status="success"
            title="测评完成"
            subTitle={currentRecord.resultDescription}
            extra={[
              <Button type="primary" key="close" onClick={handleCloseModal}>
                关闭
              </Button>,
              <Button key="view" onClick={() => navigate(`/assessments/records/${currentRecord.id}`)}>
                查看详情
              </Button>,
            ]}
          />
        ) : (
          <div>
            {questions.length > 0 && (
              <>
                <Steps
                  current={currentQuestionIndex}
                  items={questions.map((_, index) => ({
                    title: `${index + 1}`,
                  }))}
                  className="mb-6"
                  size="small"
                />

                <Divider />

                <div className="mb-6">
                  <Title level={4}>
                    {currentQuestionIndex + 1}. {currentQuestion?.content}
                    <Tag color="blue" className="ml-2">
                      {currentQuestion?.type === QuestionType.SINGLE ? '单选题' : '多选题'}
                    </Tag>
                  </Title>

                  <div className="pl-4 mt-4">
                    {currentQuestion?.type === QuestionType.SINGLE ? (
                      <Radio.Group
                        value={answers[currentQuestion.id]?.[0]}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, [e.target.value])}
                      >
                        <Space direction="vertical" className="w-full">
                          {currentQuestion?.options
                            .sort((a: QuestionOption, b: QuestionOption) => a.sortOrder - b.sortOrder)
                            .map((option: QuestionOption) => (
                              <Radio key={option.id} value={option.id}>
                                {option.label}. {option.content}
                              </Radio>
                            ))}
                        </Space>
                      </Radio.Group>
                    ) : (
                      <Checkbox.Group
                        value={answers[currentQuestion.id] || []}
                        onChange={(values) => handleAnswerChange(currentQuestion.id, values as number[])}
                      >
                        <Space direction="vertical" className="w-full">
                          {currentQuestion?.options
                            .sort((a: QuestionOption, b: QuestionOption) => a.sortOrder - b.sortOrder)
                            .map((option: QuestionOption) => (
                              <Checkbox key={option.id} value={option.id}>
                                {option.label}. {option.content}
                              </Checkbox>
                            ))}
                        </Space>
                      </Checkbox.Group>
                    )}
                  </div>
                </div>

                <Divider />

                <div className="flex justify-between">
                  <Button
                    icon={<ArrowLeftOutlined />}
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                  >
                    上一题
                  </Button>

                  <Space>
                    <Text type="secondary">
                      已答 {Object.keys(answers).length} / {questions.length} 题
                    </Text>
                  </Space>

                  <Space>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        type="primary"
                        onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                      >
                        下一题
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        loading={submitting}
                        onClick={handleSubmit}
                      >
                        提交测评
                      </Button>
                    )}
                  </Space>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MyAssessments
