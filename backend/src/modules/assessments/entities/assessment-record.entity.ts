import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status, ResultLevel } from '@/common/enums/status.enum';
import { AssessmentTask } from './assessment-task.entity';
import { User } from '@/modules/users/entities/user.entity';
import { AssessmentAnswer } from './assessment-answer.entity';

@Entity('assessment_records')
export class AssessmentRecord {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '任务ID' })
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => AssessmentTask, task => task.records)
  @JoinColumn({ name: 'task_id' })
  task: AssessmentTask;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '总分' })
  @Column({ name: 'total_score', default: 0 })
  totalScore: number;

  @ApiProperty({ description: '结果说明' })
  @Column({ type: 'text', name: 'result_description', nullable: true })
  resultDescription?: string;

  @ApiProperty({ description: '结果等级', enum: ResultLevel })
  @Column({ type: 'enum', enum: ResultLevel, name: 'result_level', nullable: true })
  resultLevel?: ResultLevel;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.IN_PROGRESS })
  status: Status;

  @ApiProperty({ description: '开始时间' })
  @Column({ name: 'started_at', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: '提交时间' })
  @Column({ name: 'submitted_at', nullable: true })
  submittedAt?: Date;

  @OneToMany(() => AssessmentAnswer, answer => answer.record, { cascade: true })
  answers: AssessmentAnswer[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
