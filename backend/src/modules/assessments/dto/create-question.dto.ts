import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Status, QuestionType } from '@/common/enums/status.enum';

class QuestionOptionDto {
  @ApiProperty({ description: '选项标签' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: '选项内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '选项分值', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CreateQuestionDto {
  @ApiProperty({ description: '题目内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '题目类型', enum: QuestionType, default: QuestionType.SINGLE })
  @IsEnum(QuestionType)
  type: QuestionType = QuestionType.SINGLE;

  @ApiPropertyOptional({ description: '题目分值', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  score?: number;

  @ApiProperty({ description: '选项列表', type: [QuestionOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @ApiPropertyOptional({ description: '状态', enum: Status, default: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
