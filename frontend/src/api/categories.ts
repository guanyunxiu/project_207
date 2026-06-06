import request from './request'
import type {
  Category,
  CreateCategoryParams,
  UpdateCategoryParams,
  ApiResponse,
} from '../types'

export const categoriesApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await request.get<unknown, ApiResponse<Category[]>>('/categories')
    return res.data
  },

  getCategory: async (id: number): Promise<Category> => {
    const res = await request.get<unknown, ApiResponse<Category>>(`/categories/${id}`)
    return res.data
  },

  createCategory: async (params: CreateCategoryParams): Promise<Category> => {
    const res = await request.post<unknown, ApiResponse<Category>>('/categories', params)
    return res.data
  },

  updateCategory: async (
    id: number,
    params: UpdateCategoryParams
  ): Promise<Category> => {
    const res = await request.put<unknown, ApiResponse<Category>>(
      `/categories/${id}`,
      params
    )
    return res.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/categories/${id}`)
  },
}
