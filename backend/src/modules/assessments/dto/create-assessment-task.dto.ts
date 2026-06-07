import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsArray, IsDateString } from 'class-validator';

export class CreateAssessmentTaskDto {
  @ApiProperty({ description: '任务名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '量表ID' })
  @IsInt()
  @Min(1)
  scaleId: number;

  @ApiPropertyOptional({ description: '目标用户IDs' })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  targetUserIds?: number[];

  @ApiPropertyOptional({ description: '目标部门' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetDepartments?: string[];

  @ApiPropertyOptional({ description: '开始时间' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: '截止时间' })
  @IsDateString()
  @IsOptional()
  endTime?: string;
}
