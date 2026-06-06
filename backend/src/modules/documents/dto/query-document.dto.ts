import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export enum DocumentSortField {
  CREATED_AT = 'createdAt',
  VIEW_COUNT = 'viewCount',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryDocumentDto extends PaginationDto {
  @ApiPropertyOptional({ description: '分类ID' })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: '作者ID' })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  authorId?: number;

  @ApiPropertyOptional({ description: '排序字段', enum: DocumentSortField })
  @IsEnum(DocumentSortField)
  @IsOptional()
  sortBy?: DocumentSortField = DocumentSortField.CREATED_AT;

  @ApiPropertyOptional({ description: '排序方向', enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
