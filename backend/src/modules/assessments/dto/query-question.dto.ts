import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { QuestionType, Status } from '@/common/enums/status.enum';

export class QueryQuestionDto extends PaginationDto {
  @ApiPropertyOptional({ description: '题目类型', enum: QuestionType })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
