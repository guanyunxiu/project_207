import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ScaleType, Status } from '@/common/enums/status.enum';

export class QueryScaleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '量表类型', enum: ScaleType })
  @IsEnum(ScaleType)
  @IsOptional()
  type?: ScaleType;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
