import { useState } from 'react'
import {
  Tabs,
  Card,
  List,
  Modal,
  Form,
  DatePicker,
  Select,
  Button,
  Tag,
  Table,
  Space,
  Typography,
  Avatar,
  Spin,
  Empty,
  message,
  Popconfirm,
  Row,
  Col,
  Descriptions,
  Divider,
  Input,
} from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BookOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { TabsProps } from 'antd'
import { counselingApi } from '@/api'
import { useRequest } from '@/hooks'
import {
  AppointmentStatus,
  Status,
  type Counselor,
  type CounselingAppointment,
  type CounselingRecord,
  type AvailableTimeSlot,
  type CreateAppointmentParams,
} from '@/types'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const AppointmentStatusText: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待确认',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.NO_SHOW]: '未出席',
}

const AppointmentStatusColor: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'orange',
  [AppointmentStatus.CONFIRMED]: 'green',
  [AppointmentStatus.CANCELLED]: 'red',
  [AppointmentStatus.COMPLETED]: 'blue',
  [AppointmentStatus.NO_SHOW]: 'default',
}

const CounselorStatusText: Record<Status, string> = {
  [Status.ACTIVE]: '可预约',
  [Status.INACTIVE]: '不可预约',
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

const CounselorStatusColor: Record<Status, string> = {
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

const Counseling = () => {
  const [activeTab, setActiveTab] = useState('counselors')
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [bookingModalVisible, setBookingModalVisible] = useState(false)
  const [appointmentDetailModalVisible, setAppointmentDetailModalVisible] = useState(false)
  const [recordDetailModalVisible, setRecordDetailModalVisible] = useState(false)
  const [currentAppointment, setCurrentAppointment] = useState<CounselingAppointment | null>(null)
  const [currentRecord, setCurrentRecord] = useState<CounselingRecord | null>(null)
  const [bookingForm] = Form.useForm<CreateAppointmentParams>()
  const [submitting, setSubmitting] = useState(false)
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([])

  const { data: counselors, loading: counselorsLoading } = useRequest<
    { list: Counselor[]; total: number }
  >(() => counselingApi.getCounselors({ page: 1, pageSize: 100 }), [activeTab], {
    ready: activeTab === 'counselors',
  })

  const { data: myAppointments, loading: appointmentsLoading, refresh: refreshAppointments } =
    useRequest<CounselingAppointment[]>(() => counselingApi.getMyAppointments(), [activeTab], {
      ready: activeTab === 'appointments',
    })

  const { data: myRecords, loading: recordsLoading } = useRequest<
    CounselingRecord[]
  >(() => counselingApi.getMyRecords(), [activeTab], {
    ready: activeTab === 'records',
  })

  const fetchTimeSlots = async (counselorId: number, date: string) => {
    try {
      setTimeSlotsLoading(true)
      const slots = await counselingApi.getAvailableTimeSlots(counselorId, date)
      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error('获取可预约时间段失败', error)
      message.error('获取可预约时间段失败')
      setAvailableTimeSlots([])
    } finally {
      setTimeSlotsLoading(false)
    }
  }

  const handleSelectCounselor = (counselor: Counselor) => {
    setSelectedCounselor(counselor)
    setSelectedDate('')
    setAvailableTimeSlots([])
    bookingForm.resetFields()
    setBookingModalVisible(true)
  }

  const handleDateChange = (date: any) => {
    if (date && selectedCounselor) {
      const dateStr = date.format('YYYY-MM-DD')
      setSelectedDate(dateStr)
      fetchTimeSlots(selectedCounselor.id, dateStr)
      bookingForm.setFieldsValue({
        appointmentDate: dateStr,
        startTime: undefined,
        endTime: undefined,
      })
    }
  }

  const handleTimeSlotSelect = (slot: AvailableTimeSlot) => {
    if (!slot.available) return
    bookingForm.setFieldsValue({
      startTime: slot.startTime,
      endTime: slot.endTime,
    })
  }

  const handleBookingSubmit = async () => {
    try {
      const values = await bookingForm.validateFields()
      if (!selectedCounselor) return

      setSubmitting(true)
      await counselingApi.createAppointment({
        ...values,
        counselorId: selectedCounselor.id,
      })
      message.success('预约成功')
      setBookingModalVisible(false)
      bookingForm.resetFields()
      setSelectedCounselor(null)
      setSelectedDate('')
      setAvailableTimeSlots([])
      refreshAppointments()
    } catch (error) {
      console.error('预约失败', error)
      message.error('预约失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelAppointment = async (appointment: CounselingAppointment) => {
    try {
      await counselingApi.updateAppointment(appointment.id, {
        status: AppointmentStatus.CANCELLED,
        cancelReason: '用户取消',
      })
      message.success('取消预约成功')
      refreshAppointments()
    } catch (error) {
      console.error('取消预约失败', error)
      message.error('取消预约失败')
    }
  }

  const handleViewAppointmentDetail = (appointment: CounselingAppointment) => {
    setCurrentAppointment(appointment)
    setAppointmentDetailModalVisible(true)
  }

  const handleViewRecordDetail = (record: CounselingRecord) => {
    setCurrentRecord(record)
    setRecordDetailModalVisible(true)
  }

  const handleDownloadRecord = (_record: CounselingRecord) => {
    message.info('下载功能开发中')
  }

  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <div className="text-center py-8 text-gray-500">
          <CalendarOutlined className="text-3xl mb-2" />
          <p>请先选择预约日期</p>
        </div>
      )
    }

    if (timeSlotsLoading) {
      return (
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      )
    }

    if (availableTimeSlots.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Empty description="该日期暂无可用时间段" />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-4 gap-3">
        {availableTimeSlots.map((slot, index) => (
          <Button
            key={index}
            type={
              bookingForm.getFieldValue('startTime') === slot.startTime ? 'primary' : 'default'
            }
            disabled={!slot.available}
            onClick={() => handleTimeSlotSelect(slot)}
            className="h-12"
          >
            {slot.startTime} - {slot.endTime}
          </Button>
        ))}
      </div>
    )
  }

  const renderCounselorList = () => {
    if (counselorsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      )
    }

    const counselorList = counselors?.list || []

    if (counselorList.length === 0) {
      return <Empty description="暂无咨询师" />
    }

    return (
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
        dataSource={counselorList.filter((c) => c.status === Status.ACTIVE)}
        renderItem={(counselor) => (
          <List.Item>
            <Card
              hoverable
              actions={[
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleSelectCounselor(counselor)}
                  disabled={counselor.status !== Status.ACTIVE}
                >
                  立即预约
                </Button>,
              ]}
            >
              <Card.Meta
                avatar={
                  <Avatar
                    size={64}
                    src={counselor.user?.avatar}
                    icon={<UserOutlined />}
                    className="bg-blue-500"
                  />
                }
                title={
                  <Space>
                    <span className="text-lg font-semibold">
                      {counselor.user?.nickname || counselor.user?.username}
                    </span>
                    <Tag color={CounselorStatusColor[counselor.status]}>
                      {CounselorStatusText[counselor.status]}
                    </Tag>
                  </Space>
                }
                description={
                  <div className="mt-3">
                    <div className="mb-2">
                      <Text type="secondary">从业经验：</Text>
                      <Text>{counselor.experienceYears} 年</Text>
                    </div>
                    {counselor.qualification && (
                      <div className="mb-2">
                        <Text type="secondary">资质：</Text>
                        <Text>{counselor.qualification}</Text>
                      </div>
                    )}
                    {counselor.specialties && (
                      <div className="mb-2">
                        <Text type="secondary">专长：</Text>
                        <Space wrap className="mt-1">
                          {counselor.specialties.split(',').map((s, i) => (
                            <Tag key={i} color="blue">
                              {s.trim()}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}
                    {counselor.bio && (
                      <div>
                        <Text type="secondary">简介：</Text>
                        <Paragraph ellipsis={{ rows: 2 }} className="mt-1 mb-0">
                          {counselor.bio}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    )
  }

  const renderAppointmentList = () => {
    if (appointmentsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      )
    }

    const appointments = myAppointments || []

    if (appointments.length === 0) {
      return <Empty description="暂无预约记录" />
    }

    const columns = [
      {
        title: '咨询师',
        dataIndex: ['counselor', 'user'],
        key: 'counselor',
        render: (user: any) => user?.nickname || user?.username || '-',
      },
      {
        title: '预约日期',
        dataIndex: 'appointmentDate',
        key: 'appointmentDate',
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: '时间段',
        key: 'time',
        render: (_: any, record: CounselingAppointment) => (
          <span>
            {record.startTime} - {record.endTime}
          </span>
        ),
      },
      {
        title: '咨询方式',
        dataIndex: 'consultationMethod',
        key: 'consultationMethod',
        render: (method?: string) => method || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: AppointmentStatus) => (
          <Tag color={AppointmentStatusColor[status]}>{AppointmentStatusText[status]}</Tag>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: any, record: CounselingAppointment) => (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewAppointmentDetail(record)}
            >
              查看详情
            </Button>
            {(record.status === AppointmentStatus.PENDING ||
              record.status === AppointmentStatus.CONFIRMED) && (
              <Popconfirm
                title="确定要取消这个预约吗？"
                onConfirm={() => handleCancelAppointment(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  取消预约
                </Button>
              </Popconfirm>
            )}
            {record.status === AppointmentStatus.COMPLETED && record.record && (
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadRecord(record.record!)}
              >
                下载记录
              </Button>
            )}
          </Space>
        ),
      },
    ]

    return (
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    )
  }

  const renderRecordList = () => {
    if (recordsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      )
    }

    const records = myRecords || []

    if (records.length === 0) {
      return <Empty description="暂无咨询记录" />
    }

    return (
      <List
        dataSource={records}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        renderItem={(record) => (
          <List.Item
            actions={[
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleViewRecordDetail(record)}
              >
                查看详情
              </Button>,
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadRecord(record)}
              >
                下载记录
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={48}
                  src={record.counselor?.user?.avatar}
                  icon={<BookOutlined />}
                  className="bg-green-500"
                />
              }
              title={
                <Space>
                  <span className="font-semibold">
                    {record.counselor?.user?.nickname || record.counselor?.user?.username}
                  </span>
                  <Tag color="green">
                    {dayjs(record.sessionDate).format('YYYY-MM-DD')}
                  </Tag>
                  <Tag color="blue">{record.durationMinutes} 分钟</Tag>
                </Space>
              }
              description={
                <div>
                  {record.mainConcerns && (
                    <div className="mb-1">
                      <Text type="secondary">主要问题：</Text>
                      <Text>{record.mainConcerns}</Text>
                    </div>
                  )}
                  {record.sessionSummary && (
                    <div>
                      <Text type="secondary">咨询摘要：</Text>
                      <Paragraph ellipsis={{ rows: 1 }} className="mt-1 mb-0">
                        {record.sessionSummary}
                      </Paragraph>
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'counselors',
      label: (
        <Space>
          <UserOutlined />
          咨询师列表
        </Space>
      ),
      children: renderCounselorList(),
    },
    {
      key: 'appointments',
      label: (
        <Space>
          <CalendarOutlined />
          我的预约
        </Space>
      ),
      children: renderAppointmentList(),
    },
    {
      key: 'records',
      label: (
        <Space>
          <BookOutlined />
          咨询记录
        </Space>
      ),
      children: renderRecordList(),
    },
  ]

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Title level={3} className="!mb-0">
            心理咨询
          </Title>
          <Text type="secondary">专业的心理咨询服务，助您健康生活</Text>
        </div>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card className="text-center">
              <div className="text-3xl text-blue-500 mb-2">
                <UserOutlined />
              </div>
              <div className="text-2xl font-bold">
                {counselors?.list?.filter((c) => c.status === Status.ACTIVE).length || 0}
              </div>
              <div className="text-gray-500">可用咨询师</div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="text-center">
              <div className="text-3xl text-orange-500 mb-2">
                <ClockCircleOutlined />
              </div>
              <div className="text-2xl font-bold">
                {
                  myAppointments?.filter(
                    (a) =>
                      a.status === AppointmentStatus.PENDING ||
                      a.status === AppointmentStatus.CONFIRMED
                  ).length || 0
                }
              </div>
              <div className="text-gray-500">待进行预约</div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="text-center">
              <div className="text-3xl text-green-500 mb-2">
                <CheckCircleOutlined />
              </div>
              <div className="text-2xl font-bold">
                {myRecords?.length || 0}
              </div>
              <div className="text-gray-500">咨询记录</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <Modal
        title={
          <Space>
            <UserOutlined />
            预约咨询 -{' '}
            {selectedCounselor?.user?.nickname || selectedCounselor?.user?.username}
          </Space>
        }
        open={bookingModalVisible}
        onCancel={() => {
          setBookingModalVisible(false)
          setSelectedCounselor(null)
          setSelectedDate('')
          setAvailableTimeSlots([])
          bookingForm.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setBookingModalVisible(false)
              setSelectedCounselor(null)
              setSelectedDate('')
              setAvailableTimeSlots([])
              bookingForm.resetFields()
            }}
          >
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleBookingSubmit}>
            确认预约
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {selectedCounselor && (
          <div>
            <Descriptions column={1} size="small" className="mb-4">
              <Descriptions.Item label="咨询师">
                {selectedCounselor.user?.nickname || selectedCounselor.user?.username}
              </Descriptions.Item>
              <Descriptions.Item label="专长">
                {selectedCounselor.specialties || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="从业经验">
                {selectedCounselor.experienceYears} 年
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form form={bookingForm} layout="vertical">
              <Form.Item
                name="appointmentDate"
                label="选择日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  onChange={handleDateChange}
                  placeholder="请选择预约日期"
                />
              </Form.Item>

              <Form.Item
                name="startTime"
                label="选择时间段"
                rules={[{ required: true, message: '请选择时间段' }]}
              >
                <div className="hidden">
                  <Select />
                </div>
                {renderTimeSlots()}
              </Form.Item>

              <Form.Item name="endTime" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="type" label="咨询类型">
                <Select placeholder="请选择咨询类型">
                  <Option value="individual">个人咨询</Option>
                  <Option value="couple">伴侣咨询</Option>
                  <Option value="family">家庭咨询</Option>
                  <Option value="group">团体咨询</Option>
                </Select>
              </Form.Item>

              <Form.Item name="consultationMethod" label="咨询方式">
                <Select placeholder="请选择咨询方式">
                  <Option value="online">线上视频</Option>
                  <Option value="phone">电话咨询</Option>
                  <Option value="offline">线下面谈</Option>
                </Select>
              </Form.Item>

              <Form.Item name="problemDescription" label="问题描述">
                <Input.TextArea
                  rows={3}
                  placeholder="请简要描述您的问题（选填）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item name="remarks" label="备注">
                <Input.TextArea
                  rows={2}
                  placeholder="其他需要说明的事项（选填）"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="预约详情"
        open={appointmentDetailModalVisible}
        onCancel={() => {
          setAppointmentDetailModalVisible(false)
          setCurrentAppointment(null)
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setAppointmentDetailModalVisible(false)
              setCurrentAppointment(null)
            }}
          >
            关闭
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {currentAppointment && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约编号">
              {currentAppointment.id}
            </Descriptions.Item>
            <Descriptions.Item label="咨询师">
              {currentAppointment.counselor?.user?.nickname ||
                currentAppointment.counselor?.user?.username ||
                '-'}
            </Descriptions.Item>
            <Descriptions.Item label="预约日期">
              {dayjs(currentAppointment.appointmentDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="时间段">
              {currentAppointment.startTime} - {currentAppointment.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="咨询类型">
              {currentAppointment.type || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="咨询方式">
              {currentAppointment.consultationMethod || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={AppointmentStatusColor[currentAppointment.status]}>
                {AppointmentStatusText[currentAppointment.status]}
              </Tag>
            </Descriptions.Item>
            {currentAppointment.problemDescription && (
              <Descriptions.Item label="问题描述">
                {currentAppointment.problemDescription}
              </Descriptions.Item>
            )}
            {currentAppointment.cancelReason && (
              <Descriptions.Item label="取消原因">
                {currentAppointment.cancelReason}
              </Descriptions.Item>
            )}
            {currentAppointment.remarks && (
              <Descriptions.Item label="备注">
                {currentAppointment.remarks}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {dayjs(currentAppointment.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="咨询记录详情"
        open={recordDetailModalVisible}
        onCancel={() => {
          setRecordDetailModalVisible(false)
          setCurrentRecord(null)
        }}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => currentRecord && handleDownloadRecord(currentRecord)}
          >
            下载记录
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setRecordDetailModalVisible(false)
              setCurrentRecord(null)
            }}
          >
            关闭
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {currentRecord && (
          <div className="space-y-4">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="咨询师">
                {currentRecord.counselor?.user?.nickname ||
                  currentRecord.counselor?.user?.username ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="咨询日期">
                {dayjs(currentRecord.sessionDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="咨询时长">
                {currentRecord.durationMinutes} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="保密">
                {currentRecord.isConfidential ? (
                  <Tag color="green">是</Tag>
                ) : (
                  <Tag color="orange">否</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            {currentRecord.mainConcerns && (
              <div>
                <Text strong className="block mb-1">
                  <InfoCircleOutlined className="mr-1" />
                  主要问题
                </Text>
                <Card size="small" className="bg-gray-50">
                  {currentRecord.mainConcerns}
                </Card>
              </div>
            )}

            {currentRecord.sessionSummary && (
              <div>
                <Text strong className="block mb-1">
                  <BookOutlined className="mr-1" />
                  咨询摘要
                </Text>
                <Card size="small" className="bg-gray-50">
                  {currentRecord.sessionSummary}
                </Card>
              </div>
            )}

            {currentRecord.assessment && (
              <div>
                <Text strong className="block mb-1">
                  <InfoCircleOutlined className="mr-1" />
                  评估
                </Text>
                <Card size="small" className="bg-gray-50">
                  {currentRecord.assessment}
                </Card>
              </div>
            )}

            {currentRecord.interventionPlan && (
              <div>
                <Text strong className="block mb-1">
                  <CheckCircleOutlined className="mr-1" />
                  干预方案
                </Text>
                <Card size="small" className="bg-gray-50">
                  {currentRecord.interventionPlan}
                </Card>
              </div>
            )}

            {currentRecord.followUp && (
              <div>
                <Text strong className="block mb-1">
                  <CalendarOutlined className="mr-1" />
                  后续跟进
                </Text>
                <Card size="small" className="bg-gray-50">
                  {currentRecord.followUp}
                </Card>
              </div>
            )}

            {currentRecord.riskAssessment && (
              <div>
                <Text strong className="block mb-1">
                  <CloseCircleOutlined className="mr-1 text-red-500" />
                  风险评估
                </Text>
                <Card size="small" className="bg-red-50">
                  {currentRecord.riskAssessment}
                </Card>
              </div>
            )}

            {currentRecord.needsReferral && currentRecord.referralInfo && (
              <div>
                <Text strong className="block mb-1">
                  <InfoCircleOutlined className="mr-1 text-orange-500" />
                  转介信息
                </Text>
                <Card size="small" className="bg-orange-50">
                  {currentRecord.referralInfo}
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Counseling
