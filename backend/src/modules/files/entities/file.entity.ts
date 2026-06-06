import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/entities/user.entity';

@Entity('files')
export class File {
  @ApiProperty({ description: '文件ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '原始文件名' })
  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @ApiProperty({ description: '存储文件名' })
  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @ApiProperty({ description: '文件路径' })
  @Column({ length: 500 })
  path: string;

  @ApiProperty({ description: '文件大小(字节)' })
  @Column({ type: 'bigint' })
  size: number;

  @ApiProperty({ description: 'MIME类型' })
  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @ApiProperty({ description: '存储位置' })
  @Column({ length: 50, default: 'local' })
  storage: string;

  @ApiProperty({ description: '上传者ID' })
  @Column({ name: 'uploader_id' })
  uploaderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
