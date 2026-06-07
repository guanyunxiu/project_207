import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('文档')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '分页查询文档列表' })
  async findAll(
    @Query() query: QueryDocumentDto,
    @CurrentUser() user?: User,
  ) {
    return this.documentsService.findAll(query, user?.id);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: '搜索文档' })
  @ApiQuery({ name: 'keyword', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
  async search(
    @Query('keyword') keyword: string,
    @Query('categoryId') categoryId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.documentsService.search(keyword, {
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      page: pagination?.page,
      pageSize: pagination?.pageSize,
    });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取文档详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
  ) {
    return this.documentsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建文档' })
  async create(
    @CurrentUser() user: User,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return this.documentsService.create(createDocumentDto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新文档' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除文档' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.remove(id, user.id, user.role);
  }

  @Get('history/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取浏览历史' })
  async getViewHistory(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.documentsService.getViewHistory(user.id, pagination);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换收藏状态' })
  async toggleFavorite(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.toggleFavorite(id, user.id);
  }

  @Get('favorites/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取收藏列表' })
  async getFavorites(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.documentsService.getFavorites(user.id, pagination);
  }
}
