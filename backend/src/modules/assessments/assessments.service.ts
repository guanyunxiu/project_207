import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { Status, QuestionType, ScaleType } from '@/common/enums/status.enum';
import { Role } from '@/common/enums/role.enum';
import { PaginationResult } from '@/common/dto/response.dto';

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

    record.totalScore = totalScore;
    record.status = Status.COMPLETED;
    record.submittedAt = new Date();
    record.resultDescription = this.generateResultDescription(scale.type, totalScore, scale.scaleQuestions.length);

    return this.assessmentRecordRepository.save(record);
  }

  private generateResultDescription(scaleType: ScaleType, totalScore: number, questionCount: number): string {
    const maxScore = questionCount * 4;
    const percentage = (totalScore / maxScore) * 100;

    const descriptions: Record<ScaleType, (pct: number) => string> = {
      [ScaleType.ANXIETY]: (pct) => {
        if (pct < 30) return '焦虑水平较低，心态较为平和。';
        if (pct < 60) return '存在轻度焦虑，建议适当放松。';
        if (pct < 80) return '中度焦虑，建议寻求专业心理咨询。';
        return '重度焦虑，请尽快寻求专业帮助。';
      },
      [ScaleType.STRESS]: (pct) => {
        if (pct < 30) return '压力水平较低，状态良好。';
        if (pct < 60) return '存在轻度压力，注意劳逸结合。';
        if (pct < 80) return '中度压力，建议调整工作节奏。';
        return '高压状态，请及时减压并寻求支持。';
      },
      [ScaleType.SLEEP]: (pct) => {
        if (pct < 30) return '睡眠质量良好，作息规律。';
        if (pct < 60) return '存在轻度睡眠问题，建议调整作息。';
        if (pct < 80) return '中度睡眠问题，建议就医咨询。';
        return '严重睡眠问题，请尽快就医。';
      },
      [ScaleType.EMOTION]: (pct) => {
        if (pct < 30) return '情绪稳定，心理健康状态良好。';
        if (pct < 60) return '存在轻度情绪波动，建议自我调节。';
        if (pct < 80) return '中度情绪问题，建议寻求心理咨询。';
        return '情绪问题较严重，请尽快寻求专业帮助。';
      },
    };

    const descFn = descriptions[scaleType] || descriptions[ScaleType.ANXIETY];
    return `总得分：${totalScore} / ${maxScore}。${descFn(percentage)}`;
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
}
