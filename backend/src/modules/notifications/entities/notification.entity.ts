import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationType } from '@/common/enums/status.enum';

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: '通知ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '接收人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '发送人ID' })
  @Column({ name: 'sender_id', nullable: true })
  senderId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender?: User;

  @ApiProperty({ description: '通知类型', enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: '通知标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '通知内容' })
  @Column({ type: 'text', nullable: true })
  content?: string;

  @ApiProperty({ description: '关联的文档ID' })
  @Column({ name: 'document_id', nullable: true })
  documentId?: number;

  @ApiProperty({ description: '关联的评论ID' })
  @Column({ name: 'comment_id', nullable: true })
  commentId?: number;

  @ApiProperty({ description: '是否已读' })
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ApiProperty({ description: '额外数据（JSON格式）' })
  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
