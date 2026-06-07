import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, ArrayNotEmpty } from 'class-validator';
import { Status } from '@/common/enums/status.enum';

export class BatchManageDto {
  @ApiProperty({ description: '文档ID列表' })
  @IsArray()
  @ArrayNotEmpty()
  ids: number[];

  @ApiProperty({ description: '操作类型', enum: ['publish', 'reject', 'delete', 'restore'] })
  @IsEnum(['publish', 'reject', 'delete', 'restore'])
  @IsNotEmpty()
  action: 'publish' | 'reject' | 'delete' | 'restore';
}
