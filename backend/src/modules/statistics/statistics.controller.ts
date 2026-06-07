import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { QueryStatisticsDto } from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/common/enums/role.enum';

@ApiTags('数据统计')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overall')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取综合统计数据（管理员）' })
  async getOverallStatistics(@Query() query: QueryStatisticsDto) {
    return this.statisticsService.getOverallStatistics(query);
  }

  @Get('stress-distribution')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取压力分布数据（管理员）' })
  async getStressDistribution(@Query() query: QueryStatisticsDto) {
    return this.statisticsService.getStressDistribution(query);
  }

  @Get('emotion-trend')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取情绪趋势数据（管理员）' })
  async getEmotionTrend(@Query() query: QueryStatisticsDto) {
    return this.statisticsService.getEmotionTrend(query);
  }

  @Get('department-comparison')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取部门对比数据（管理员）' })
  async getDepartmentComparison(@Query() query: QueryStatisticsDto) {
    return this.statisticsService.getDepartmentComparison(query);
  }

  @Get('high-risk-users')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取高风险用户列表（管理员，数据脱敏）' })
  async getHighRiskUsers(@Query() query: QueryStatisticsDto) {
    return this.statisticsService.getHighRiskUsers(query);
  }
}
