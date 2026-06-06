import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '@/modules/categories/entities/category.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Status } from '@/common/enums/status.enum';

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
  @Column({ type: 'enum', enum: Status, default: Status.PUBLISHED })
  status: Status;

  @ApiProperty({ description: '浏览量' })
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @ApiProperty({ description: '附件列表' })
  @Column({ type: 'json', nullable: true })
  attachments?: Array<{ name: string; url: string; size: number }>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
