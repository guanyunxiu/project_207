import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({ description: '状态码' })
  code: number;

  @ApiProperty({ description: '消息' })
  message: string;

  @ApiProperty({ description: '数据' })
  data: T;
}

export class PaginationResult<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;
}
