import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentView } from './entities/document-view.entity';
import { DocumentFavorite } from './entities/document-favorite.entity';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto';
import { Status } from '@/common/enums/status.enum';
import { Role } from '@/common/enums/role.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(DocumentView)
    private documentViewsRepository: Repository<DocumentView>,
    @InjectRepository(DocumentFavorite)
    private documentFavoritesRepository: Repository<DocumentFavorite>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto, userId: number) {
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      authorId: userId,
      status: createDocumentDto.status || Status.PUBLISHED,
    });
    return await this.documentsRepository.save(document);
  }

  async findAll(query: QueryDocumentDto, userId?: number) {
    const { page, pageSize, keyword, categoryId, authorId, sortBy, sortOrder } = query;
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
        },
      },
    });

    let favoriteIds: number[] = [];
    if (userId) {
      favoriteIds = await this.getUserFavoriteDocumentIds(userId);
    }

    const itemsWithFavorite = items.map(item => ({
      ...item,
      isFavorite: favoriteIds.includes(item.id),
    }));

    return {
      list: itemsWithFavorite,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, userId?: number) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
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

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    await this.documentsRepository.increment({ id }, 'viewCount', 1);

    if (userId) {
      const viewRecord = this.documentViewsRepository.create({
        documentId: id,
        userId,
      });
      await this.documentViewsRepository.save(viewRecord);
    }

    return {
      ...document,
      viewCount: document.viewCount + 1,
    };
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto, userId: number, userRole: Role) {
    const document = await this.documentsRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    if (document.authorId !== userId && userRole !== Role.SUPER_ADMIN && userRole !== Role.HR_ADMIN) {
      throw new ForbiddenException('没有权限修改此文档');
    }

    await this.documentsRepository.update(id, updateDocumentDto);

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

  async search(keyword: string, options?: { categoryId?: number; page?: number; pageSize?: number }) {
    const { categoryId, page = 1, pageSize = 10 } = options || {};
    const skip = (page - 1) * pageSize;

    const where: any = { isDeleted: false };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [items, total] = await this.documentsRepository
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
        'document.createdAt',
        'category.id',
        'category.name',
        'author.id',
        'author.username',
        'author.nickname',
      ])
      .getManyAndCount();

    return {
      list: items,
      total,
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
