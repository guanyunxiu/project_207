import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentView } from './entities/document-view.entity';
import { DocumentFavorite } from './entities/document-favorite.entity';
import { DocumentComment } from './entities/document-comment.entity';
import { DocumentLike } from './entities/document-like.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { User } from '../users/entities/user.entity';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto, CreateCommentDto, ReviewDocumentDto, BatchManageDto } from './dto';
import { Status, DocumentPermission, NotificationType } from '@/common/enums/status.enum';
import { Role } from '@/common/enums/role.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentView)
    private documentViewsRepository: Repository<DocumentView>,
    @InjectRepository(DocumentFavorite)
    private documentFavoritesRepository: Repository<DocumentFavorite>,
    @InjectRepository(DocumentComment)
    private documentCommentsRepository: Repository<DocumentComment>,
    @InjectRepository(DocumentLike)
    private documentLikesRepository: Repository<DocumentLike>,
    @InjectRepository(DocumentVersion)
    private documentVersionsRepository: Repository<DocumentVersion>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  private async checkDocumentPermission(document: Document, user?: User): Promise<boolean> {
    if (!user) {
      return document.permission === DocumentPermission.PUBLIC && document.status === Status.PUBLISHED;
    }

    if (user.role === Role.SUPER_ADMIN || user.role === Role.HR_ADMIN || user.role === Role.ASSESSMENT_ADMIN) {
      return true;
    }

    if (document.authorId === user.id) {
      return true;
    }

    if (document.permission === DocumentPermission.PUBLIC) {
      return document.status === Status.PUBLISHED;
    }

    if (document.permission === DocumentPermission.DEPARTMENT) {
      const author = await this.usersRepository.findOne({ where: { id: document.authorId } });
      return author?.department === user.department && document.status === Status.PUBLISHED;
    }

    return false;
  }

  private async saveVersion(document: Document, userId: number, changeDescription?: string) {
    const version = this.documentVersionsRepository.create({
      documentId: document.id,
      version: document.version,
      title: document.title,
      content: document.content,
      summary: document.summary,
      categoryId: document.categoryId,
      userId,
      changeDescription,
    });
    await this.documentVersionsRepository.save(version);
  }

  async create(createDocumentDto: CreateDocumentDto, userId: number) {
    const status = createDocumentDto.status || Status.DRAFT;
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      authorId: userId,
      status,
    });

    const saved = await this.documentsRepository.save(document);

    if (status === Status.PUBLISHED) {
      await this.saveVersion(saved, userId, createDocumentDto.changeDescription || '初始版本');
    }

    return saved;
  }

  async findAll(query: QueryDocumentDto, user?: User) {
    const { page, pageSize, keyword, categoryId, authorId, sortBy, sortOrder, status } = query as any;
    const skip = (page - 1) * pageSize;

    const where: any = { isDeleted: false };

    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (authorId) {
      where.authorId = authorId;
    }
    if (status) {
      where.status = status;
    }

    if (user && (user.role === Role.SUPER_ADMIN || user.role === Role.HR_ADMIN || user.role === Role.ASSESSMENT_ADMIN)) {
    } else if (user) {
      where.status = In([Status.PUBLISHED, Status.DRAFT]);
    } else {
      where.status = Status.PUBLISHED;
      where.permission = DocumentPermission.PUBLIC;
    }

    const [items, total] = await this.documentsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: {
        [sortBy]: sortOrder,
      },
      relations: ['category', 'author'],
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          department: true,
        },
      },
    });

    const filteredItems = [];
    for (const item of items) {
      if (await this.checkDocumentPermission(item, user)) {
        filteredItems.push(item);
      }
    }

    let favoriteIds: number[] = [];
    if (user) {
      favoriteIds = await this.getUserFavoriteDocumentIds(user.id);
    }

    let likedIds: number[] = [];
    if (user) {
      likedIds = await this.getUserLikedDocumentIds(user.id);
    }

    const itemsWithMeta = filteredItems.map(item => ({
      ...item,
      isFavorite: favoriteIds.includes(item.id),
      isLiked: likedIds.includes(item.id),
    }));

    return {
      list: itemsWithMeta,
      total: itemsWithMeta.length,
      page,
      pageSize,
    };
  }

  async findOne(id: number, user?: User) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['category', 'author', 'reviewer'],
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          department: true,
        },
        reviewer: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (!(await this.checkDocumentPermission(document, user))) {
      throw new ForbiddenException('没有权限查看此文档');
    }

    await this.documentsRepository.increment({ id }, 'viewCount', 1);

    if (user) {
      const viewRecord = this.documentViewsRepository.create({
        documentId: id,
        userId: user.id,
      });
      await this.documentViewsRepository.save(viewRecord);
    }

    let isFavorite = false;
    let isLiked = false;
    if (user) {
      const favorite = await this.documentFavoritesRepository.findOne({
        where: { documentId: id, userId: user.id },
      });
      isFavorite = !!favorite;

      const liked = await this.documentLikesRepository.findOne({
        where: { documentId: id, userId: user.id },
      });
      isLiked = !!liked;
    }

    return {
      ...document,
      viewCount: document.viewCount + 1,
      isFavorite,
      isLiked,
    };
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto, userId: number, userRole: Role, userDepartment?: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限修改此文档');
    }

    const newStatus = updateDocumentDto.status || document.status;

    if (updateDocumentDto.content || updateDocumentDto.title || updateDocumentDto.summary) {
      document.version += 1;
      await this.saveVersion(
        { ...document, ...updateDocumentDto, version: document.version } as Document,
        userId,
        updateDocumentDto.changeDescription || '更新文档',
      );
    }

    const updateData: any = {
      ...updateDocumentDto,
      version: document.version,
    };

    if (newStatus === Status.PENDING_REVIEW && document.status !== Status.PENDING_REVIEW) {
      updateData.reviewerId = null;
      updateData.reviewComment = null;
      updateData.reviewedAt = null;
    }

    await this.documentsRepository.update(id, updateData);

    if (newStatus === Status.PENDING_REVIEW) {
      const admins = await this.usersRepository.find({
        where: { role: In([Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN]) },
      });
      for (const admin of admins) {
        await this.notificationsService.sendNotification(
          admin.id,
          NotificationType.REVIEW,
          '新文档待审核',
          `文档《${document.title}》提交审核，请及时处理。`,
          { senderId: userId, documentId: id },
        );
      }
    }

    return await this.documentsRepository.findOne({
      where: { id },
      relations: ['category', 'author'],
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });
  }

  async remove(id: number, userId: number, userRole: Role) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限删除此文档');
    }

    await this.documentsRepository.update(id, { isDeleted: true });

    return { message: '删除成功' };
  }

  async submitForReview(id: number, userId: number) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId) {
      throw new ForbiddenException('只有作者可以提交审核');
    }

    if (document.status !== Status.DRAFT && document.status !== Status.REJECTED) {
      throw new BadRequestException('当前状态不允许提交审核');
    }

    await this.documentsRepository.update(id, {
      status: Status.PENDING_REVIEW,
      reviewerId: null,
      reviewComment: null,
      reviewedAt: null,
    });

    const admins = await this.usersRepository.find({
      where: { role: In([Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN]) },
    });
    for (const admin of admins) {
      await this.notificationsService.sendNotification(
        admin.id,
        NotificationType.REVIEW,
        '新文档待审核',
        `文档《${document.title}》提交审核，请及时处理。`,
        { senderId: userId, documentId: id },
      );
    }

    return { message: '提交审核成功' };
  }

  async review(id: number, reviewDto: ReviewDocumentDto, reviewerId: number, reviewerRole: Role) {
    if (reviewerRole !== Role.SUPER_ADMIN && reviewerRole !== Role.HR_ADMIN && reviewerRole !== Role.ASSESSMENT_ADMIN) {
      throw new ForbiddenException('没有审核权限');
    }

    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.status !== Status.PENDING_REVIEW) {
      throw new BadRequestException('当前文档不是待审核状态');
    }

    await this.documentsRepository.update(id, {
      status: reviewDto.status,
      reviewerId,
      reviewComment: reviewDto.reviewComment,
      reviewedAt: new Date(),
    });

    await this.notificationsService.sendNotification(
      document.authorId,
      NotificationType.REVIEW,
      reviewDto.status === Status.PUBLISHED ? '文档审核通过' : '文档审核未通过',
      reviewDto.reviewComment || (reviewDto.status === Status.PUBLISHED ? '您的文档已通过审核。' : '您的文档未通过审核，请修改后重新提交。'),
      { senderId: reviewerId, documentId: id },
    );

    if (reviewDto.status === Status.PUBLISHED) {
      await this.saveVersion(document, reviewerId, '审核通过发布');
    }

    return { message: reviewDto.status === Status.PUBLISHED ? '审核通过' : '审核拒绝' };
  }

  async getPendingReviews(query: PaginationDto, userRole: Role) {
    if (userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN && userRole !== Role.ASSESSMENT_ADMIN) {
      throw new ForbiddenException('没有权限查看待审核文档');
    }

    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.documentsRepository.findAndCount({
      where: { status: Status.PENDING_REVIEW, isDeleted: false },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['category', 'author'],
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          department: true,
        },
      },
    });

    return {
      list: items,
      total,
      page,
      pageSize,
    };
  }

  async createComment(createCommentDto: CreateCommentDto, userId: number) {
    const document = await this.documentsRepository.findOne({
      where: { id: createCommentDto.documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    const comment = this.documentCommentsRepository.create({
      ...createCommentDto,
      userId,
    });
    const saved = await this.documentCommentsRepository.save(comment);

    await this.documentsRepository.increment({ id: createCommentDto.documentId }, 'commentCount', 1);

    if (document.authorId !== userId) {
      await this.notificationsService.sendNotification(
        document.authorId,
        NotificationType.COMMENT,
        '文档收到新评论',
        `您的文档《${document.title}》收到了新评论。`,
        { senderId: userId, documentId: createCommentDto.documentId, commentId: saved.id },
      );
    }

    if (createCommentDto.mentionedUserIds && createCommentDto.mentionedUserIds.length > 0) {
      for (const mentionedUserId of createCommentDto.mentionedUserIds) {
        if (mentionedUserId !== userId && mentionedUserId !== document.authorId) {
          await this.notificationsService.sendNotification(
            mentionedUserId,
            NotificationType.MENTION,
            '有人在评论中@了你',
            `在文档《${document.title}》的评论中有人@了你。`,
            { senderId: userId, documentId: createCommentDto.documentId, commentId: saved.id },
          );
        }
      }
    }

    return this.documentCommentsRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });
  }

  async getComments(documentId: number, query: PaginationDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.documentCommentsRepository.findAndCount({
      where: { documentId, isDeleted: false, parentId: null },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['user', 'replies', 'replies.user'],
      select: {
        user: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
        replies: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return {
      list: items,
      total,
      page,
      pageSize,
    };
  }

  async deleteComment(commentId: number, userId: number, userRole: Role) {
    const comment = await this.documentCommentsRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.userId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限删除此评论');
    }

    await this.documentCommentsRepository.update(commentId, { isDeleted: true });
    await this.documentsRepository.decrement({ id: comment.documentId }, 'commentCount', 1);

    return { message: '删除成功' };
  }

  async toggleLike(documentId: number, userId: number) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    const existing = await this.documentLikesRepository.findOne({
      where: { documentId, userId },
    });

    if (existing) {
      await this.documentLikesRepository.delete(existing.id);
      await this.documentsRepository.decrement({ id: documentId }, 'likeCount', 1);
      return { isLiked: false, message: '已取消点赞' };
    } else {
      const like = this.documentLikesRepository.create({ documentId, userId });
      await this.documentLikesRepository.save(like);
      await this.documentsRepository.increment({ id: documentId }, 'likeCount', 1);

      if (document.authorId !== userId) {
        await this.notificationsService.sendNotification(
          document.authorId,
          NotificationType.LIKE,
          '文档收到新点赞',
          `您的文档《${document.title}》收到了新点赞。`,
          { senderId: userId, documentId },
        );
      }

      return { isLiked: true, message: '点赞成功' };
    }
  }

  async getUserLikedDocumentIds(userId: number): Promise<number[]> {
    const likes = await this.documentLikesRepository.find({
      where: { userId },
      select: ['documentId'],
    });
    return likes.map(l => l.documentId);
  }

  async getLikes(documentId: number, query: PaginationDto) {
    const { page, pageSize } = query;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.documentLikesRepository.findAndCount({
      where: { documentId },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    return {
      list: items,
      total,
      page,
      pageSize,
    };
  }

  async getVersions(documentId: number, userId: number, userRole: Role) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限查看版本历史');
    }

    const [items, total] = await this.documentVersionsRepository.findAndCount({
      where: { documentId },
      order: { version: 'DESC' },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    return {
      list: items,
      total,
    };
  }

  async getVersion(documentId: number, versionId: number, userId: number, userRole: Role) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限查看此版本');
    }

    const version = await this.documentVersionsRepository.findOne({
      where: { id: versionId, documentId },
      relations: ['user'],
      select: {
        user: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    return version;
  }

  async restoreVersion(documentId: number, versionId: number, userId: number, userRole: Role) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限恢复此版本');
    }

    const version = await this.documentVersionsRepository.findOne({
      where: { id: versionId, documentId },
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    const newVersion = document.version + 1;
    await this.saveVersion(document, userId, `恢复到版本 ${version.version}`);

    await this.documentsRepository.update(documentId, {
      title: version.title,
      content: version.content,
      summary: version.summary,
      categoryId: version.categoryId,
      version: newVersion,
      status: Status.DRAFT,
    });

    return { message: '恢复成功', version: newVersion };
  }

  async exportDocument(documentId: number, format: 'markdown' | 'html' | 'pdf', userId: number, userRole: Role, userDepartment?: string) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
      relations: ['author', 'category'],
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    const user = { id: userId, role: userRole, department: userDepartment } as User;
    if (!(await this.checkDocumentPermission(document, user))) {
      throw new ForbiddenException('没有权限导出此文档');
    }

    if (format === 'markdown') {
      const markdown = `# ${document.title}\n\n` +
        `> 作者: ${document.author?.nickname || document.author?.username}\n` +
        `> 分类: ${document.category?.name || '未分类'}\n` +
        `> 创建时间: ${document.createdAt}\n\n` +
        (document.summary ? `## 摘要\n\n${document.summary}\n\n` : '') +
        `## 正文\n\n${document.content.replace(/<[^>]*>/g, '')}`;

      return {
        format,
        content: markdown,
        filename: `${document.title}.md`,
      };
    } else if (format === 'html') {
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${document.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .content { color: #333; }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  <div class="meta">
    <p>作者: ${document.author?.nickname || document.author?.username}</p>
    <p>分类: ${document.category?.name || '未分类'}</p>
    <p>创建时间: ${document.createdAt}</p>
  </div>
  ${document.summary ? `<div class="summary"><strong>摘要：</strong>${document.summary}</div>` : ''}
  <div class="content">${document.content}</div>
</body>
</html>`;

      return {
        format,
        content: html,
        filename: `${document.title}.html`,
      };
    }

    throw new BadRequestException('不支持的导出格式');
  }

  async getStats(userId: number, userRole: Role) {
    const isAdmin = userRole === Role.SUPER_ADMIN || userRole === Role.HR_ADMIN;

    const totalDocuments = await this.documentsRepository.count({
      where: { isDeleted: false, ...(isAdmin ? {} : { authorId: userId }) },
    });

    const publishedDocuments = await this.documentsRepository.count({
      where: { isDeleted: false, status: Status.PUBLISHED, ...(isAdmin ? {} : { authorId: userId }) },
    });

    const pendingReviewDocuments = await this.documentsRepository.count({
      where: { isDeleted: false, status: Status.PENDING_REVIEW, ...(isAdmin ? {} : { authorId: userId }) },
    });

    const draftDocuments = await this.documentsRepository.count({
      where: { isDeleted: false, status: Status.DRAFT, ...(isAdmin ? {} : { authorId: userId }) },
    });

    const totalViews = await this.documentsRepository
      .createQueryBuilder('document')
      .select('SUM(document.view_count)', 'total')
      .where('document.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere(isAdmin ? '1=1' : 'document.author_id = :authorId', { authorId: userId })
      .getRawOne();

    const totalLikes = await this.documentsRepository
      .createQueryBuilder('document')
      .select('SUM(document.like_count)', 'total')
      .where('document.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere(isAdmin ? '1=1' : 'document.author_id = :authorId', { authorId: userId })
      .getRawOne();

    const totalComments = await this.documentsRepository
      .createQueryBuilder('document')
      .select('SUM(document.comment_count)', 'total')
      .where('document.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere(isAdmin ? '1=1' : 'document.author_id = :authorId', { authorId: userId })
      .getRawOne();

    const hotDocuments = await this.documentsRepository.find({
      where: { isDeleted: false, status: Status.PUBLISHED },
      order: { viewCount: 'DESC' },
      take: 10,
      relations: ['author', 'category'],
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        author: {
          id: true,
          nickname: true,
          username: true,
        },
        category: {
          id: true,
          name: true,
        },
      },
    });

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const publishTrend = await this.documentsRepository
      .createQueryBuilder('document')
      .select("DATE_TRUNC('day', document.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('document.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('document.status = :status', { status: Status.PUBLISHED })
      .andWhere(isAdmin ? '1=1' : 'document.author_id = :authorId', { authorId: userId })
      .andWhere('document.created_at >= :startDate', { startDate: thirtyDaysAgo })
      .groupBy("DATE_TRUNC('day', document.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      totalDocuments,
      publishedDocuments,
      pendingReviewDocuments,
      draftDocuments,
      totalViews: parseInt(totalViews?.total || '0'),
      totalLikes: parseInt(totalLikes?.total || '0'),
      totalComments: parseInt(totalComments?.total || '0'),
      hotDocuments,
      publishTrend: publishTrend.map(item => ({
        date: item.date,
        count: parseInt(item.count),
      })),
    };
  }

  async batchManage(batchDto: BatchManageDto, userRole: Role) {
    if (userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有批量管理权限');
    }

    const { ids, action } = batchDto;

    const documents = await this.documentsRepository.find({
      where: { id: In(ids), isDeleted: false },
    });

    if (documents.length === 0) {
      throw new NotFoundException('未找到有效的文档');
    }

    let updateData: any = {};

    switch (action) {
      case 'publish':
        updateData = { status: Status.PUBLISHED, reviewerId: null, reviewedAt: new Date() };
        break;
      case 'reject':
        updateData = { status: Status.REJECTED, reviewerId: null, reviewedAt: new Date() };
        break;
      case 'delete':
        updateData = { isDeleted: true };
        break;
      case 'restore':
        updateData = { isDeleted: false };
        break;
      default:
        throw new BadRequestException('不支持的操作类型');
    }

    await this.documentsRepository.update({ id: In(ids) }, updateData);

    return { message: `批量${action === 'publish' ? '发布' : action === 'reject' ? '拒绝' : action === 'delete' ? '删除' : '恢复'}成功`, count: documents.length };
  }

  async getViewHistory(userId: number, pagination: PaginationDto) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.documentViewsRepository.findAndCount({
      where: { userId },
      skip,
      take: pageSize,
      order: { viewedAt: 'DESC' },
      relations: ['document', 'document.category', 'document.author'],
      select: {
        document: {
          id: true,
          title: true,
          summary: true,
          viewCount: true,
          createdAt: true,
          author: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    return {
      list: items,
      total,
      page,
      pageSize,
    };
  }

  async toggleFavorite(documentId: number, userId: number) {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    const existing = await this.documentFavoritesRepository.findOne({
      where: { documentId, userId },
    });

    if (existing) {
      await this.documentFavoritesRepository.delete(existing.id);
      return { isFavorite: false, message: '已取消收藏' };
    } else {
      const favorite = this.documentFavoritesRepository.create({ documentId, userId });
      await this.documentFavoritesRepository.save(favorite);
      return { isFavorite: true, message: '收藏成功' };
    }
  }

  async getFavorites(userId: number, pagination: PaginationDto) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.documentFavoritesRepository.findAndCount({
      where: { userId },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['document', 'document.category', 'document.author'],
      select: {
        document: {
          id: true,
          title: true,
          summary: true,
          viewCount: true,
          createdAt: true,
          author: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    return {
      list: items,
      total,
      page,
      pageSize,
    };
  }

  async search(keyword: string, options?: { categoryId?: number; page?: number; pageSize?: number }, user?: User) {
    const { categoryId, page = 1, pageSize = 10 } = options || {};
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.author', 'author')
      .where('document.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere(
        '(document.title LIKE :keyword OR document.content LIKE :keyword OR document.summary LIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
      .andWhere(categoryId ? 'document.category_id = :categoryId' : '1=1', { categoryId })
      .orderBy('document.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .select([
        'document.id',
        'document.title',
        'document.summary',
        'document.content',
        'document.viewCount',
        'document.likeCount',
        'document.commentCount',
        'document.permission',
        'document.status',
        'document.createdAt',
        'category.id',
        'category.name',
        'author.id',
        'author.username',
        'author.nickname',
        'author.department',
      ]);

    if (user && (user.role === Role.SUPER_ADMIN || user.role === Role.HR_ADMIN || user.role === Role.ASSESSMENT_ADMIN)) {
    } else if (user) {
      queryBuilder.andWhere('document.status IN (:...statuses)', { statuses: [Status.PUBLISHED, Status.DRAFT] });
    } else {
      queryBuilder.andWhere('document.status = :status', { status: Status.PUBLISHED });
      queryBuilder.andWhere('document.permission = :permission', { permission: DocumentPermission.PUBLIC });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    const filteredItems = [];
    for (const item of items) {
      if (await this.checkDocumentPermission(item, user)) {
        filteredItems.push(item);
      }
    }

    return {
      list: filteredItems,
      total: filteredItems.length,
      page,
      pageSize,
    };
  }

  async getUserFavoriteDocumentIds(userId: number): Promise<number[]> {
    const favorites = await this.documentFavoritesRepository.find({
      where: { userId },
      select: ['documentId'],
    });
    return favorites.map(f => f.documentId);
  }
}
