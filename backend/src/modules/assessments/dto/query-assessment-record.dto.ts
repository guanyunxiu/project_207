import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Status } from '@/common/enums/status.enum';

export class QueryAssessmentRecordDto extends PaginationDto {
  @ApiPropertyOptional({ description: '任务ID' })
  @IsInt()
  @IsOptional()
  taskId?: number;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
