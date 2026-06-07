import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsEnum, IsObject } from 'class-validator';
import { NotificationType } from '@/common/enums/status.enum';

export class CreateNotificationDto {
  @ApiProperty({ description: '接收人ID' })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({ description: '发送人ID' })
  @IsInt()
  @IsOptional()
  senderId?: number;

  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: '通知标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '通知内容' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: '关联的文档ID' })
  @IsInt()
  @IsOptional()
  documentId?: number;

  @ApiPropertyOptional({ description: '关联的评论ID' })
  @IsInt()
  @IsOptional()
  commentId?: number;

  @ApiPropertyOptional({ description: '额外数据' })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
