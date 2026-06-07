import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { Status, ScaleType } from '@/common/enums/status.enum';

export class CreateScaleDto {
  @ApiProperty({ description: '量表名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '量表类型', enum: ScaleType })
  @IsEnum(ScaleType)
  type: ScaleType;

  @ApiPropertyOptional({ description: '量表描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '总分说明' })
  @IsString()
  @IsOptional()
  scoreDescription?: string;

  @ApiProperty({ description: '题目ID列表（按顺序）' })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  questionIds: number[];

  @ApiPropertyOptional({ description: '状态', enum: Status, default: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
