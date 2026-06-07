import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { AppointmentStatus, Status } from '@/common/enums/status.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class CreateCounselorDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({ description: '专业资质' })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional({ description: '擅长领域' })
  @IsString()
  @IsOptional()
  specialties?: string;

  @ApiPropertyOptional({ description: '从业年限' })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiPropertyOptional({ description: '简介' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class UpdateCounselorDto {
  @ApiPropertyOptional({ description: '专业资质' })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional({ description: '擅长领域' })
  @IsString()
  @IsOptional()
  specialties?: string;

  @ApiPropertyOptional({ description: '从业年限' })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiPropertyOptional({ description: '简介' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class CreateAppointmentDto {
  @ApiProperty({ description: '咨询师ID' })
  @IsNumber()
  @IsNotEmpty()
  counselorId: number;

  @ApiProperty({ description: '预约日期' })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({ description: '开始时间' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: '咨询类型' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '咨询方式' })
  @IsString()
  @IsOptional()
  consultationMethod?: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsString()
  @IsOptional()
  problemDescription?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: '预约日期' })
  @IsDateString()
  @IsOptional()
  appointmentDate?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: '状态', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: '取消原因' })
  @IsString()
  @IsOptional()
  cancelReason?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateCounselingRecordDto {
  @ApiProperty({ description: '预约ID' })
  @IsNumber()
  @IsNotEmpty()
  appointmentId: number;

  @ApiProperty({ description: '咨询日期' })
  @IsDateString()
  @IsNotEmpty()
  sessionDate: string;

  @ApiPropertyOptional({ description: '咨询时长（分钟）' })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: '主要问题' })
  @IsString()
  @IsOptional()
  mainConcerns?: string;

  @ApiPropertyOptional({ description: '咨询过程摘要' })
  @IsString()
  @IsOptional()
  sessionSummary?: string;

  @ApiPropertyOptional({ description: '评估结果' })
  @IsString()
  @IsOptional()
  assessment?: string;

  @ApiPropertyOptional({ description: '干预方案' })
  @IsString()
  @IsOptional()
  interventionPlan?: string;

  @ApiPropertyOptional({ description: '后续建议' })
  @IsString()
  @IsOptional()
  followUp?: string;

  @ApiPropertyOptional({ description: '风险评估' })
  @IsString()
  @IsOptional()
  riskAssessment?: string;

  @ApiPropertyOptional({ description: '是否需要转介' })
  @IsBoolean()
  @IsOptional()
  needsReferral?: boolean;

  @ApiPropertyOptional({ description: '转介信息' })
  @IsString()
  @IsOptional()
  referralInfo?: string;

  @ApiPropertyOptional({ description: '是否保密' })
  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;
}

export class UpdateCounselingRecordDto {
  @ApiPropertyOptional({ description: '咨询日期' })
  @IsDateString()
  @IsOptional()
  sessionDate?: string;

  @ApiPropertyOptional({ description: '咨询时长（分钟）' })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: '主要问题' })
  @IsString()
  @IsOptional()
  mainConcerns?: string;

  @ApiPropertyOptional({ description: '咨询过程摘要' })
  @IsString()
  @IsOptional()
  sessionSummary?: string;

  @ApiPropertyOptional({ description: '评估结果' })
  @IsString()
  @IsOptional()
  assessment?: string;

  @ApiPropertyOptional({ description: '干预方案' })
  @IsString()
  @IsOptional()
  interventionPlan?: string;

  @ApiPropertyOptional({ description: '后续建议' })
  @IsString()
  @IsOptional()
  followUp?: string;

  @ApiPropertyOptional({ description: '风险评估' })
  @IsString()
  @IsOptional()
  riskAssessment?: string;

  @ApiPropertyOptional({ description: '是否需要转介' })
  @IsBoolean()
  @IsOptional()
  needsReferral?: boolean;

  @ApiPropertyOptional({ description: '转介信息' })
  @IsString()
  @IsOptional()
  referralInfo?: string;

  @ApiPropertyOptional({ description: '是否保密' })
  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;
}

export class QueryCounselorDto extends PaginationDto {
  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiPropertyOptional({ description: '擅长领域' })
  @IsString()
  @IsOptional()
  specialty?: string;
}

export class QueryAppointmentDto extends PaginationDto {
  @ApiPropertyOptional({ description: '咨询师ID' })
  @IsNumber()
  @IsOptional()
  counselorId?: number;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ description: '状态', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class QueryCounselingRecordDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ description: '咨询师ID' })
  @IsNumber()
  @IsOptional()
  counselorId?: number;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AvailableTimeSlotDto {
  @ApiProperty({ description: '咨询师ID' })
  @IsNumber()
  @IsNotEmpty()
  counselorId: number;

  @ApiProperty({ description: '日期' })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class AvailableTimeSlot {
  @ApiProperty({ description: '开始时间' })
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  endTime: string;

  @ApiProperty({ description: '是否可用' })
  available: boolean;
}
