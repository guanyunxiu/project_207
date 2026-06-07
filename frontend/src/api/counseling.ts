import request from './request'
import type {
  Counselor,
  CounselingAppointment,
  CounselingRecord,
  AvailableTimeSlot,
  CreateCounselorParams,
  UpdateCounselorParams,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  CreateCounselingRecordParams,
  UpdateCounselingRecordParams,
  QueryCounselingParams,
  ApiResponse,
  PaginationResult,
} from '../types'

export const counselingApi = {
  getCounselors: async (
    params?: QueryCounselingParams
  ): Promise<PaginationResult<Counselor>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<Counselor>>>(
      '/counseling/counselors',
      { params }
    )
    return res.data
  },

  getCounselorsForSelect: async (): Promise<Counselor[]> => {
    const res = await request.get<unknown, ApiResponse<Counselor[]>>(
      '/counseling/counselors/select'
    )
    return res.data
  },

  getCounselor: async (id: number): Promise<Counselor> => {
    const res = await request.get<unknown, ApiResponse<Counselor>>(
      `/counseling/counselors/${id}`
    )
    return res.data
  },

  createCounselor: async (params: CreateCounselorParams): Promise<Counselor> => {
    const res = await request.post<unknown, ApiResponse<Counselor>>(
      '/counseling/counselors',
      params
    )
    return res.data
  },

  updateCounselor: async (
    id: number,
    params: UpdateCounselorParams
  ): Promise<Counselor> => {
    const res = await request.put<unknown, ApiResponse<Counselor>>(
      `/counseling/counselors/${id}`,
      params
    )
    return res.data
  },

  deleteCounselor: async (id: number): Promise<void> => {
    await request.delete<unknown, ApiResponse>(`/counseling/counselors/${id}`)
  },

  getAvailableTimeSlots: async (
    counselorId: number,
    date: string
  ): Promise<AvailableTimeSlot[]> => {
    const res = await request.get<unknown, ApiResponse<AvailableTimeSlot[]>>(
      '/counseling/counselors/available-slots',
      { params: { counselorId, date } }
    )
    return res.data
  },

  createAppointment: async (params: CreateAppointmentParams): Promise<CounselingAppointment> => {
    const res = await request.post<unknown, ApiResponse<CounselingAppointment>>(
      '/counseling/appointments',
      params
    )
    return res.data
  },

  getAppointments: async (
    params?: QueryCounselingParams
  ): Promise<PaginationResult<CounselingAppointment>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<CounselingAppointment>>>(
      '/counseling/appointments',
      { params }
    )
    return res.data
  },

  getMyAppointments: async (): Promise<CounselingAppointment[]> => {
    const res = await request.get<unknown, ApiResponse<CounselingAppointment[]>>(
      '/counseling/appointments/my'
    )
    return res.data
  },

  getAppointment: async (id: number): Promise<CounselingAppointment> => {
    const res = await request.get<unknown, ApiResponse<CounselingAppointment>>(
      `/counseling/appointments/${id}`
    )
    return res.data
  },

  updateAppointment: async (
    id: number,
    params: UpdateAppointmentParams
  ): Promise<CounselingAppointment> => {
    const res = await request.put<unknown, ApiResponse<CounselingAppointment>>(
      `/counseling/appointments/${id}`,
      params
    )
    return res.data
  },

  createRecord: async (params: CreateCounselingRecordParams): Promise<CounselingRecord> => {
    const res = await request.post<unknown, ApiResponse<CounselingRecord>>(
      '/counseling/records',
      params
    )
    return res.data
  },

  getRecords: async (
    params?: QueryCounselingParams
  ): Promise<PaginationResult<CounselingRecord>> => {
    const res = await request.get<unknown, ApiResponse<PaginationResult<CounselingRecord>>>(
      '/counseling/records',
      { params }
    )
    return res.data
  },

  getMyRecords: async (): Promise<CounselingRecord[]> => {
    const res = await request.get<unknown, ApiResponse<CounselingRecord[]>>(
      '/counseling/records/my'
    )
    return res.data
  },

  getRecord: async (id: number): Promise<CounselingRecord> => {
    const res = await request.get<unknown, ApiResponse<CounselingRecord>>(
      `/counseling/records/${id}`
    )
    return res.data
  },

  updateRecord: async (
    id: number,
    params: UpdateCounselingRecordParams
  ): Promise<CounselingRecord> => {
    const res = await request.put<unknown, ApiResponse<CounselingRecord>>(
      `/counseling/records/${id}`,
      params
    )
    return res.data
  },
}
