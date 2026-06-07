import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselingService } from './counseling.service';
import { CounselingController } from './counseling.controller';
import { Counselor } from './entities/counselor.entity';
import { CounselingAppointment } from './entities/counseling-appointment.entity';
import { CounselingRecord } from './entities/counseling-record.entity';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Counselor, CounselingAppointment, CounselingRecord, User]),
    NotificationsModule,
  ],
  controllers: [CounselingController],
  providers: [CounselingService],
  exports: [CounselingService],
})
export class CounselingModule {}
