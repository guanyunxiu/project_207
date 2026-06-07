import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ScaleType } from '@/common/enums/status.enum';

export class QueryStatisticsDto {
  @ApiProperty({ description: '量表类型', enum: ScaleType, required: false })
  @IsOptional()
  @IsEnum(ScaleType)
  scaleType?: ScaleType;

  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: '部门', required: false })
  @IsOptional()
  @IsString()
  department?: string;
}

export class StressDistributionData {
  @ApiProperty({ description: '等级' })
  level: string;

  @ApiProperty({ description: '人数' })
  count: number;

  @ApiProperty({ description: '占比' })
  percentage: number;
}

export class EmotionTrendData {
  @ApiProperty({ description: '日期' })
  date: string;

  @ApiProperty({ description: '平均分' })
  avgScore: number;

  @ApiProperty({ description: '参与人数' })
  participantCount: number;
}

export class DepartmentComparisonData {
  @ApiProperty({ description: '部门' })
  department: string;

  @ApiProperty({ description: '平均分' })
  avgScore: number;

  @ApiProperty({ description: '参与人数' })
  participantCount: number;

  @ApiProperty({ description: '重度风险人数' })
  severeCount: number;

  @ApiProperty({ description: '中度风险人数' })
  moderateCount: number;
}

export class OverallStatisticsData {
  @ApiProperty({ description: '总测评次数' })
  totalAssessments: number;

  @ApiProperty({ description: '参与人数' })
  totalParticipants: number;

  @ApiProperty({ description: '正常人数' })
  normalCount: number;

  @ApiProperty({ description: '轻度人数' })
  mildCount: number;

  @ApiProperty({ description: '中度人数' })
  moderateCount: number;

  @ApiProperty({ description: '重度人数' })
  severeCount: number;

  @ApiProperty({ description: '平均分' })
  avgScore: number;

  @ApiProperty({ description: '压力分布' })
  stressDistribution: StressDistributionData[];

  @ApiProperty({ description: '情绪趋势' })
  emotionTrend: EmotionTrendData[];

  @ApiProperty({ description: '部门对比' })
  departmentComparison: DepartmentComparisonData[];
}
