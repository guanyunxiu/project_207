import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from './document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('document_favorites')
@Unique('UQ_document_favorite', ['documentId', 'userId'])
export class DocumentFavorite {
  @ApiProperty({ description: '收藏记录ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '文档ID' })
  @Column({ name: 'document_id' })
  documentId: number;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
