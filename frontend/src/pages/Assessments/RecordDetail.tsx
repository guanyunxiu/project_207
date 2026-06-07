import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
  Result,
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { assessmentsApi } from '@/api'
import {
  Status,
  ScaleType,
  QuestionType,
  type AssessmentRecord as AssessmentRecordType,
  type QuestionOption,
  type AssessmentAnswer,
  type ScaleQuestion,
} from '@/types'
import { useRequest } from '@/hooks'
import dayjs from 'dayjs'

const { Title, Text } = Typography

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

const AssessmentRecordDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: record, loading } = useRequest<AssessmentRecordType>(
    () => assessmentsApi.getRecord(parseInt(id || '0', 10)),
    [id],
    {
      ready: !!id,
    }
  )

  const getAnswerByQuestionId = (
    questionId: number,
    answers: AssessmentAnswer[]
  ): AssessmentAnswer | undefined => {
    return answers.find((a) => a.questionId === questionId)
  }

  const getMaxScore = (rec: AssessmentRecordType | null): number => {
    if (!rec?.task?.scale) return 0
    return rec.task.scale.scaleQuestions.reduce((sum: number, sq: ScaleQuestion) => {
      return sum + sq.question.options.reduce((max: number, opt: QuestionOption) => Math.max(max, opt.score), 0)
    }, 0)
  }

  if (!record && !loading) {
    return (
      <Result
        status="404"
        title="记录不存在"
        subTitle="您访问的测评记录不存在或已被删除"
        extra={
          <Button type="primary" onClick={() => navigate('/assessments')}>
            返回测评列表
          </Button>
        }
      />
    )
  }

  const questions = record?.task?.scale?.scaleQuestions
    .sort((a: ScaleQuestion, b: ScaleQuestion) => a.sortOrder - b.sortOrder)
    .map((sq: ScaleQuestion) => sq.question) || []

  return (
    <div>
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/assessments')}
            >
              返回
            </Button>
            <span className="text-lg font-bold">测评结果详情</span>
          </Space>
        }
        loading={loading}
      >
        {record && (
          <div>
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="测评得分"
                    value={record.totalScore}
                    suffix={`/ ${getMaxScore(record)}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="测评状态"
                    value={StatusText[record.status]}
                    valueStyle={{
                      color:
                        record.status === Status.COMPLETED ? '#52c41a' : '#faad14',
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="答题用时"
                    value={
                      record.startedAt && record.submittedAt
                        ? Math.round(
                            (new Date(record.submittedAt).getTime() -
                              new Date(record.startedAt).getTime()) /
                              60000
                          )
                        : '-'
                    }
                    suffix="分钟"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={Math.round((record.totalScore / getMaxScore(record)) * 100)}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card className="mb-6" size="small">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="测评名称">
                  <Space>
                    {record.task?.name}
                    {record.task?.scale && (
                      <Tag color={ScaleTypeColor[record.task.scale.type]}>
                        {ScaleTypeText[record.task.scale.type]}
                      </Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="量表名称">
                  {record.task?.scale?.name}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={StatusColor[record.status]}>
                    {StatusText[record.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {record.submittedAt
                    ? dayjs(record.submittedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
                {record.task?.description && (
                  <Descriptions.Item label="测评说明" span={2}>
                    {record.task.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {record.resultDescription && (
              <Card
                className="mb-6"
                size="small"
                title={
                  <Space>
                    <CheckCircleOutlined className="text-green-500" />
                    <span>测评结果</span>
                  </Space>
                }
              >
                <Alert
                  message={record.resultDescription}
                  type="info"
                  showIcon
                />
              </Card>
            )}

            <Divider orientation="left">答题详情</Divider>

            <div className="space-y-6">
              {questions.map((question, index) => {
                const answer = getAnswerByQuestionId(
                  question.id,
                  record.answers || []
                )
                const selectedOptionIds = answer?.optionIds || []
                const myScore = answer?.score || 0
                const maxOptionScore = Math.max(
                  ...question.options.map((o: QuestionOption) => o.score)
                )

                return (
                  <Card key={question.id} size="small">
                    <div className="mb-4">
                      <Title level={5}>
                        {index + 1}. {question.content}
                        <Space className="ml-2">
                          <Tag color="blue">
                            {question.type === QuestionType.SINGLE
                              ? '单选题'
                              : '多选题'}
                          </Tag>
                          <Tag color={myScore >= maxOptionScore ? 'green' : 'orange'}>
                            得分：{myScore}/{maxOptionScore}
                          </Tag>
                        </Space>
                      </Title>
                    </div>

                    <div className="pl-4 space-y-2">
                      {question.options
                        .sort(
                          (a: QuestionOption, b: QuestionOption) =>
                            a.sortOrder - b.sortOrder
                        )
                        .map((option: QuestionOption) => {
                          const isSelected = selectedOptionIds.includes(option.id)
                          return (
                            <div
                              key={option.id}
                              className={`p-3 rounded-lg border ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  {isSelected && (
                                    <CheckCircleOutlined className="text-blue-500 mr-2" />
                                  )}
                                  <span
                                    className={isSelected ? 'font-medium' : ''}
                                  >
                                    {option.label}. {option.content}
                                  </span>
                                </div>
                                <Text type="secondary">
                                  {option.score} 分
                                </Text>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AssessmentRecordDetail
