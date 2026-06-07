import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '@/modules/categories/entities/category.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Status, DocumentPermission } from '@/common/enums/status.enum';
import { DocumentComment } from './document-comment.entity';
import { DocumentLike } from './document-like.entity';
import { DocumentVersion } from './document-version.entity';

@Entity('documents')
export class Document {
  @ApiProperty({ description: '文档ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '文档标题' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ description: '文档内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '文档摘要' })
  @Column({ type: 'text', nullable: true })
  summary?: string;

  @ApiProperty({ description: '分类ID' })
  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ApiProperty({ description: '作者ID' })
  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.DRAFT })
  status: Status;

  @ApiProperty({ description: '文档权限', enum: DocumentPermission })
  @Column({ type: 'enum', enum: DocumentPermission, default: DocumentPermission.PUBLIC, name: 'permission' })
  permission: DocumentPermission;

  @ApiProperty({ description: '浏览量' })
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @ApiProperty({ description: '点赞数' })
  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @ApiProperty({ description: '评论数' })
  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @ApiProperty({ description: '当前版本号' })
  @Column({ name: 'version', default: 1 })
  version: number;

  @ApiProperty({ description: '审核人ID' })
  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer?: User;

  @ApiProperty({ description: '审核意见' })
  @Column({ type: 'text', name: 'review_comment', nullable: true })
  reviewComment?: string;

  @ApiProperty({ description: '审核时间' })
  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @ApiProperty({ description: '附件列表' })
  @Column({ type: 'json', nullable: true })
  attachments?: Array<{ name: string; url: string; size: number }>;

  @OneToMany(() => DocumentComment, comment => comment.document)
  comments: DocumentComment[];

  @OneToMany(() => DocumentLike, like => like.document)
  likes: DocumentLike[];

  @OneToMany(() => DocumentVersion, version => version.document)
  versions: DocumentVersion[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
