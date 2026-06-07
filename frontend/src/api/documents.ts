import request from './request'
import type {
  Document,
  DocumentView,
  DocumentFavorite,
  DocumentComment,
  DocumentLike,
  DocumentVersion,
  DocumentStats,
  CreateDocumentParams,
  UpdateDocumentParams,
  QueryDocumentParams,
  CreateCommentParams,
  ReviewDocumentParams,
  BatchManageParams,
  PaginationResult,
  PaginationParams,
  ApiResponse,
} from '../types'

export const documentsApi = {
  getDocuments: async (
    params?: QueryDocumentParams
  ): Promise<PaginationResult<Document>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Document>>>(
      '/documents',
      { params }
    )
    return res.data
  },

  getDocument: async (id: number): Promise<Document> => {
    const res = await request.get<unknown, ApiResponse<Document>>(`/documents/${id}`)
    return res.data
  },

  createDocument: async (params: CreateDocumentParams): Promise<Document> => {
    const res = await request.post<unknown, ApiResponse<Document>>('/documents', params)
    return res.data
  },

  updateDocument: async (
    id: number,
    params: UpdateDocumentParams
  ): Promise<Document> => {
    const res = await request.put<unknown, ApiResponse<Document>>(
      `/documents/${id}`,
      params
    )
    return res.data
  },

  deleteDocument: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/documents/${id}`)
  },

  searchDocuments: async (
    keyword: string,
    params?: QueryDocumentParams
  ): Promise<PaginationResult<Document>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Document>>>(
      '/documents/search',
      {
        params: { keyword, ...params },
      }
    )
    return res.data
  },

  submitForReview: async (id: number): Promise<{ message: string }> => {
    const res = await request.post<unknown, ApiResponse<{ message: string }>>(
      `/documents/${id}/submit-review`
    )
    return res.data
  },

  reviewDocument: async (
    id: number,
    params: ReviewDocumentParams
  ): Promise<{ message: string }> => {
    const res = await request.put<unknown, ApiResponse<{ message: string }>>(
      `/documents/${id}/review`,
      params
    )
    return res.data
  },

  getPendingReviews: async (
    params?: PaginationParams
  ): Promise<PaginationResult<Document>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Document>>>(
      '/documents/reviews/pending',
      { params }
    )
    return res.data
  },

  createComment: async (
    params: CreateCommentParams
  ): Promise<DocumentComment> => {
    const res = await request.post<unknown, ApiResponse<DocumentComment>>(
      '/documents/comments',
      params
    )
    return res.data
  },

  getComments: async (
    documentId: number,
    params?: PaginationParams
  ): Promise<PaginationResult<DocumentComment>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<DocumentComment>>>(
      `/documents/${documentId}/comments`,
      { params }
    )
    return res.data
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/documents/comments/${commentId}`)
  },

  toggleLike: async (
    documentId: number
  ): Promise<{ isLiked: boolean; likeCount: number; message: string }> => {
    const res = await request.post<unknown, ApiResponse<{ isLiked: boolean; likeCount: number; message: string }>>(
      `/documents/${documentId}/like`
    )
    return res.data
  },

  getLikes: async (
    documentId: number,
    params?: PaginationParams
  ): Promise<PaginationResult<DocumentLike>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<DocumentLike>>>(
      `/documents/${documentId}/likes`,
      { params }
    )
    return res.data
  },

  getVersions: async (
    documentId: number
  ): Promise<PaginationResult<DocumentVersion>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<DocumentVersion>>>(
      `/documents/${documentId}/versions`
    )
    return res.data
  },

  getVersion: async (
    documentId: number,
    versionId: number
  ): Promise<DocumentVersion> => {
    const res = await request.get<unknown, ApiResponse<DocumentVersion>>(
      `/documents/${documentId}/versions/${versionId}`
    )
    return res.data
  },

  restoreVersion: async (
    documentId: number,
    versionId: number
  ): Promise<{ message: string; version: number }> => {
    const res = await request.post<unknown, ApiResponse<{ message: string; version: number }>>(
      `/documents/${documentId}/versions/${versionId}/restore`
    )
    return res.data
  },

  exportDocument: async (
    documentId: number,
    format: 'markdown' | 'html'
  ): Promise<{ content: string; filename: string }> => {
    const res = await request.get<unknown, ApiResponse<{ content: string; filename: string }>>(
      `/documents/${documentId}/export`,
      { params: { format } }
    )
    return res.data
  },

  getStats: async (): Promise<DocumentStats> => {
    const res = await request.get<unknown, ApiResponse<DocumentStats>>(
      '/documents/stats/overview'
    )
    return res.data
  },

  batchManage: async (
    params: BatchManageParams
  ): Promise<{ message: string; count: number }> => {
    const res = await request.post<unknown, ApiResponse<{ message: string; count: number }>>(
      '/documents/batch/manage',
      params
    )
    return res.data
  },

  getViewHistory: async (
    params?: PaginationParams
  ): Promise<PaginationResult<DocumentView>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<DocumentView>>>(
      '/documents/history/view',
      { params }
    )
    return res.data
  },

  toggleFavorite: async (
    documentId: number
  ): Promise<{ isFavorite: boolean; message: string }> => {
    const res = await request.post<unknown, ApiResponse<{ isFavorite: boolean; message: string }>>(
      `/documents/${documentId}/favorite`
    )
    return res.data
  },

  getFavorites: async (
    params?: PaginationParams
  ): Promise<PaginationResult<DocumentFavorite>> => {
    const res = await request.get<
      unknown,
      ApiResponse<PaginationResult<DocumentFavorite>>
    >('/documents/favorites/list', { params })
    return res.data
  },
}
