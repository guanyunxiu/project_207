import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @ApiProperty({ description: '题目ID' })
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiProperty({ description: '选中的选项ID列表' })
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  optionIds: number[];
}

export class SubmitAssessmentDto {
  @ApiProperty({ description: '答题记录ID' })
  @IsInt()
  @Min(1)
  recordId: number;

  @ApiProperty({ description: '答案列表', type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
