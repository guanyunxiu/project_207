import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/entities/user.entity';
import { Counselor } from './counselor.entity';
import { CounselingAppointment } from './counseling-appointment.entity';

@Entity('counseling_records')
export class CounselingRecord {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '预约ID' })
  @Column({ name: 'appointment_id', unique: true })
  appointmentId: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '咨询师ID' })
  @Column({ name: 'counselor_id' })
  counselorId: number;

  @ApiProperty({ description: '咨询日期' })
  @Column({ name: 'session_date', type: 'date' })
  sessionDate: Date;

  @ApiProperty({ description: '咨询时长（分钟）' })
  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @ApiProperty({ description: '主要问题' })
  @Column({ type: 'text', name: 'main_concerns', nullable: true })
  mainConcerns?: string;

  @ApiProperty({ description: '咨询过程摘要' })
  @Column({ type: 'text', name: 'session_summary', nullable: true })
  sessionSummary?: string;

  @ApiProperty({ description: '评估结果' })
  @Column({ type: 'text', name: 'assessment', nullable: true })
  assessment?: string;

  @ApiProperty({ description: '干预方案' })
  @Column({ type: 'text', name: 'intervention_plan', nullable: true })
  interventionPlan?: string;

  @ApiProperty({ description: '后续建议' })
  @Column({ type: 'text', name: 'follow_up', nullable: true })
  followUp?: string;

  @ApiProperty({ description: '风险评估' })
  @Column({ type: 'text', name: 'risk_assessment', nullable: true })
  riskAssessment?: string;

  @ApiProperty({ description: '是否需要转介' })
  @Column({ name: 'needs_referral', default: false })
  needsReferral: boolean;

  @ApiProperty({ description: '转介信息' })
  @Column({ type: 'text', name: 'referral_info', nullable: true })
  referralInfo?: string;

  @ApiProperty({ description: '是否保密' })
  @Column({ name: 'is_confidential', default: true })
  isConfidential: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Counselor, (counselor) => counselor.records)
  @JoinColumn({ name: 'counselor_id' })
  counselor: Counselor;

  @OneToOne(() => CounselingAppointment, (appointment) => appointment.record)
  @JoinColumn({ name: 'appointment_id' })
  appointment: CounselingAppointment;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
