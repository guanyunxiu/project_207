import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@/common/enums/status.enum';
import { User } from '@/modules/users/entities/user.entity';
import { Counselor } from './counselor.entity';
import { CounselingRecord } from './counseling-record.entity';

@Entity('counseling_appointments')
export class CounselingAppointment {
  @ApiProperty({ description: '预约ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '咨询师ID' })
  @Column({ name: 'counselor_id' })
  counselorId: number;

  @ApiProperty({ description: '预约日期' })
  @Column({ name: 'appointment_date', type: 'date' })
  appointmentDate: Date;

  @ApiProperty({ description: '开始时间' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @ApiProperty({ description: '咨询类型' })
  @Column({ length: 100, nullable: true })
  type?: string;

  @ApiProperty({ description: '咨询方式' })
  @Column({ length: 50, name: 'consultation_method', nullable: true })
  consultationMethod?: string;

  @ApiProperty({ description: '问题描述' })
  @Column({ type: 'text', name: 'problem_description', nullable: true })
  problemDescription?: string;

  @ApiProperty({ description: '状态', enum: AppointmentStatus })
  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @ApiProperty({ description: '取消原因' })
  @Column({ type: 'text', name: 'cancel_reason', nullable: true })
  cancelReason?: string;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Counselor, (counselor) => counselor.appointments)
  @JoinColumn({ name: 'counselor_id' })
  counselor: Counselor;

  @OneToOne(() => CounselingRecord, (record) => record.appointment)
  record: CounselingRecord;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
