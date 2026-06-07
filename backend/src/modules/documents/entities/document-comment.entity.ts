import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from './document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('document_comments')
export class DocumentComment {
  @ApiProperty({ description: '评论ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '文档ID' })
  @Column({ name: 'document_id' })
  documentId: number;

  @ManyToOne(() => Document, document => document.comments)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ApiProperty({ description: '评论人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '父评论ID' })
  @Column({ name: 'parent_id', nullable: true })
  parentId?: number;

  @ManyToOne(() => DocumentComment, comment => comment.replies)
  @JoinColumn({ name: 'parent_id' })
  parent?: DocumentComment;

  @OneToMany(() => DocumentComment, comment => comment.parent)
  replies: DocumentComment[];

  @ApiProperty({ description: '评论内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '提及的用户ID列表' })
  @Column({ type: 'json', name: 'mentioned_user_ids', nullable: true })
  mentionedUserIds?: number[];

  @ApiProperty({ description: '点赞数' })
  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
