import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Question } from './question.entity';

@Entity('question_options')
export class QuestionOption {
  @ApiProperty({ description: '选项ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '题目ID' })
  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => Question, question => question.options)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ApiProperty({ description: '选项标签（A, B, C, D）' })
  @Column({ length: 10 })
  label: string;

  @ApiProperty({ description: '选项内容' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '选项分值' })
  @Column({ name: 'score', default: 0 })
  score: number;

  @ApiProperty({ description: '排序' })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
