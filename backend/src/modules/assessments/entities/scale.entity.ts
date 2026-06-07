import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status, ScaleType } from '@/common/enums/status.enum';
import { ScaleQuestion } from './scale-question.entity';
import { AssessmentTask } from './assessment-task.entity';

@Entity('scales')
export class Scale {
  @ApiProperty({ description: '量表ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '量表名称' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ description: '量表类型', enum: ScaleType })
  @Column({ type: 'enum', enum: ScaleType })
  type: ScaleType;

  @ApiProperty({ description: '量表描述' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: '总分说明' })
  @Column({ type: 'text', name: 'score_description', nullable: true })
  scoreDescription?: string;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @OneToMany(() => ScaleQuestion, scaleQuestion => scaleQuestion.scale, { cascade: true })
  scaleQuestions: ScaleQuestion[];

  @OneToMany(() => AssessmentTask, task => task.scale)
  tasks: AssessmentTask[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
