import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Status } from '@/common/enums/status.enum';

export class ReviewDocumentDto {
  @ApiProperty({ description: '审核结果', enum: Status, enumName: 'Status' })
  @IsEnum([Status.PUBLISHED, Status.REJECTED])
  @IsNotEmpty()
  status: Status.PUBLISHED | Status.REJECTED;

  @ApiPropertyOptional({ description: '审核意见' })
  @IsString()
  @IsOptional()
  reviewComment?: string;
}
