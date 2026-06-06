import request from './request'
import type { ApiResponse } from '../types'

export const filesApi = {
  uploadFile: async (
    file: File
  ): Promise<{ url: string; name: string; size: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request.post<
      unknown,
      ApiResponse<{ url: string; name: string; size: number }>
    >('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  deleteFile: async (filename: string): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/files/${filename}`)
  },
}
