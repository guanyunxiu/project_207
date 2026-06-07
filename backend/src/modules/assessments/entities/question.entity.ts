import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Status, QuestionType } from '@/common/enums/status.enum';
import { QuestionOption } from './question-option.entity';
import { ScaleQuestion } from './scale-question.entity';

@Entity('questions')
export class Question {
  @ApiProperty({ description: '题目ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '题目内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '题目类型', enum: QuestionType })
  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.SINGLE })
  type: QuestionType;

  @ApiProperty({ description: '分值' })
  @Column({ name: 'score', default: 0 })
  score: number;

  @ApiProperty({ description: '状态', enum: Status })
  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @ApiProperty({ description: '软删除标记' })
  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @OneToMany(() => QuestionOption, option => option.question, { cascade: true })
  options: QuestionOption[];

  @OneToMany(() => ScaleQuestion, scaleQuestion => scaleQuestion.question)
  scaleQuestions: ScaleQuestion[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
