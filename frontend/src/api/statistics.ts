import request from './request'
import type {
  OverallStatisticsData,
  StressDistributionData,
  EmotionTrendData,
  DepartmentComparisonData,
  QueryStatisticsParams,
  ApiResponse,
  AssessmentRecord,
} from '../types'

export const statisticsApi = {
  getOverallStatistics: async (
    params?: QueryStatisticsParams
  ): Promise<OverallStatisticsData> => {
    const res = await request.get<unknown, ApiResponse<OverallStatisticsData>>(
      '/statistics/overall',
      { params }
    )
    return res.data
  },

  getStressDistribution: async (
    params?: QueryStatisticsParams
  ): Promise<StressDistributionData[]> => {
    const res = await request.get<unknown, ApiResponse<StressDistributionData[]>>(
      '/statistics/stress-distribution',
      { params }
    )
    return res.data
  },

  getEmotionTrend: async (
    params?: QueryStatisticsParams
  ): Promise<EmotionTrendData[]> => {
    const res = await request.get<unknown, ApiResponse<EmotionTrendData[]>>(
      '/statistics/emotion-trend',
      { params }
    )
    return res.data
  },

  getDepartmentComparison: async (
    params?: QueryStatisticsParams
  ): Promise<DepartmentComparisonData[]> => {
    const res = await request.get<unknown, ApiResponse<DepartmentComparisonData[]>>(
      '/statistics/department-comparison',
      { params }
    )
    return res.data
  },

  getHighRiskUsers: async (
    params?: QueryStatisticsParams
  ): Promise<AssessmentRecord[]> => {
    const res = await request.get<unknown, ApiResponse<AssessmentRecord[]>>(
      '/statistics/high-risk-users',
      { params }
    )
    return res.data
  },
}
