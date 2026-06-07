import request from './request'
import type {
  User,
  CreateUserParams,
  UpdateUserParams,
  QueryDocumentParams,
  ApiResponse,
  PaginationResult,
} from '../types'

export const usersApi = {
  getUsers: async (
    params?: QueryDocumentParams
  ): Promise<PaginationResult<User>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<User>>>(
      '/users',
      { params }
    )
    return res.data
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await request.get<unknown, ApiResponse<User[]>>('/users/all')
    return res.data
  },

  getUser: async (id: number): Promise<User> => {
    const res = await request.get<unknown, ApiResponse<User>>(`/users/${id}`)
    return res.data
  },

  createUser: async (params: CreateUserParams): Promise<User> => {
    const res = await request.post<unknown, ApiResponse<User>>('/users', params)
    return res.data
  },

  updateUser: async (
    id: number,
    params: UpdateUserParams
  ): Promise<User> => {
    const res = await request.put<unknown, ApiResponse<User>>(
      `/users/${id}`,
      params
    )
    return res.data
  },

  deleteUser: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/users/${id}`)
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await request.post<unknown, ApiResponse>(`/users/${id}/reset-password`, {
      newPassword,
    })
  },
}
