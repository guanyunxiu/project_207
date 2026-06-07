import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AssessmentRecord } from './assessment-record.entity';
import { Question } from './question.entity';
import { QuestionOption } from './question-option.entity';

@Entity('assessment_answers')
export class AssessmentAnswer {
  @ApiProperty({ description: '答案ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '记录ID' })
  @Column({ name: 'record_id' })
  recordId: number;

  @ManyToOne(() => AssessmentRecord, record => record.answers)
  @JoinColumn({ name: 'record_id' })
  record: AssessmentRecord;

  @ApiProperty({ description: '题目ID' })
  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ApiProperty({ description: '选中的选项IDs（JSON数组，多选题）' })
  @Column({ type: 'json', name: 'option_ids', nullable: true })
  optionIds?: number[];

  @ApiProperty({ description: '得分' })
  @Column({ name: 'score', default: 0 })
  score: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
