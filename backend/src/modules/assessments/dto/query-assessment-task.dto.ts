import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Status } from '@/common/enums/status.enum';

export class QueryAssessmentTaskDto extends PaginationDto {
  @ApiPropertyOptional({ description: '量表ID' })
  @IsInt()
  @IsOptional()
  scaleId?: number;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
