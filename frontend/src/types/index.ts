export enum Role {
  SUPER_ADMIN = 'super_admin',
  HR_ADMIN = 'hr_admin',
  ASSESSMENT_ADMIN = 'assessment_admin',
  EMPLOYEE = 'employee',
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  DRAFT = 'draft',
  PUBLISHED = 'published',
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
  viewCount: number
  isDeleted: boolean
  attachments?: Array<{ name: string; url: string; size: number }>
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
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
  attachments?: any[]
}

export interface UpdateDocumentParams {
  title?: string
  content?: string
  summary?: string
  categoryId?: number
  status?: Status
  attachments?: any[]
}

export interface QueryDocumentParams {
  keyword?: string
  categoryId?: number
  authorId?: number
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'viewCount'
  sortOrder?: 'ASC' | 'DESC'
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
