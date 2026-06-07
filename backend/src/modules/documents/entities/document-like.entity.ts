import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from './document.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('document_likes')
export class DocumentLike {
  @ApiProperty({ description: '点赞ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '文档ID' })
  @Column({ name: 'document_id' })
  documentId: number;

  @ManyToOne(() => Document, document => document.likes)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ApiProperty({ description: '点赞人ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
