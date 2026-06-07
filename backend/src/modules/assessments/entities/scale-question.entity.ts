import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Scale } from './scale.entity';
import { Question } from './question.entity';

@Entity('scale_questions')
export class ScaleQuestion {
  @ApiProperty({ description: 'ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '量表ID' })
  @Column({ name: 'scale_id' })
  scaleId: number;

  @ManyToOne(() => Scale, scale => scale.scaleQuestions)
  @JoinColumn({ name: 'scale_id' })
  scale: Scale;

  @ApiProperty({ description: '题目ID' })
  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => Question, question => question.scaleQuestions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

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
