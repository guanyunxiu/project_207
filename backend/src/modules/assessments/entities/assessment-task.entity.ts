import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/common/enums/status.enum';
import { Scale } from './scale.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AssessmentRecord } from './assessment-record.entity';

@Entity('assessment_tasks')
export class AssessmentTask {
  @ApiProperty({ description: '任务ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '任务名称' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ description: '任务描述' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: '量表ID' })
  @Column({ name: 'scale_id' })
  scaleId: number;

  @ManyToOne(() => Scale, scale => scale.tasks)
  @JoinColumn({ name: 'scale_id' })
  scale: Scale;

  @ApiProperty({ description: '发放人ID' })
  @Column({ name: 'creator_id' })
  creatorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ApiProperty({ description: '目标用户IDs（JSON数组）' })
  @Column({ type: 'json', name: 'target_user_ids', nullable: true })
  targetUserIds?: number[];

  @ApiProperty({ description: '目标部门（JSON数组）' })
  @Column({ type: 'json', name: 'target_departments', nullable: true })
  targetDepartments?: string[];

  @ApiProperty({ description: '开始时间' })
  @Column({ name: 'start_time', nullable: true })
  startTime?: Date;

  @ApiProperty({ description: '截止时间' })
  @Column({ name: 'end_time', nullable: true })
  endTime?: Date;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.PUBLISHED })
  status: Status;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @OneToMany(() => AssessmentRecord, record => record.task)
  records: AssessmentRecord[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
