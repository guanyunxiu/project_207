import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Counselor } from './entities/counselor.entity';
import { CounselingAppointment } from './entities/counseling-appointment.entity';
import { CounselingRecord } from './entities/counseling-record.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  CreateCounselorDto,
  UpdateCounselorDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CreateCounselingRecordDto,
  UpdateCounselingRecordDto,
  QueryCounselorDto,
  QueryAppointmentDto,
  QueryCounselingRecordDto,
  AvailableTimeSlotDto,
  AvailableTimeSlot,
} from './dto';
import { Status, AppointmentStatus, NotificationType } from '@/common/enums/status.enum';
import { Role } from '@/common/enums/role.enum';
import { PaginationResult } from '@/common/dto/response.dto';
import { anonymizeUser } from '@/common/utils/privacy.utils';
import { NotificationsService } from '@/modules/notifications/notifications.service';

@Injectable()
export class CounselingService {
  constructor(
    @InjectRepository(Counselor)
    private counselorRepository: Repository<Counselor>,
    @InjectRepository(CounselingAppointment)
    private appointmentRepository: Repository<CounselingAppointment>,
    @InjectRepository(CounselingRecord)
    private recordRepository: Repository<CounselingRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async createCounselor(createCounselorDto: CreateCounselorDto): Promise<Counselor> {
    const user = await this.userRepository.findOne({
      where: { id: createCounselorDto.userId, status: Status.ACTIVE },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const existingCounselor = await this.counselorRepository.findOne({
      where: { userId: createCounselorDto.userId, isDeleted: false },
    });
    if (existingCounselor) {
      throw new BadRequestException('该用户已是咨询师');
    }

    const counselor = this.counselorRepository.create({
      ...createCounselorDto,
      status: createCounselorDto.status || Status.ACTIVE,
    });

    return this.counselorRepository.save(counselor);
  }

  async findAllCounselors(query: QueryCounselorDto): Promise<PaginationResult<Counselor>> {
    const { page, pageSize, status, specialty } = query;
    const qb = this.counselorRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .where('c.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      qb.andWhere('c.status = :status', { status });
    }
    if (specialty) {
      qb.andWhere('c.specialties LIKE :specialty', { specialty: `%${specialty}%` });
    }

    qb.orderBy('c.id', 'DESC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    const anonymizedList = list.map((counselor) => ({
      ...counselor,
      user: anonymizeUser(counselor.user),
    }));

    return { list: anonymizedList, total, page, pageSize };
  }

  async findAllCounselorsForSelect(): Promise<Counselor[]> {
    const counselors = await this.counselorRepository.find({
      where: { isDeleted: false, status: Status.ACTIVE },
      relations: ['user'],
      order: { id: 'DESC' },
    });

    return counselors.map((counselor) => ({
      ...counselor,
      user: anonymizeUser(counselor.user),
    }));
  }

  async findOneCounselor(id: number): Promise<Counselor> {
    const counselor = await this.counselorRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user'],
    });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在');
    }
    return {
      ...counselor,
      user: anonymizeUser(counselor.user),
    };
  }

  async updateCounselor(id: number, updateCounselorDto: UpdateCounselorDto): Promise<Counselor> {
    const counselor = await this.findOneCounselor(id);

    if (updateCounselorDto.qualification !== undefined) counselor.qualification = updateCounselorDto.qualification;
    if (updateCounselorDto.specialties !== undefined) counselor.specialties = updateCounselorDto.specialties;
    if (updateCounselorDto.experienceYears !== undefined) counselor.experienceYears = updateCounselorDto.experienceYears;
    if (updateCounselorDto.bio !== undefined) counselor.bio = updateCounselorDto.bio;
    if (updateCounselorDto.status !== undefined) counselor.status = updateCounselorDto.status;

    return this.counselorRepository.save(counselor);
  }

  async removeCounselor(id: number): Promise<void> {
    const counselor = await this.findOneCounselor(id);
    counselor.isDeleted = true;
    counselor.status = Status.DELETED;
    await this.counselorRepository.save(counselor);
  }

  async getAvailableTimeSlots(dto: AvailableTimeSlotDto): Promise<AvailableTimeSlot[]> {
    const { counselorId, date } = dto;

    const counselor = await this.counselorRepository.findOne({
      where: { id: counselorId, isDeleted: false, status: Status.ACTIVE },
    });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在或未启用');
    }

    const appointments = await this.appointmentRepository.find({
      where: {
        counselorId,
        appointmentDate: new Date(date),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    const defaultSlots: AvailableTimeSlot[] = [
      { startTime: '09:00', endTime: '10:00', available: true },
      { startTime: '10:00', endTime: '11:00', available: true },
      { startTime: '11:00', endTime: '12:00', available: true },
      { startTime: '14:00', endTime: '15:00', available: true },
      { startTime: '15:00', endTime: '16:00', available: true },
      { startTime: '16:00', endTime: '17:00', available: true },
    ];

    for (const slot of defaultSlots) {
      for (const appt of appointments) {
        if (appt.startTime < slot.endTime && appt.endTime > slot.startTime) {
          slot.available = false;
          break;
        }
      }
    }

    return defaultSlots;
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto, userId: number): Promise<CounselingAppointment> {
    const counselor = await this.counselorRepository.findOne({
      where: { id: createAppointmentDto.counselorId, isDeleted: false, status: Status.ACTIVE },
    });
    if (!counselor) {
      throw new NotFoundException('咨询师不存在或未启用');
    }

    const user = await this.userRepository.findOne({ where: { id: userId, status: Status.ACTIVE } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const existingAppointment = await this.appointmentRepository.findOne({
      where: {
        counselorId: createAppointmentDto.counselorId,
        appointmentDate: new Date(createAppointmentDto.appointmentDate),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });

    if (existingAppointment) {
      const slotOverlap =
        createAppointmentDto.startTime < existingAppointment.endTime &&
        createAppointmentDto.endTime > existingAppointment.startTime;
      if (slotOverlap) {
        throw new BadRequestException('该时段已被预约');
      }
    }

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      userId,
      appointmentDate: new Date(createAppointmentDto.appointmentDate),
      status: AppointmentStatus.PENDING,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.notificationsService.sendNotification(
      counselor.userId,
      NotificationType.COUNSELING_REMINDER,
      '新的咨询预约',
      `用户预约了您 ${createAppointmentDto.appointmentDate} ${createAppointmentDto.startTime}-${createAppointmentDto.endTime} 的咨询`,
      {
        data: {
          appointmentId: savedAppointment.id,
          userId,
        },
      },
    );

    return this.appointmentRepository.findOne({
      where: { id: savedAppointment.id },
      relations: ['counselor', 'user'],
    });
  }

  async findAllAppointments(
    query: QueryAppointmentDto,
    currentUser: User,
  ): Promise<PaginationResult<CounselingAppointment>> {
    const { page, pageSize, counselorId, userId, status, startDate, endDate } = query;
    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.counselor', 'c')
      .leftJoinAndSelect('a.user', 'u')
      .leftJoinAndSelect('c.user', 'cu');

    if (currentUser.role === Role.EMPLOYEE) {
      qb.where('a.userId = :userId', { userId: currentUser.id });
    } else if (currentUser.role === Role.HR_ADMIN || currentUser.role === Role.ASSESSMENT_ADMIN) {
      if (userId) {
        qb.where('a.userId = :userId', { userId });
      }
    } else if (userId) {
      qb.where('a.userId = :userId', { userId });
    }

    if (counselorId) {
      qb.andWhere('a.counselorId = :counselorId', { counselorId });
    }
    if (status) {
      qb.andWhere('a.status = :status', { status });
    }
    if (startDate) {
      qb.andWhere('a.appointmentDate >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('a.appointmentDate <= :endDate', { endDate: new Date(endDate) });
    }

    qb.orderBy('a.appointmentDate', 'DESC').addOrderBy('a.startTime', 'ASC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    const anonymizedList = list.map((appt) => ({
      ...appt,
      user: anonymizeUser(appt.user),
      counselor: {
        ...appt.counselor,
        user: anonymizeUser(appt.counselor?.user),
      },
    }));

    return { list: anonymizedList, total, page, pageSize };
  }

  async findOneAppointment(id: number, currentUser: User): Promise<CounselingAppointment> {
    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.counselor', 'c')
      .leftJoinAndSelect('a.user', 'u')
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('a.record', 'r')
      .where('a.id = :id', { id });

    const appointment = await qb.getOne();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (currentUser.role === Role.EMPLOYEE && appointment.userId !== currentUser.id) {
      throw new ForbiddenException('无权访问此预约');
    }

    return {
      ...appointment,
      user: anonymizeUser(appointment.user),
      counselor: {
        ...appointment.counselor,
        user: anonymizeUser(appointment.counselor?.user),
      },
    };
  }

  async updateAppointment(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    currentUser: User,
  ): Promise<CounselingAppointment> {
    const appointment = await this.findOneAppointment(id, currentUser);

    if (currentUser.role === Role.EMPLOYEE && appointment.userId !== currentUser.id) {
      throw new ForbiddenException('无权修改此预约');
    }

    if (updateAppointmentDto.appointmentDate !== undefined) {
      appointment.appointmentDate = new Date(updateAppointmentDto.appointmentDate);
    }
    if (updateAppointmentDto.startTime !== undefined) appointment.startTime = updateAppointmentDto.startTime;
    if (updateAppointmentDto.endTime !== undefined) appointment.endTime = updateAppointmentDto.endTime;
    if (updateAppointmentDto.status !== undefined) appointment.status = updateAppointmentDto.status;
    if (updateAppointmentDto.cancelReason !== undefined) appointment.cancelReason = updateAppointmentDto.cancelReason;
    if (updateAppointmentDto.remarks !== undefined) appointment.remarks = updateAppointmentDto.remarks;

    const updated = await this.appointmentRepository.save(appointment);

    if (updateAppointmentDto.status === AppointmentStatus.CONFIRMED) {
      await this.notificationsService.sendNotification(
        appointment.userId,
        NotificationType.COUNSELING_REMINDER,
        '咨询预约已确认',
        `您的咨询预约已确认，请按时参加。时间：${appointment.appointmentDate.toISOString().split('T')[0]} ${appointment.startTime}-${appointment.endTime}`,
        {
          data: {
            appointmentId: id,
          },
        },
      );
    } else if (updateAppointmentDto.status === AppointmentStatus.CANCELLED) {
      await this.notificationsService.sendNotification(
        appointment.counselor.userId,
        NotificationType.COUNSELING_REMINDER,
        '咨询预约已取消',
        `用户取消了预约。原因：${updateAppointmentDto.cancelReason || '未说明'}`,
        {
          data: {
            appointmentId: id,
          },
        },
      );
    }

    return updated;
  }

  async createCounselingRecord(
    createCounselingRecordDto: CreateCounselingRecordDto,
    currentUser: User,
  ): Promise<CounselingRecord> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: createCounselingRecordDto.appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    const counselor = await this.counselorRepository.findOne({
      where: { userId: currentUser.id, isDeleted: false },
    });

    if (counselor && appointment.counselorId !== counselor.id) {
      throw new ForbiddenException('无权为此预约创建记录');
    }

    const existingRecord = await this.recordRepository.findOne({
      where: { appointmentId: createCounselingRecordDto.appointmentId },
    });
    if (existingRecord) {
      throw new BadRequestException('该预约已存在咨询记录');
    }

    const record = this.recordRepository.create({
      ...createCounselingRecordDto,
      userId: appointment.userId,
      counselorId: appointment.counselorId,
      sessionDate: new Date(createCounselingRecordDto.sessionDate),
      isConfidential: createCounselingRecordDto.isConfidential ?? true,
    });

    return this.recordRepository.save(record);
  }

  async findAllRecords(
    query: QueryCounselingRecordDto,
    currentUser: User,
  ): Promise<PaginationResult<CounselingRecord>> {
    const { page, pageSize, userId, counselorId, startDate, endDate } = query;
    const qb = this.recordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.counselor', 'c')
      .leftJoinAndSelect('c.user', 'cu');

    if (currentUser.role === Role.EMPLOYEE) {
      qb.where('r.userId = :userId', { userId: currentUser.id });
    } else if (userId) {
      qb.where('r.userId = :userId', { userId });
    }

    if (counselorId) {
      qb.andWhere('r.counselorId = :counselorId', { counselorId });
    }
    if (startDate) {
      qb.andWhere('r.sessionDate >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.sessionDate <= :endDate', { endDate: new Date(endDate) });
    }

    qb.orderBy('r.sessionDate', 'DESC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    const anonymizedList = list.map((record) => ({
      ...record,
      user: anonymizeUser(record.user),
      counselor: {
        ...record.counselor,
        user: anonymizeUser(record.counselor?.user),
      },
    }));

    return { list: anonymizedList, total, page, pageSize };
  }

  async findOneRecord(id: number, currentUser: User): Promise<CounselingRecord> {
    const qb = this.recordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.counselor', 'c')
      .leftJoinAndSelect('c.user', 'cu')
      .leftJoinAndSelect('r.appointment', 'a')
      .where('r.id = :id', { id });

    const record = await qb.getOne();
    if (!record) {
      throw new NotFoundException('咨询记录不存在');
    }

    if (currentUser.role === Role.EMPLOYEE && record.userId !== currentUser.id) {
      throw new ForbiddenException('无权访问此记录');
    }

    return {
      ...record,
      user: anonymizeUser(record.user),
      counselor: {
        ...record.counselor,
        user: anonymizeUser(record.counselor?.user),
      },
    };
  }

  async updateRecord(
    id: number,
    updateCounselingRecordDto: UpdateCounselingRecordDto,
    currentUser: User,
  ): Promise<CounselingRecord> {
    const record = await this.findOneRecord(id, currentUser);

    const counselor = await this.counselorRepository.findOne({
      where: { userId: currentUser.id, isDeleted: false },
    });

    if (counselor && record.counselorId !== counselor.id) {
      throw new ForbiddenException('无权修改此记录');
    }

    if (updateCounselingRecordDto.sessionDate !== undefined) {
      record.sessionDate = new Date(updateCounselingRecordDto.sessionDate);
    }
    if (updateCounselingRecordDto.durationMinutes !== undefined) {
      record.durationMinutes = updateCounselingRecordDto.durationMinutes;
    }
    if (updateCounselingRecordDto.mainConcerns !== undefined) record.mainConcerns = updateCounselingRecordDto.mainConcerns;
    if (updateCounselingRecordDto.sessionSummary !== undefined) record.sessionSummary = updateCounselingRecordDto.sessionSummary;
    if (updateCounselingRecordDto.assessment !== undefined) record.assessment = updateCounselingRecordDto.assessment;
    if (updateCounselingRecordDto.interventionPlan !== undefined) record.interventionPlan = updateCounselingRecordDto.interventionPlan;
    if (updateCounselingRecordDto.followUp !== undefined) record.followUp = updateCounselingRecordDto.followUp;
    if (updateCounselingRecordDto.riskAssessment !== undefined) record.riskAssessment = updateCounselingRecordDto.riskAssessment;
    if (updateCounselingRecordDto.needsReferral !== undefined) record.needsReferral = updateCounselingRecordDto.needsReferral;
    if (updateCounselingRecordDto.referralInfo !== undefined) record.referralInfo = updateCounselingRecordDto.referralInfo;
    if (updateCounselingRecordDto.isConfidential !== undefined) record.isConfidential = updateCounselingRecordDto.isConfidential;

    return this.recordRepository.save(record);
  }

  async getMyAppointments(userId: number): Promise<CounselingAppointment[]> {
    const appointments = await this.appointmentRepository.find({
      where: { userId },
      relations: ['counselor', 'counselor.user'],
      order: { appointmentDate: 'DESC', startTime: 'ASC' },
    });

    return appointments.map((appt) => ({
      ...appt,
      counselor: {
        ...appt.counselor,
        user: anonymizeUser(appt.counselor?.user),
      },
    }));
  }

  async getMyRecords(userId: number): Promise<CounselingRecord[]> {
    const records = await this.recordRepository.find({
      where: { userId },
      relations: ['counselor', 'counselor.user'],
      order: { sessionDate: 'DESC' },
    });

    return records.map((record) => ({
      ...record,
      counselor: {
        ...record.counselor,
        user: anonymizeUser(record.counselor?.user),
      },
    }));
  }
}
