import request from './request'
import type {
  Question,
  Scale,
  AssessmentTask,
  AssessmentRecord,
  CreateQuestionParams,
  UpdateQuestionParams,
  CreateScaleParams,
  UpdateScaleParams,
  CreateAssessmentTaskParams,
  UpdateAssessmentTaskParams,
  SubmitAssessmentParams,
  QueryAssessmentParams,
  ApiResponse,
  PaginationResult,
} from '../types'

export const assessmentsApi = {
  getQuestions: async (
    params?: QueryAssessmentParams
  ): Promise<PaginationResult<Question>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Question>>>(
      '/assessments/questions',
      { params }
    )
    return res.data
  },

  getQuestionsForSelect: async (): Promise<Question[]> => {
    const res = await request.get<unknown, ApiResponse<Question[]>>(
      '/assessments/questions/select'
    )
    return res.data
  },

  getQuestion: async (id: number): Promise<Question> => {
    const res = await request.get<unknown, ApiResponse<Question>>(
      `/assessments/questions/${id}`
    )
    return res.data
  },

  createQuestion: async (params: CreateQuestionParams): Promise<Question> => {
    const res = await request.post<unknown, ApiResponse<Question>>(
      '/assessments/questions',
      params
    )
    return res.data
  },

  updateQuestion: async (
    id: number,
    params: UpdateQuestionParams
  ): Promise<Question> => {
    const res = await request.put<unknown, ApiResponse<Question>>(
      `/assessments/questions/${id}`,
      params
    )
    return res.data
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/assessments/questions/${id}`)
  },

  getScales: async (
    params?: QueryAssessmentParams
  ): Promise<PaginationResult<Scale>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Scale>>>(
      '/assessments/scales',
      { params }
    )
    return res.data
  },

  getScalesForSelect: async (): Promise<Scale[]> => {
    const res = await request.get<unknown, ApiResponse<Scale[]>>(
      '/assessments/scales/select'
    )
    return res.data
  },

  getScale: async (id: number): Promise<Scale> => {
    const res = await request.get<unknown, ApiResponse<Scale>>(
      `/assessments/scales/${id}`
    )
    return res.data
  },

  createScale: async (params: CreateScaleParams): Promise<Scale> => {
    const res = await request.post<unknown, ApiResponse<Scale>>(
      '/assessments/scales',
      params
    )
    return res.data
  },

  updateScale: async (
    id: number,
    params: UpdateScaleParams
  ): Promise<Scale> => {
    const res = await request.put<unknown, ApiResponse<Scale>>(
      `/assessments/scales/${id}`,
      params
    )
    return res.data
  },

  deleteScale: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/assessments/scales/${id}`)
  },

  getTasks: async (
    params?: QueryAssessmentParams
  ): Promise<PaginationResult<AssessmentTask>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<AssessmentTask>>>(
      '/assessments/tasks',
      { params }
    )
    return res.data
  },

  getTask: async (id: number): Promise<AssessmentTask> => {
    const res = await request.get<unknown, ApiResponse<AssessmentTask>>(
      `/assessments/tasks/${id}`
    )
    return res.data
  },

  createTask: async (params: CreateAssessmentTaskParams): Promise<AssessmentTask> => {
    const res = await request.post<unknown, ApiResponse<AssessmentTask>>(
      '/assessments/tasks',
      params
    )
    return res.data
  },

  updateTask: async (
    id: number,
    params: UpdateAssessmentTaskParams
  ): Promise<AssessmentTask> => {
    const res = await request.put<unknown, ApiResponse<AssessmentTask>>(
      `/assessments/tasks/${id}`,
      params
    )
    return res.data
  },

  deleteTask: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/assessments/tasks/${id}`)
  },

  startAssessment: async (taskId: number): Promise<AssessmentRecord> => {
    const res = await request.post<unknown, ApiResponse<AssessmentRecord>>(
      `/assessments/tasks/${taskId}/start`
    )
    return res.data
  },

  submitAssessment: async (params: SubmitAssessmentParams): Promise<AssessmentRecord> => {
    const res = await request.post<unknown, ApiResponse<AssessmentRecord>>(
      '/assessments/submit',
      params
    )
    return res.data
  },

  getRecords: async (
    params?: QueryAssessmentParams
  ): Promise<PaginationResult<AssessmentRecord>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<AssessmentRecord>>>(
      '/assessments/records',
      { params }
    )
    return res.data
  },

  getRecord: async (id: number): Promise<AssessmentRecord> => {
    const res = await request.get<unknown, ApiResponse<AssessmentRecord>>(
      `/assessments/records/${id}`
    )
    return res.data
  },

  getMyPendingTasks: async (): Promise<AssessmentRecord[]> => {
    const res = await request.get<unknown, ApiResponse<AssessmentRecord[]>>(
      '/assessments/my/pending'
    )
    return res.data
  },
}
