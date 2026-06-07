import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsArray } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '文档ID' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  documentId: number;

  @ApiPropertyOptional({ description: '父评论ID' })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '提及的用户ID列表' })
  @IsArray()
  @IsOptional()
  mentionedUserIds?: number[];
}
