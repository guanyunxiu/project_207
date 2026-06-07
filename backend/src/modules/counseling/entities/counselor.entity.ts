import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/common/enums/status.enum';
import { User } from '@/modules/users/entities/user.entity';
import { CounselingAppointment } from './counseling-appointment.entity';
import { CounselingRecord } from './counseling-record.entity';

@Entity('counselors')
export class Counselor {
  @ApiProperty({ description: '咨询师ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id', unique: true })
  userId: number;

  @ApiProperty({ description: '关联用户' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '专业资质' })
  @Column({ type: 'text', name: 'qualification', nullable: true })
  qualification?: string;

  @ApiProperty({ description: '擅长领域' })
  @Column({ type: 'text', name: 'specialties', nullable: true })
  specialties?: string;

  @ApiProperty({ description: '从业年限' })
  @Column({ name: 'experience_years', default: 0 })
  experienceYears: number;

  @ApiProperty({ description: '简介' })
  @Column({ type: 'text', name: 'bio', nullable: true })
  bio?: string;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @ApiProperty({ description: '是否删除' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @OneToMany(() => CounselingAppointment, (appointment) => appointment.counselor)
  appointments: CounselingAppointment[];

  @OneToMany(() => CounselingRecord, (record) => record.counselor)
  records: CounselingRecord[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
