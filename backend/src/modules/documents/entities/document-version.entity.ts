import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from './document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @ApiProperty({ description: '版本ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '文档ID' })
  @Column({ name: 'document_id' })
  documentId: number;

  @ManyToOne(() => Document, document => document.versions)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ApiProperty({ description: '版本号' })
  @Column()
  version: number;

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

  @ApiProperty({ description: '修改人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '变更描述' })
  @Column({ type: 'text', name: 'change_description', nullable: true })
  changeDescription?: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
