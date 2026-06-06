import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/common/enums/status.enum';

@Entity('categories')
export class Category {
  @ApiProperty({ description: '分类ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '分类名称' })
  @Column({ unique: true, length: 100 })
  name: string;

  @ApiProperty({ description: '分类编码' })
  @Column({ unique: true, length: 50 })
  code: string;

  @ApiProperty({ description: '分类描述' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: '排序' })
  @Column({ default: 0 })
  sort: number;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
