import request from './request'
import type {
  User,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
  ChangePasswordParams,
  ApiResponse,
} from '../types'

export const authApi = {
  login: async (params: LoginParams): Promise<{ token: string; user: User }> => {
    const res = await request.post<unknown, ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      params
    )
    return res.data
  },

  register: async (params: RegisterParams): Promise<User> => {
    const res = await request.post<unknown, ApiResponse<User>>('/auth/register', params)
    return res.data
  },

  getProfile: async (): Promise<User> => {
    const res = await request.get<unknown, ApiResponse<User>>('/auth/profile')
    return res.data
  },

  updateProfile: async (params: UpdateProfileParams): Promise<User> => {
    const res = await request.put<unknown, ApiResponse<User>>('/auth/profile', params)
    return res.data
  },

  changePassword: async (params: ChangePasswordParams): Promise<void> => {
    await request.post<unknown, ApiResponse>('/auth/change-password', params)
  },
}
