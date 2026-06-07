import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
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
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/common/enums/role.enum';
import { User } from '@/modules/users/entities/user.entity';

@ApiTags('心理测评')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('questions')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '创建题目（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return this.assessmentsService.createQuestion(createQuestionDto);
  }

  @Get('questions')
  @ApiOperation({ summary: '获取题目列表（所有登录用户）' })
  async findAllQuestions(@Query() query: QueryQuestionDto) {
    return this.assessmentsService.findAllQuestions(query);
  }

  @Get('questions/select')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取可选题目列表（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async findAllQuestionsForSelect() {
    return this.assessmentsService.findAllQuestionsForSelect();
  }

  @Get('questions/:id')
  @ApiOperation({ summary: '获取题目详情（所有登录用户）' })
  async findOneQuestion(@Param('id') id: string) {
    return this.assessmentsService.findOneQuestion(parseInt(id, 10));
  }

  @Put('questions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '更新题目（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async updateQuestion(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.assessmentsService.updateQuestion(parseInt(id, 10), updateQuestionDto);
  }

  @Delete('questions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '删除题目（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async removeQuestion(@Param('id') id: string) {
    await this.assessmentsService.removeQuestion(parseInt(id, 10));
    return { message: '删除成功' };
  }

  @Post('scales')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '创建量表（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async createScale(@Body() createScaleDto: CreateScaleDto) {
    return this.assessmentsService.createScale(createScaleDto);
  }

  @Get('scales')
  @ApiOperation({ summary: '获取量表列表（所有登录用户）' })
  async findAllScales(@Query() query: QueryScaleDto) {
    return this.assessmentsService.findAllScales(query);
  }

  @Get('scales/select')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '获取可选量表列表（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async findAllScalesForSelect() {
    return this.assessmentsService.findAllScalesForSelect();
  }

  @Get('scales/:id')
  @ApiOperation({ summary: '获取量表详情（所有登录用户）' })
  async findOneScale(@Param('id') id: string) {
    return this.assessmentsService.findOneScale(parseInt(id, 10));
  }

  @Put('scales/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '更新量表（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async updateScale(@Param('id') id: string, @Body() updateScaleDto: UpdateScaleDto) {
    return this.assessmentsService.updateScale(parseInt(id, 10), updateScaleDto);
  }

  @Delete('scales/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '删除量表（SUPER_ADMIN, ASSESSMENT_ADMIN）' })
  async removeScale(@Param('id') id: string) {
    await this.assessmentsService.removeScale(parseInt(id, 10));
    return { message: '删除成功' };
  }

  @Post('tasks')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: '创建测评任务（SUPER_ADMIN, ASSESSMENT_ADMIN, HR_ADMIN）' })
  async createTask(@Body() createAssessmentTaskDto: CreateAssessmentTaskDto, @CurrentUser() user: User) {
    return this.assessmentsService.createTask(createAssessmentTaskDto, user.id);
  }

  @Get('tasks')
  @ApiOperation({ summary: '获取测评任务列表（所有登录用户）' })
  async findAllTasks(@Query() query: QueryAssessmentTaskDto, @CurrentUser() user: User) {
    return this.assessmentsService.findAllTasks(query, user);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: '获取测评任务详情（所有登录用户）' })
  async findOneTask(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentsService.findOneTask(parseInt(id, 10), user);
  }

  @Put('tasks/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: '更新测评任务（SUPER_ADMIN, ASSESSMENT_ADMIN, HR_ADMIN）' })
  async updateTask(@Param('id') id: string, @Body() updateAssessmentTaskDto: UpdateAssessmentTaskDto, @CurrentUser() user: User) {
    return this.assessmentsService.updateTask(parseInt(id, 10), updateAssessmentTaskDto, user);
  }

  @Delete('tasks/:id')
  @Roles(Role.SUPER_ADMIN, Role.ASSESSMENT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: '删除测评任务（SUPER_ADMIN, ASSESSMENT_ADMIN, HR_ADMIN）' })
  async removeTask(@Param('id') id: string, @CurrentUser() user: User) {
    await this.assessmentsService.removeTask(parseInt(id, 10), user);
    return { message: '删除成功' };
  }

  @Post('tasks/:id/start')
  @ApiOperation({ summary: '开始答题（所有登录用户）' })
  async startAssessment(@Param('id') taskId: string, @CurrentUser() user: User) {
    return this.assessmentsService.startAssessment(parseInt(taskId, 10), user.id);
  }

  @Post('submit')
  @ApiOperation({ summary: '提交测评（所有登录用户）' })
  async submitAssessment(@Body() submitDto: SubmitAssessmentDto, @CurrentUser() user: User) {
    return this.assessmentsService.submitAssessment(submitDto, user.id);
  }

  @Get('records')
  @ApiOperation({ summary: '获取测评记录列表（所有登录用户）' })
  async findAllRecords(@Query() query: QueryAssessmentRecordDto, @CurrentUser() user: User) {
    return this.assessmentsService.findAllRecords(query, user);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取测评记录详情（所有登录用户）' })
  async findOneRecord(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentsService.findOneRecord(parseInt(id, 10), user);
  }

  @Get('my/pending')
  @ApiOperation({ summary: '获取我的待完成测评（所有登录用户）' })
  async getMyPendingTasks(@CurrentUser() user: User) {
    return this.assessmentsService.getMyPendingTasks(user.id);
  }
}
