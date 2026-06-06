import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/common/enums/role.enum';
import { Status } from '@/common/enums/status.enum';

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ unique: true, length: 50 })
  username: string;

  @ApiProperty({ description: '邮箱' })
  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: '昵称' })
  @Column({ length: 50, nullable: true })
  nickname?: string;

  @ApiProperty({ description: '头像' })
  @Column({ length: 255, nullable: true })
  avatar?: string;

  @ApiProperty({ description: '手机号' })
  @Column({ length: 20, nullable: true })
  phone?: string;

  @ApiProperty({ description: '部门' })
  @Column({ length: 100, nullable: true })
  department?: string;

  @ApiProperty({ description: '职位' })
  @Column({ length: 100, nullable: true })
  position?: string;

  @ApiProperty({ description: '角色', enum: Role })
  @Column({ type: 'enum', enum: Role, default: Role.EMPLOYEE })
  role: Role;

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
