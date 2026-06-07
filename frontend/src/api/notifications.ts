import request from './request'
import type {
  Notification,
  PaginationResult,
  PaginationParams,
  ApiResponse,
  NotificationType,
} from '../types'

export interface QueryNotificationParams extends PaginationParams {
  isRead?: boolean
  type?: NotificationType
}

export const notificationsApi = {
  getNotifications: async (
    params?: QueryNotificationParams
  ): Promise<PaginationResult<Notification>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Notification>>>(
      '/notifications',
      { params }
    )
    return res.data
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await request.get<unknown, ApiResponse<{ count: number }>>(
      '/notifications/unread/count'
    )
    return res.data
  },

  markAsRead: async (id: number): Promise<{ message: string }> => {
    const res = await request.put<unknown, ApiResponse<{ message: string }>>(
      `/notifications/${id}/read`
    )
    return res.data
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await request.put<unknown, ApiResponse<{ message: string }>>(
      '/notifications/read/all'
    )
    return res.data
  },

  deleteNotification: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/notifications/${id}`)
  },
}
