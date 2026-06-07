import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Scale } from './entities/scale.entity';
import { ScaleQuestion } from './entities/scale-question.entity';
import { AssessmentTask } from './entities/assessment-task.entity';
import { AssessmentRecord } from './entities/assessment-record.entity';
import { AssessmentAnswer } from './entities/assessment-answer.entity';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionOption,
      Scale,
      ScaleQuestion,
      AssessmentTask,
      AssessmentRecord,
      AssessmentAnswer,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
