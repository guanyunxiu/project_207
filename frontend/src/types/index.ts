export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'super_admin',
  HR_ADMIN = 'hr_admin',
  ASSESSMENT_ADMIN = 'assessment_admin',
  EMPLOYEE = 'employee',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum ScaleType {
  ANXIETY = 'anxiety',
  STRESS = 'stress',
  SLEEP = 'sleep',
  EMOTION = 'emotion',
}

export enum DocumentPermission {
  PUBLIC = 'public',
  DEPARTMENT = 'department',
  PRIVATE = 'private',
}

export enum NotificationType {
  COMMENT = 'comment',
  MENTION = 'mention',
  LIKE = 'like',
  REVIEW = 'review',
  SYSTEM = 'system',
}

export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  avatar?: string
  role: Role
  status: Status
  phone?: string
  department?: string
  position?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  code: string
  description?: string
  sort: number
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: number
  title: string
  content: string
  summary?: string
  categoryId: number
  authorId: number
  author?: User
  category?: Category
  status: Status
  permission: DocumentPermission
  viewCount: number
  likeCount: number
  commentCount: number
  version: number
  reviewerId?: number
  reviewer?: User
  reviewComment?: string
  reviewedAt?: string
  isDeleted: boolean
  attachments?: Array<{ name: string; url: string; size: number }>
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
  isLiked?: boolean
}

export interface DocumentComment {
  id: number
  documentId: number
  authorId: number
  author: User
  parentId?: number
  parentComment?: DocumentComment
  replies?: DocumentComment[]
  content: string
  mentionedUserIds?: number[]
  mentionedUsers?: User[]
  likeCount: number
  isDeleted: boolean
  createdAt: string
}

export interface DocumentLike {
  id: number
  documentId: number
  userId: number
  user: User
  createdAt: string
}

export interface DocumentVersion {
  id: number
  documentId: number
  version: number
  title: string
  content: string
  summary?: string
  categoryId: number
  userId: number
  user: User
  changeDescription?: string
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  senderId?: number
  sender?: User
  type: NotificationType
  title: string
  content?: string
  documentId?: number
  commentId?: number
  isRead: boolean
  data?: Record<string, any>
  createdAt: string
}

export interface DocumentView {
  id: number
  documentId: number
  userId: number
  viewedAt: string
  document?: Document
}

export interface DocumentFavorite {
  id: number
  documentId: number
  userId: number
  createdAt: string
  document?: Document
}

export interface DocumentStats {
  totalDocuments: number
  publishedDocuments: number
  pendingReviewDocuments: number
  draftDocuments: number
  totalViews: number
  totalLikes: number
  totalComments: number
  hotDocuments: Document[]
  publishTrend: Array<{ date: string; count: number }>
  myDocuments?: number
  favorites?: number
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
  nickname?: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface UpdateProfileParams {
  nickname?: string
  avatar?: string
  phone?: string
  department?: string
  position?: string
}

export interface CreateDocumentParams {
  title: string
  content: string
  summary?: string
  categoryId: number
  status?: Status
  permission?: DocumentPermission
  changeDescription?: string
  attachments?: any[]
}

export interface UpdateDocumentParams {
  title?: string
  content?: string
  summary?: string
  categoryId?: number
  status?: Status
  permission?: DocumentPermission
  changeDescription?: string
  attachments?: any[]
}

export interface QueryDocumentParams {
  keyword?: string
  categoryId?: number
  authorId?: number
  status?: Status
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'viewCount'
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateCommentParams {
  documentId: number
  parentId?: number
  content: string
  mentionedUserIds?: number[]
}

export interface ReviewDocumentParams {
  status: Status.PUBLISHED | Status.REJECTED
  reviewComment?: string
}

export interface BatchManageParams {
  ids: number[]
  action: 'publish' | 'reject' | 'delete' | 'restore'
}

export interface CreateCategoryParams {
  name: string
  code: string
  description?: string
  sort?: number
  status?: Status
}

export interface UpdateCategoryParams {
  name?: string
  code?: string
  description?: string
  sort?: number
  status?: Status
}

export interface CreateUserParams {
  username: string
  email: string
  password: string
  nickname?: string
  role?: Role
  phone?: string
  department?: string
  position?: string
}

export interface UpdateUserParams {
  username?: string
  email?: string
  nickname?: string
  role?: Role
  status?: Status
  phone?: string
  department?: string
  position?: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface DocumentQueryParams {
  keyword?: string
  categoryId?: number
  sortBy?: 'latest' | 'popular'
  page?: number
  pageSize?: number
}

export interface DashboardStats {
  totalDocuments: number
  myDocuments: number
  favorites: number
  views: number
}

export interface CategoryStats {
  categoryName: string
  count: number
}

export interface UploadResponse {
  url: string
  filename: string
}

export interface QuestionOption {
  id: number
  questionId: number
  label: string
  content: string
  score: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: number
  content: string
  type: QuestionType
  score: number
  status: Status
  isDeleted: boolean
  options: QuestionOption[]
  createdAt: string
  updatedAt: string
}

export interface ScaleQuestion {
  id: number
  scaleId: number
  questionId: number
  question: Question
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Scale {
  id: number
  name: string
  type: ScaleType
  description?: string
  scoreDescription?: string
  status: Status
  isDeleted: boolean
  scaleQuestions: ScaleQuestion[]
  createdAt: string
  updatedAt: string
}

export interface AssessmentTask {
  id: number
  name: string
  description?: string
  scaleId: number
  scale?: Scale
  creatorId: number
  creator?: User
  targetUserIds?: number[]
  targetDepartments?: string[]
  startTime?: string
  endTime?: string
  status: Status
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AssessmentAnswer {
  id: number
  recordId: number
  questionId: number
  optionIds?: number[]
  score: number
  createdAt: string
  updatedAt: string
}

export interface AssessmentRecord {
  id: number
  taskId: number
  task?: AssessmentTask
  userId: number
  user?: User
  totalScore: number
  resultDescription?: string
  status: Status
  startedAt?: string
  submittedAt?: string
  answers?: AssessmentAnswer[]
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionParams {
  content: string
  type: QuestionType
  score?: number
  options: Array<{
    label: string
    content: string
    score?: number
    sortOrder?: number
  }>
  status?: Status
}

export interface UpdateQuestionParams extends Partial<CreateQuestionParams> {}

export interface CreateScaleParams {
  name: string
  type: ScaleType
  description?: string
  scoreDescription?: string
  questionIds: number[]
  status?: Status
}

export interface UpdateScaleParams extends Partial<CreateScaleParams> {}

export interface CreateAssessmentTaskParams {
  name: string
  description?: string
  scaleId: number
  targetUserIds?: number[]
  targetDepartments?: string[]
  startTime?: string
  endTime?: string
}

export interface UpdateAssessmentTaskParams extends Partial<CreateAssessmentTaskParams> {}

export interface SubmitAssessmentParams {
  recordId: number
  answers: Array<{
    questionId: number
    optionIds: number[]
  }>
}

export interface QueryAssessmentParams {
  keyword?: string
  type?: QuestionType | ScaleType
  status?: Status
  scaleId?: number
  taskId?: number
  userId?: number
  page?: number
  pageSize?: number
}
