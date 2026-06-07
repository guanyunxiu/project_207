import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { Scale } from './entities/scale.entity';
import { ScaleQuestion } from './entities/scale-question.entity';
import { AssessmentTask } from './entities/assessment-task.entity';
import { AssessmentRecord } from './entities/assessment-record.entity';
import { AssessmentAnswer } from './entities/assessment-answer.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionDto,
  CreateScaleDto,
  UpdateScaleDto,
  QueryScaleDto,
  CreateAssessmentTaskDto,
  UpdateAssessmentTaskDto,
  QueryAssessmentTaskDto,
  SubmitAssessmentDto,
  QueryAssessmentRecordDto,
} from './dto';
import { Status, QuestionType, ScaleType, ResultLevel, NotificationType } from '@/common/enums/status.enum';
import { Role } from '@/common/enums/role.enum';
import { PaginationResult } from '@/common/dto/response.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { anonymizeUser } from '@/common/utils/privacy.utils';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(Scale)
    private scaleRepository: Repository<Scale>,
    @InjectRepository(ScaleQuestion)
    private scaleQuestionRepository: Repository<ScaleQuestion>,
    @InjectRepository(AssessmentTask)
    private assessmentTaskRepository: Repository<AssessmentTask>,
    @InjectRepository(AssessmentRecord)
    private assessmentRecordRepository: Repository<AssessmentRecord>,
    @InjectRepository(AssessmentAnswer)
    private assessmentAnswerRepository: Repository<AssessmentAnswer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async createQuestion(createQuestionDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create({
      content: createQuestionDto.content,
      type: createQuestionDto.type,
      score: createQuestionDto.score || 0,
      status: createQuestionDto.status || Status.ACTIVE,
    });

    question.options = createQuestionDto.options.map((opt, index) =>
      this.questionOptionRepository.create({
        label: opt.label,
        content: opt.content,
        score: opt.score || 0,
        sortOrder: opt.sortOrder ?? index,
      }),
    );

    return this.questionRepository.save(question);
  }

  async findAllQuestions(query: QueryQuestionDto): Promise<PaginationResult<Question>> {
    const { page, pageSize, keyword, type, status } = query;
    const qb = this.questionRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'o')
      .where('q.isDeleted = :isDeleted', { isDeleted: false });

    if (keyword) {
      qb.andWhere('q.content LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (type) {
      qb.andWhere('q.type = :type', { type });
    }
    if (status) {
      qb.andWhere('q.status = :status', { status });
    }

    qb.orderBy('q.id', 'DESC').addOrderBy('o.sortOrder', 'ASC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findAllQuestionsForSelect(): Promise<Question[]> {
    return this.questionRepository.find({
      where: { isDeleted: false, status: Status.ACTIVE },
      relations: ['options'],
      order: { id: 'DESC', options: { sortOrder: 'ASC' } },
    });
  }

  async findOneQuestion(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['options'],
      order: { options: { sortOrder: 'ASC' } },
    });
    if (!question) {
      throw new NotFoundException('题目不存在');
    }
    return question;
  }

  async updateQuestion(id: number, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOneQuestion(id);

    if (updateQuestionDto.content !== undefined) question.content = updateQuestionDto.content;
    if (updateQuestionDto.type !== undefined) question.type = updateQuestionDto.type;
    if (updateQuestionDto.score !== undefined) question.score = updateQuestionDto.score;
    if (updateQuestionDto.status !== undefined) question.status = updateQuestionDto.status;

    if (updateQuestionDto.options) {
      await this.questionOptionRepository.delete({ questionId: id });
      question.options = updateQuestionDto.options.map((opt, index) =>
        this.questionOptionRepository.create({
          label: opt.label,
          content: opt.content,
          score: opt.score || 0,
          sortOrder: opt.sortOrder ?? index,
        }),
      );
    }

    return this.questionRepository.save(question);
  }

  async removeQuestion(id: number): Promise<void> {
    const question = await this.findOneQuestion(id);
    question.isDeleted = true;
    question.status = Status.DELETED;
    await this.questionRepository.save(question);
  }

  async createScale(createScaleDto: CreateScaleDto): Promise<Scale> {
    const scale = this.scaleRepository.create({
      name: createScaleDto.name,
      type: createScaleDto.type,
      description: createScaleDto.description,
      scoreDescription: createScaleDto.scoreDescription,
      status: createScaleDto.status || Status.ACTIVE,
    });

    const questions = await this.questionRepository.find({
      where: { id: In(createScaleDto.questionIds), isDeleted: false },
    });

    if (questions.length !== createScaleDto.questionIds.length) {
      throw new BadRequestException('部分题目不存在');
    }

    const idToIndex = new Map(createScaleDto.questionIds.map((id, idx) => [id, idx]));

    scale.scaleQuestions = questions.map((q) =>
      this.scaleQuestionRepository.create({
        questionId: q.id,
        sortOrder: idToIndex.get(q.id) || 0,
      }),
    );

    return this.scaleRepository.save(scale);
  }

  async findAllScales(query: QueryScaleDto): Promise<PaginationResult<Scale>> {
    const { page, pageSize, keyword, type, status } = query;
    const qb = this.scaleRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.scaleQuestions', 'sq')
      .leftJoinAndSelect('sq.question', 'q')
      .leftJoinAndSelect('q.options', 'o')
      .where('s.isDeleted = :isDeleted', { isDeleted: false });

    if (keyword) {
      qb.andWhere('s.name LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (type) {
      qb.andWhere('s.type = :type', { type });
    }
    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    qb.orderBy('s.id', 'DESC')
      .addOrderBy('sq.sortOrder', 'ASC')
      .addOrderBy('o.sortOrder', 'ASC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findAllScalesForSelect(): Promise<Scale[]> {
    return this.scaleRepository.find({
      where: { isDeleted: false, status: Status.ACTIVE },
      order: { id: 'DESC' },
    });
  }

  async findOneScale(id: number): Promise<Scale> {
    const scale = await this.scaleRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['scaleQuestions', 'scaleQuestions.question', 'scaleQuestions.question.options'],
      order: { scaleQuestions: { sortOrder: 'ASC', question: { options: { sortOrder: 'ASC' } } } },
    });
    if (!scale) {
      throw new NotFoundException('量表不存在');
    }
    return scale;
  }

  async updateScale(id: number, updateScaleDto: UpdateScaleDto): Promise<Scale> {
    const scale = await this.findOneScale(id);

    if (updateScaleDto.name !== undefined) scale.name = updateScaleDto.name;
    if (updateScaleDto.type !== undefined) scale.type = updateScaleDto.type;
    if (updateScaleDto.description !== undefined) scale.description = updateScaleDto.description;
    if (updateScaleDto.scoreDescription !== undefined) scale.scoreDescription = updateScaleDto.scoreDescription;
    if (updateScaleDto.status !== undefined) scale.status = updateScaleDto.status;

    if (updateScaleDto.questionIds) {
      const questions = await this.questionRepository.find({
        where: { id: In(updateScaleDto.questionIds), isDeleted: false },
      });

      if (questions.length !== updateScaleDto.questionIds.length) {
        throw new BadRequestException('部分题目不存在');
      }

      await this.scaleQuestionRepository.delete({ scaleId: id });
      const idToIndex = new Map(updateScaleDto.questionIds.map((qid, idx) => [qid, idx]));
      scale.scaleQuestions = questions.map((q) =>
        this.scaleQuestionRepository.create({
          questionId: q.id,
          sortOrder: idToIndex.get(q.id) || 0,
        }),
      );
    }

    return this.scaleRepository.save(scale);
  }

  async removeScale(id: number): Promise<void> {
    const scale = await this.findOneScale(id);
    scale.isDeleted = true;
    scale.status = Status.DELETED;
    await this.scaleRepository.save(scale);
  }

  async createTask(createAssessmentTaskDto: CreateAssessmentTaskDto, creatorId: number): Promise<AssessmentTask> {
    const scale = await this.findOneScale(createAssessmentTaskDto.scaleId);
    if (scale.status !== Status.ACTIVE) {
      throw new BadRequestException('量表未启用');
    }

    const task = this.assessmentTaskRepository.create({
      name: createAssessmentTaskDto.name,
      description: createAssessmentTaskDto.description,
      scaleId: createAssessmentTaskDto.scaleId,
      creatorId,
      targetUserIds: createAssessmentTaskDto.targetUserIds,
      targetDepartments: createAssessmentTaskDto.targetDepartments,
      startTime: createAssessmentTaskDto.startTime ? new Date(createAssessmentTaskDto.startTime) : undefined,
      endTime: createAssessmentTaskDto.endTime ? new Date(createAssessmentTaskDto.endTime) : undefined,
      status: Status.PUBLISHED,
    });

    const savedTask = await this.assessmentTaskRepository.save(task);

    const targetUsers = await this.getTargetUsers(createAssessmentTaskDto.targetUserIds, createAssessmentTaskDto.targetDepartments);
    for (const user of targetUsers) {
      const record = this.assessmentRecordRepository.create({
        taskId: savedTask.id,
        userId: user.id,
        status: Status.PENDING,
      });
      await this.assessmentRecordRepository.save(record);
    }

    return this.assessmentTaskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['scale', 'creator'],
    });
  }

  private async getTargetUsers(userIds?: number[], departments?: string[]): Promise<User[]> {
    const qb = this.userRepository.createQueryBuilder('u').where('u.status = :status', { status: Status.ACTIVE });

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (userIds && userIds.length > 0) {
      conditions.push('u.id IN (:...userIds)');
      params.userIds = userIds;
    }

    if (departments && departments.length > 0) {
      conditions.push('u.department IN (:...departments)');
      params.departments = departments;
    }

    if (conditions.length > 0) {
      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    return qb.getMany();
  }

  async findAllTasks(query: QueryAssessmentTaskDto, user: User): Promise<PaginationResult<AssessmentTask>> {
    const { page, pageSize, keyword, scaleId, status } = query;
    const qb = this.assessmentTaskRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.scale', 's')
      .leftJoinAndSelect('t.creator', 'c')
      .where('t.isDeleted = :isDeleted', { isDeleted: false });

    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.HR_ADMIN && user.role !== Role.ASSESSMENT_ADMIN) {
      const subQb = this.assessmentRecordRepository
        .createQueryBuilder('r')
        .select('r.taskId')
        .where('r.userId = :userId', { userId: user.id });
      qb.andWhere(`t.id IN (${subQb.getQuery()})`);
    }

    if (keyword) {
      qb.andWhere('t.name LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (scaleId) {
      qb.andWhere('t.scaleId = :scaleId', { scaleId });
    }
    if (status) {
      qb.andWhere('t.status = :status', { status });
    }

    qb.orderBy('t.id', 'DESC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOneTask(id: number, user: User): Promise<AssessmentTask> {
    const qb = this.assessmentTaskRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.scale', 's')
      .leftJoinAndSelect('s.scaleQuestions', 'sq')
      .leftJoinAndSelect('sq.question', 'q')
      .leftJoinAndSelect('q.options', 'o')
      .leftJoinAndSelect('t.creator', 'c')
      .where('t.id = :id AND t.isDeleted = :isDeleted', { id, isDeleted: false });

    const task = await qb.getOne();
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (user.role !== Role.SUPER_ADMIN && user.role !== Role.HR_ADMIN && user.role !== Role.ASSESSMENT_ADMIN) {
      const record = await this.assessmentRecordRepository.findOne({
        where: { taskId: id, userId: user.id },
      });
      if (!record) {
        throw new ForbiddenException('无权访问此任务');
      }
    }

    return task;
  }

  async updateTask(id: number, updateAssessmentTaskDto: UpdateAssessmentTaskDto, user: User): Promise<AssessmentTask> {
    const task = await this.findOneTask(id, user);

    if (updateAssessmentTaskDto.name !== undefined) task.name = updateAssessmentTaskDto.name;
    if (updateAssessmentTaskDto.description !== undefined) task.description = updateAssessmentTaskDto.description;
    if (updateAssessmentTaskDto.scaleId !== undefined) {
      const scale = await this.findOneScale(updateAssessmentTaskDto.scaleId);
      if (scale.status !== Status.ACTIVE) {
        throw new BadRequestException('量表未启用');
      }
      task.scaleId = updateAssessmentTaskDto.scaleId;
    }
    if (updateAssessmentTaskDto.startTime !== undefined) {
      task.startTime = updateAssessmentTaskDto.startTime ? new Date(updateAssessmentTaskDto.startTime) : undefined;
    }
    if (updateAssessmentTaskDto.endTime !== undefined) {
      task.endTime = updateAssessmentTaskDto.endTime ? new Date(updateAssessmentTaskDto.endTime) : undefined;
    }

    return this.assessmentTaskRepository.save(task);
  }

  async removeTask(id: number, user: User): Promise<void> {
    const task = await this.findOneTask(id, user);
    task.isDeleted = true;
    task.status = Status.DELETED;
    await this.assessmentTaskRepository.save(task);
  }

  async startAssessment(taskId: number, userId: number): Promise<AssessmentRecord> {
    const task = await this.assessmentTaskRepository.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    let record = await this.assessmentRecordRepository.findOne({
      where: { taskId, userId },
    });

    if (!record) {
      throw new BadRequestException('您没有被分配此测评任务');
    }

    if (record.status === Status.COMPLETED) {
      throw new BadRequestException('您已完成此测评');
    }

    if (task.endTime && new Date() > task.endTime) {
      record.status = Status.EXPIRED;
      await this.assessmentRecordRepository.save(record);
      throw new BadRequestException('测评已过期');
    }

    if (task.startTime && new Date() < task.startTime) {
      throw new BadRequestException('测评尚未开始');
    }

    record.status = Status.IN_PROGRESS;
    if (!record.startedAt) {
      record.startedAt = new Date();
    }

    return this.assessmentRecordRepository.save(record);
  }

  async submitAssessment(submitDto: SubmitAssessmentDto, userId: number): Promise<AssessmentRecord> {
    const record = await this.assessmentRecordRepository.findOne({
      where: { id: submitDto.recordId },
      relations: ['task'],
    });

    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('无权提交此测评');
    }

    if (record.status === Status.COMPLETED) {
      throw new BadRequestException('测评已提交');
    }

    const task = record.task;
    if (task.endTime && new Date() > task.endTime) {
      record.status = Status.EXPIRED;
      await this.assessmentRecordRepository.save(record);
      throw new BadRequestException('测评已过期');
    }

    const scale = await this.findOneScale(task.scaleId);
    const questionIds = scale.scaleQuestions.map((sq) => sq.questionId);

    const answeredQuestionIds = submitDto.answers.map((a) => a.questionId);
    const missingQuestions = questionIds.filter((qid) => !answeredQuestionIds.includes(qid));
    if (missingQuestions.length > 0) {
      throw new BadRequestException(`还有 ${missingQuestions.length} 道题未作答`);
    }

    const optionIdToScore = new Map<number, number>();
    for (const sq of scale.scaleQuestions) {
      for (const opt of sq.question.options) {
        optionIdToScore.set(opt.id, opt.score);
      }
    }

    await this.assessmentAnswerRepository.delete({ recordId: record.id });

    let totalScore = 0;
    const answers: AssessmentAnswer[] = [];

    for (const answerDto of submitDto.answers) {
      const score = answerDto.optionIds.reduce((sum, optId) => sum + (optionIdToScore.get(optId) || 0), 0);
      totalScore += score;

      answers.push(
        this.assessmentAnswerRepository.create({
          recordId: record.id,
          questionId: answerDto.questionId,
          optionIds: answerDto.optionIds,
          score,
        }),
      );
    }

    await this.assessmentAnswerRepository.save(answers);

    const resultLevel = this.determineResultLevel(totalScore, scale.scaleQuestions.length);

    record.totalScore = totalScore;
    record.status = Status.COMPLETED;
    record.submittedAt = new Date();
    record.resultLevel = resultLevel;
    record.resultDescription = this.generateResultDescription(scale.type, totalScore, scale.scaleQuestions.length, resultLevel);

    const savedRecord = await this.assessmentRecordRepository.save(record);

    if (resultLevel === ResultLevel.SEVERE || resultLevel === ResultLevel.MODERATE) {
      await this.sendHighRiskNotification(savedRecord, resultLevel);
    }

    return savedRecord;
  }

  determineResultLevel(totalScore: number, questionCount: number): ResultLevel {
    const maxScore = questionCount * 4;
    const percentage = (totalScore / maxScore) * 100;

    if (percentage < 30) return ResultLevel.NORMAL;
    if (percentage < 60) return ResultLevel.MILD;
    if (percentage < 80) return ResultLevel.MODERATE;
    return ResultLevel.SEVERE;
  }

  private generateResultDescription(
    scaleType: ScaleType,
    totalScore: number,
    questionCount: number,
    resultLevel: ResultLevel,
  ): string {
    const maxScore = questionCount * 4;
    const percentage = (totalScore / maxScore) * 100;
    const levelNames: Record<ResultLevel, string> = {
      [ResultLevel.NORMAL]: '正常',
      [ResultLevel.MILD]: '轻度',
      [ResultLevel.MODERATE]: '中度',
      [ResultLevel.SEVERE]: '重度',
    };

    const descriptions: Record<ScaleType, (level: ResultLevel) => string> = {
      [ScaleType.ANXIETY]: (level) => {
        if (level === ResultLevel.NORMAL) return '焦虑水平较低，心态较为平和。';
        if (level === ResultLevel.MILD) return '存在轻度焦虑，建议适当放松。';
        if (level === ResultLevel.MODERATE) return '中度焦虑，建议寻求专业心理咨询。';
        return '重度焦虑，请尽快寻求专业帮助。';
      },
      [ScaleType.STRESS]: (level) => {
        if (level === ResultLevel.NORMAL) return '压力水平较低，状态良好。';
        if (level === ResultLevel.MILD) return '存在轻度压力，注意劳逸结合。';
        if (level === ResultLevel.MODERATE) return '中度压力，建议调整工作节奏。';
        return '高压状态，请及时减压并寻求支持。';
      },
      [ScaleType.SLEEP]: (level) => {
        if (level === ResultLevel.NORMAL) return '睡眠质量良好，作息规律。';
        if (level === ResultLevel.MILD) return '存在轻度睡眠问题，建议调整作息。';
        if (level === ResultLevel.MODERATE) return '中度睡眠问题，建议就医咨询。';
        return '严重睡眠问题，请尽快就医。';
      },
      [ScaleType.EMOTION]: (level) => {
        if (level === ResultLevel.NORMAL) return '情绪稳定，心理健康状态良好。';
        if (level === ResultLevel.MILD) return '存在轻度情绪波动，建议自我调节。';
        if (level === ResultLevel.MODERATE) return '中度情绪问题，建议寻求心理咨询。';
        return '情绪问题较严重，请尽快寻求专业帮助。';
      },
    };

    const descFn = descriptions[scaleType] || descriptions[ScaleType.ANXIETY];
    return `总得分：${totalScore} / ${maxScore}。结果等级：${levelNames[resultLevel]}。${descFn(resultLevel)}`;
  }

  private async sendHighRiskNotification(record: AssessmentRecord, resultLevel: ResultLevel): Promise<void> {
    const hrAdmins = await this.userRepository.find({
      where: { role: In([Role.HR_ADMIN, Role.SUPER_ADMIN]), status: Status.ACTIVE },
    });

    const user = record.user || (await this.userRepository.findOne({ where: { id: record.userId } }));
    const levelNames: Record<ResultLevel, string> = {
      [ResultLevel.NORMAL]: '正常',
      [ResultLevel.MILD]: '轻度',
      [ResultLevel.MODERATE]: '中度',
      [ResultLevel.SEVERE]: '重度',
    };

    for (const admin of hrAdmins) {
      await this.notificationsService.sendNotification(
        admin.id,
        NotificationType.HIGH_RISK_WARNING,
        '高风险员工预警',
        `员工 ${user?.nickname || user?.username} (ID: ${record.userId}) 测评结果为${levelNames[resultLevel]}，需要关注。`,
        {
          data: {
            recordId: record.id,
            userId: record.userId,
            resultLevel,
            totalScore: record.totalScore,
            userName: user?.nickname || user?.username,
          },
        },
      );
    }
  }

  async findAllRecords(query: QueryAssessmentRecordDto, currentUser: User): Promise<PaginationResult<AssessmentRecord>> {
    const { page, pageSize, taskId, status } = query;
    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.task', 't')
      .leftJoinAndSelect('t.scale', 's')
      .leftJoinAndSelect('r.user', 'u');

    if (currentUser.role === Role.EMPLOYEE) {
      qb.where('r.userId = :userId', { userId: currentUser.id });
    } else if (query.userId) {
      qb.where('r.userId = :userId', { userId: query.userId });
    }

    if (taskId) {
      qb.andWhere('r.taskId = :taskId', { taskId });
    }
    if (status) {
      qb.andWhere('r.status = :status', { status });
    }

    qb.orderBy('r.id', 'DESC');

    const [list, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();

    return { list, total, page, pageSize };
  }

  async findOneRecord(id: number, currentUser: User): Promise<AssessmentRecord> {
    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.task', 't')
      .leftJoinAndSelect('t.scale', 's')
      .leftJoinAndSelect('s.scaleQuestions', 'sq')
      .leftJoinAndSelect('sq.question', 'q')
      .leftJoinAndSelect('q.options', 'o')
      .leftJoinAndSelect('r.answers', 'a')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.id = :id', { id });

    const record = await qb.getOne();
    if (!record) {
      throw new NotFoundException('记录不存在');
    }

    if (currentUser.role === Role.EMPLOYEE && record.userId !== currentUser.id) {
      throw new ForbiddenException('无权访问此记录');
    }

    return record;
  }

  async getMyPendingTasks(userId: number): Promise<AssessmentRecord[]> {
    const now = new Date();
    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.task', 't')
      .leftJoinAndSelect('t.scale', 's')
      .where('r.userId = :userId', { userId })
      .andWhere('r.status IN (:...statuses)', { statuses: [Status.PENDING, Status.IN_PROGRESS] })
      .andWhere('t.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(t.endTime IS NULL OR t.endTime > :now)', { now })
      .andWhere('(t.startTime IS NULL OR t.startTime <= :now)', { now })
      .orderBy('t.createdAt', 'DESC');

    return qb.getMany();
  }

  async generateReportPDF(recordId: number, currentUser: User): Promise<Buffer> {
    const record = await this.findOneRecord(recordId, currentUser);

    if (record.status !== Status.COMPLETED) {
      throw new BadRequestException('测评未完成，无法生成报告');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const levelColors: Record<ResultLevel, string> = {
        [ResultLevel.NORMAL]: '#52c41a',
        [ResultLevel.MILD]: '#faad14',
        [ResultLevel.MODERATE]: '#fa8c16',
        [ResultLevel.SEVERE]: '#f5222d',
      };

      const levelNames: Record<ResultLevel, string> = {
        [ResultLevel.NORMAL]: '正常',
        [ResultLevel.MILD]: '轻度',
        [ResultLevel.MODERATE]: '中度',
        [ResultLevel.SEVERE]: '重度',
      };

      const scaleTypeNames: Record<ScaleType, string> = {
        [ScaleType.ANXIETY]: '焦虑测评',
        [ScaleType.STRESS]: '压力测评',
        [ScaleType.SLEEP]: '睡眠测评',
        [ScaleType.EMOTION]: '情绪测评',
      };

      doc.fontSize(24).text('心理健康测评报告', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`报告编号: ${record.id}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(16).text('一、基本信息', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      const displayUser = currentUser.role === Role.EMPLOYEE ? record.user : anonymizeUser(record.user);
      doc.text(`测评类型: ${scaleTypeNames[record.task?.scale?.type || ScaleType.ANXIETY]}`);
      doc.text(`测评任务: ${record.task?.name || '-'}`);
      doc.text(`用户: ${displayUser?.nickname || displayUser?.username || '-'}`);
      doc.text(`部门: ${displayUser?.department || '-'}`);
      doc.text(`提交时间: ${record.submittedAt ? new Date(record.submittedAt).toLocaleString('zh-CN') : '-'}`);
      doc.moveDown(1);

      doc.fontSize(16).text('二、测评结果', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`总分: ${record.totalScore} 分`);
      doc.text(`结果等级: `);
      if (record.resultLevel) {
        doc.fillColor(levelColors[record.resultLevel]).text(levelNames[record.resultLevel], {
          continued: false,
        });
        doc.fillColor('black');
      }
      doc.moveDown(0.5);
      doc.text(`结果说明: ${record.resultDescription || '-'}`);
      doc.moveDown(1);

      if (record.resultLevel) {
        const maxScore = (record.task?.scale?.scaleQuestions?.length || 0) * 4;
        const percentage = maxScore > 0 ? Math.round((record.totalScore / maxScore) * 100) : 0;

        doc.fontSize(16).text('三、得分分布', { underline: true });
        doc.moveDown(0.5);

        const barWidth = 400;
        const barHeight = 30;
        const barX = 50;
        const barY = doc.y;

        doc.rect(barX, barY, barWidth, barHeight).stroke();
        doc.rect(barX, barY, (percentage / 100) * barWidth, barHeight)
          .fill(levelColors[record.resultLevel]);

        doc.fillColor('white').fontSize(12);
        doc.text(`${percentage}%`, barX + 10, barY + 8);
        doc.fillColor('black');

        doc.moveDown(2);
      }

      doc.fontSize(16).text('四、建议', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);

      if (record.resultLevel === ResultLevel.NORMAL) {
        doc.text('• 继续保持良好的心态和生活习惯');
        doc.text('• 定期进行自我觉察，关注情绪变化');
        doc.text('• 保持适度的运动和规律的作息');
      } else if (record.resultLevel === ResultLevel.MILD) {
        doc.text('• 建议适当放松，学习减压技巧');
        doc.text('• 保持规律作息，保证充足睡眠');
        doc.text('• 多与家人朋友交流，分享感受');
        doc.text('• 可考虑进行短期心理咨询');
      } else if (record.resultLevel === ResultLevel.MODERATE) {
        doc.text('• 建议寻求专业心理咨询师的帮助');
        doc.text('• 与信任的人倾诉，不要独自承受');
        doc.text('• 适当调整工作和生活节奏');
        doc.text('• 定期进行心理测评，跟踪变化');
      } else if (record.resultLevel === ResultLevel.SEVERE) {
        doc.text('• 强烈建议尽快寻求专业心理医生的帮助');
        doc.text('• 请告知家人或朋友，寻求支持');
        doc.text('• 避免独处，保持与外界的联系');
        doc.text('• 如有危机情况，请立即拨打心理援助热线');
      }
      doc.moveDown(1);

      doc.fontSize(16).text('五、免责声明', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text('本报告基于测评数据自动生成，仅供参考。如有需要，请咨询专业心理咨询师或医生。测评结果不构成任何医疗诊断或治疗建议。');
      doc.moveDown(2);

      doc.fontSize(10).text(`报告生成时间: ${new Date().toLocaleString('zh-CN')}`, { align: 'right' });
      doc.text(`系统生成，请勿篡改`, { align: 'right' });

      doc.end();
    });
  }
}
