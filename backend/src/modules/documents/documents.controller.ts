import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto, CreateCommentDto, ReviewDocumentDto, BatchManageDto } from './dto';
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
    return this.documentsService.findAll(query, user);
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
    @CurrentUser() user?: User,
  ) {
    return this.documentsService.search(keyword, {
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      page: pagination?.page,
      pageSize: pagination?.pageSize,
    }, user);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取文档详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
  ) {
    return this.documentsService.findOne(id, user);
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
    return this.documentsService.update(id, updateDocumentDto, user.id, user.role, user.department);
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

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交审核' })
  async submitForReview(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.submitForReview(id, user.id);
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核文档' })
  async review(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewDocumentDto,
  ) {
    return this.documentsService.review(id, reviewDto, user.id, user.role);
  }

  @Get('reviews/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待审核文档列表' })
  async getPendingReviews(
    @CurrentUser() user: User,
    @Query() query: PaginationDto,
  ) {
    return this.documentsService.getPendingReviews(query, user.role);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建评论' })
  async createComment(
    @CurrentUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.documentsService.createComment(createCommentDto, user.id);
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '获取文档评论列表' })
  async getComments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.documentsService.getComments(id, query);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.deleteComment(id, user.id, user.role);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换点赞状态' })
  async toggleLike(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.toggleLike(id, user.id);
  }

  @Get(':id/likes')
  @Public()
  @ApiOperation({ summary: '获取文档点赞列表' })
  async getLikes(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationDto,
  ) {
    return this.documentsService.getLikes(id, query);
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文档版本历史' })
  async getVersions(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.documentsService.getVersions(id, user.id, user.role);
  }

  @Get(':id/versions/:versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取指定版本详情' })
  async getVersion(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.documentsService.getVersion(id, versionId, user.id, user.role);
  }

  @Post(':id/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '恢复到指定版本' })
  async restoreVersion(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.documentsService.restoreVersion(id, versionId, user.id, user.role);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '导出文档' })
  @ApiQuery({ name: 'format', required: true, enum: ['markdown', 'html'] })
  async exportDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: 'markdown' | 'html' | 'pdf',
    @Res() res: Response,
  ) {
    const result = await this.documentsService.exportDocument(id, format, user.id, user.role, user.department);
    
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`);
    res.setHeader('Content-Type', format === 'html' ? 'text/html; charset=utf-8' : 'text/markdown; charset=utf-8');
    res.send(result.content);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取文档统计数据' })
  async getStats(@CurrentUser() user: User) {
    return this.documentsService.getStats(user.id, user.role);
  }

  @Post('batch/manage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量管理文档' })
  async batchManage(
    @CurrentUser() user: User,
    @Body() batchDto: BatchManageDto,
  ) {
    return this.documentsService.batchManage(batchDto, user.role);
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
