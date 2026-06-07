import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationDto } from './dto';
import { NotificationType } from '@/common/enums/status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationsRepository.create(createNotificationDto);
    return await this.notificationsRepository.save(notification);
  }

  async findAll(query: QueryNotificationDto, userId: number) {
    const { page, pageSize, isRead, type } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (isRead !== undefined && isRead !== null) {
      where.isRead = Boolean(isRead);
    }
    if (type) {
      where.type = type;
    }

    const [items, total] = await this.notificationsRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['sender'],
      select: {
        sender: {
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

  async getUnreadCount(userId: number) {
    const count = await this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    await this.notificationsRepository.update(id, { isRead: true });
    return { message: '标记已读成功' };
  }

  async markAllAsRead(userId: number) {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { message: '全部标记已读成功' };
  }

  async sendNotification(
    userId: number,
    type: NotificationType,
    title: string,
    content?: string,
    options?: {
      senderId?: number;
      documentId?: number;
      commentId?: number;
      data?: Record<string, any>;
    },
  ) {
    return this.create({
      userId,
      type,
      title,
      content,
      senderId: options?.senderId,
      documentId: options?.documentId,
      commentId: options?.commentId,
      data: options?.data,
    });
  }

  async remove(id: number, userId: number) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    await this.notificationsRepository.delete(id);
    return { message: '删除成功' };
  }
}
