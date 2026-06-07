import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsArray, IsEnum, IsString as IsStr } from 'class-validator';
import { Status, DocumentPermission } from '@/common/enums/status.enum';

export class CreateDocumentDto {
  @ApiProperty({ description: '文档标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '文档内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '文档摘要' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ description: '分类ID' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @ApiPropertyOptional({ description: '文档权限', enum: DocumentPermission })
  @IsEnum(DocumentPermission)
  @IsOptional()
  permission?: DocumentPermission;

  @ApiPropertyOptional({ description: '变更描述' })
  @IsStr()
  @IsOptional()
  changeDescription?: string;

  @ApiPropertyOptional({ description: '附件列表', type: [Object] })
  @IsArray()
  @IsOptional()
  attachments?: Array<{ name: string; url: string; size: number }>;
}
