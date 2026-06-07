import request from './request'
import type {
  Document,
  DocumentView,
  DocumentFavorite,
  CreateDocumentParams,
  UpdateDocumentParams,
  QueryDocumentParams,
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

  getViewHistory: async (
    params?: PaginationParams
  ): Promise<PaginationResult<DocumentView>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<DocumentView>>>(
      '/documents/view-history',
      { params }
    )
    return res.data
  },

  toggleFavorite: async (
    documentId: number
  ): Promise<{ isFavorite: boolean }> => {
    const res = await request.post<unknown, ApiResponse<{ isFavorite: boolean }>>(
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
