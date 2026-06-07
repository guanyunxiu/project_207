import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentRecord } from '@/modules/assessments/entities/assessment-record.entity';
import { User } from '@/modules/users/entities/user.entity';
import { QueryStatisticsDto, OverallStatisticsData, StressDistributionData, EmotionTrendData, DepartmentComparisonData } from './dto';
import { Status, ResultLevel, ScaleType } from '@/common/enums/status.enum';
import { anonymizeUser } from '@/common/utils/privacy.utils';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(AssessmentRecord)
    private assessmentRecordRepository: Repository<AssessmentRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOverallStatistics(query: QueryStatisticsDto): Promise<OverallStatisticsData> {
    const { scaleType, startDate, endDate, department } = query;

    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.task', 't')
      .leftJoinAndSelect('t.scale', 's')
      .leftJoin('r.user', 'u')
      .where('r.status = :status', { status: Status.COMPLETED });

    if (scaleType) {
      qb.andWhere('s.type = :scaleType', { scaleType });
    }
    if (startDate) {
      qb.andWhere('r.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }
    if (department) {
      qb.andWhere('u.department = :department', { department });
    }

    const records = await qb.getMany();

    const totalAssessments = records.length;
    const uniqueUserIds = new Set(records.map((r) => r.userId));
    const totalParticipants = uniqueUserIds.size;

    const levelCounts = {
      [ResultLevel.NORMAL]: 0,
      [ResultLevel.MILD]: 0,
      [ResultLevel.MODERATE]: 0,
      [ResultLevel.SEVERE]: 0,
    };

    let totalScore = 0;
    for (const record of records) {
      if (record.resultLevel) {
        levelCounts[record.resultLevel]++;
      }
      totalScore += record.totalScore;
    }

    const avgScore = totalAssessments > 0 ? Math.round((totalScore / totalAssessments) * 100) / 100 : 0;

    const stressDistribution = await this.getStressDistribution(query);
    const emotionTrend = await this.getEmotionTrend(query);
    const departmentComparison = await this.getDepartmentComparison(query);

    return {
      totalAssessments,
      totalParticipants,
      normalCount: levelCounts[ResultLevel.NORMAL],
      mildCount: levelCounts[ResultLevel.MILD],
      moderateCount: levelCounts[ResultLevel.MODERATE],
      severeCount: levelCounts[ResultLevel.SEVERE],
      avgScore,
      stressDistribution,
      emotionTrend,
      departmentComparison,
    };
  }

  async getStressDistribution(query: QueryStatisticsDto): Promise<StressDistributionData[]> {
    const { scaleType, startDate, endDate, department } = query;

    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .select('r.resultLevel', 'level')
      .addSelect('COUNT(DISTINCT r.userId)', 'count')
      .leftJoin('r.task', 't')
      .leftJoin('t.scale', 's')
      .leftJoin('r.user', 'u')
      .where('r.status = :status', { status: Status.COMPLETED })
      .andWhere('r.resultLevel IS NOT NULL');

    if (scaleType) {
      qb.andWhere('s.type = :scaleType', { scaleType });
    }
    if (startDate) {
      qb.andWhere('r.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }
    if (department) {
      qb.andWhere('u.department = :department', { department });
    }

    const result = await qb.groupBy('r.resultLevel').getRawMany();

    const levelNames: Record<ResultLevel, string> = {
      [ResultLevel.NORMAL]: '正常',
      [ResultLevel.MILD]: '轻度',
      [ResultLevel.MODERATE]: '中度',
      [ResultLevel.SEVERE]: '重度',
    };

    const totalCount = result.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    const distribution: StressDistributionData[] = Object.values(ResultLevel).map((level) => {
      const found = result.find((item) => item.level === level);
      const count = found ? parseInt(found.count, 10) : 0;
      return {
        level: levelNames[level],
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 10000) / 100 : 0,
      };
    });

    return distribution;
  }

  async getEmotionTrend(query: QueryStatisticsDto): Promise<EmotionTrendData[]> {
    const { scaleType, startDate, endDate, department } = query;

    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .select("DATE_TRUNC('day', r.submittedAt)", 'date')
      .addSelect('AVG(r.totalScore)', 'avgScore')
      .addSelect('COUNT(DISTINCT r.userId)', 'participantCount')
      .leftJoin('r.task', 't')
      .leftJoin('t.scale', 's')
      .leftJoin('r.user', 'u')
      .where('r.status = :status', { status: Status.COMPLETED });

    if (scaleType) {
      qb.andWhere('s.type = :scaleType', { scaleType });
    }
    if (startDate) {
      qb.andWhere('r.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }
    if (department) {
      qb.andWhere('u.department = :department', { department });
    }

    const result = await qb
      .groupBy("DATE_TRUNC('day', r.submittedAt)")
      .orderBy("DATE_TRUNC('day', r.submittedAt)", 'ASC')
      .limit(30)
      .getRawMany();

    return result.map((item) => ({
      date: new Date(item.date).toISOString().split('T')[0],
      avgScore: Math.round(parseFloat(item.avgScore) * 100) / 100,
      participantCount: parseInt(item.participantCount, 10),
    }));
  }

  async getDepartmentComparison(query: QueryStatisticsDto): Promise<DepartmentComparisonData[]> {
    const { scaleType, startDate, endDate } = query;

    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .select('u.department', 'department')
      .addSelect('AVG(r.totalScore)', 'avgScore')
      .addSelect('COUNT(DISTINCT r.userId)', 'participantCount')
      .addSelect(
        `(SELECT COUNT(DISTINCT r2.user_id) FROM assessment_records r2 LEFT JOIN users u2 ON r2.user_id = u2.id WHERE u2.department = u.department AND r2.result_level = 'severe' AND r2.status = 'completed')`,
        'severeCount',
      )
      .addSelect(
        `(SELECT COUNT(DISTINCT r3.user_id) FROM assessment_records r3 LEFT JOIN users u3 ON r3.user_id = u3.id WHERE u3.department = u.department AND r3.result_level = 'moderate' AND r3.status = 'completed')`,
        'moderateCount',
      )
      .leftJoin('r.task', 't')
      .leftJoin('t.scale', 's')
      .leftJoin('r.user', 'u')
      .where('r.status = :status', { status: Status.COMPLETED })
      .andWhere('u.department IS NOT NULL');

    if (scaleType) {
      qb.andWhere('s.type = :scaleType', { scaleType });
    }
    if (startDate) {
      qb.andWhere('r.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }

    const result = await qb
      .groupBy('u.department')
      .orderBy('"avgScore"', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      department: item.department,
      avgScore: Math.round(parseFloat(item.avgScore) * 100) / 100,
      participantCount: parseInt(item.participantCount, 10),
      severeCount: parseInt(item.severeCount, 10),
      moderateCount: parseInt(item.moderateCount, 10),
    }));
  }

  async getHighRiskUsers(query: QueryStatisticsDto): Promise<any[]> {
    const { scaleType, startDate, endDate, department } = query;

    const qb = this.assessmentRecordRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .leftJoinAndSelect('r.task', 't')
      .leftJoinAndSelect('t.scale', 's')
      .where('r.status = :status', { status: Status.COMPLETED })
      .andWhere('r.resultLevel IN (:...levels)', { levels: [ResultLevel.SEVERE, ResultLevel.MODERATE] });

    if (scaleType) {
      qb.andWhere('s.type = :scaleType', { scaleType });
    }
    if (startDate) {
      qb.andWhere('r.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }
    if (department) {
      qb.andWhere('u.department = :department', { department });
    }

    const records = await qb.orderBy('r.submittedAt', 'DESC').getMany();

    return records.map((record) => ({
      ...record,
      user: anonymizeUser(record.user),
    }));
  }
}
