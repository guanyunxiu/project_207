import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CounselingService } from './counseling.service';
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
} from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/common/enums/role.enum';
import { User } from '@/modules/users/entities/user.entity';

@ApiTags('心理咨询')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('counseling')
export class CounselingController {
  constructor(private readonly counselingService: CounselingService) {}

  @Post('counselors')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '创建咨询师（SUPER_ADMIN）' })
  async createCounselor(@Body() createCounselorDto: CreateCounselorDto) {
    return this.counselingService.createCounselor(createCounselorDto);
  }

  @Get('counselors')
  @ApiOperation({ summary: '获取咨询师列表（所有登录用户）' })
  async findAllCounselors(@Query() query: QueryCounselorDto) {
    return this.counselingService.findAllCounselors(query);
  }

  @Get('counselors/select')
  @ApiOperation({ summary: '获取可选咨询师列表（所有登录用户）' })
  async findAllCounselorsForSelect() {
    return this.counselingService.findAllCounselorsForSelect();
  }

  @Get('counselors/:id')
  @ApiOperation({ summary: '获取咨询师详情（所有登录用户）' })
  async findOneCounselor(@Param('id') id: string) {
    return this.counselingService.findOneCounselor(parseInt(id, 10));
  }

  @Put('counselors/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '更新咨询师（SUPER_ADMIN）' })
  async updateCounselor(@Param('id') id: string, @Body() updateCounselorDto: UpdateCounselorDto) {
    return this.counselingService.updateCounselor(parseInt(id, 10), updateCounselorDto);
  }

  @Delete('counselors/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: '删除咨询师（SUPER_ADMIN）' })
  async removeCounselor(@Param('id') id: string) {
    await this.counselingService.removeCounselor(parseInt(id, 10));
    return { message: '删除成功' };
  }

  @Get('counselors/available-slots')
  @ApiOperation({ summary: '获取咨询师可预约时段（所有登录用户）' })
  async getAvailableTimeSlots(@Query() dto: AvailableTimeSlotDto) {
    return this.counselingService.getAvailableTimeSlots(dto);
  }

  @Post('appointments')
  @ApiOperation({ summary: '创建咨询预约（所有登录用户）' })
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto, @CurrentUser() user: User) {
    return this.counselingService.createAppointment(createAppointmentDto, user.id);
  }

  @Get('appointments')
  @ApiOperation({ summary: '获取预约列表（所有登录用户）' })
  async findAllAppointments(@Query() query: QueryAppointmentDto, @CurrentUser() user: User) {
    return this.counselingService.findAllAppointments(query, user);
  }

  @Get('appointments/my')
  @ApiOperation({ summary: '获取我的预约（所有登录用户）' })
  async getMyAppointments(@CurrentUser() user: User) {
    return this.counselingService.getMyAppointments(user.id);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: '获取预约详情（所有登录用户）' })
  async findOneAppointment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.counselingService.findOneAppointment(parseInt(id, 10), user);
  }

  @Put('appointments/:id')
  @ApiOperation({ summary: '更新预约（所有登录用户）' })
  async updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: User,
  ) {
    return this.counselingService.updateAppointment(parseInt(id, 10), updateAppointmentDto, user);
  }

  @Post('records')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '创建咨询记录（管理员/咨询师）' })
  async createCounselingRecord(
    @Body() createCounselingRecordDto: CreateCounselingRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.counselingService.createCounselingRecord(createCounselingRecordDto, user);
  }

  @Get('records')
  @ApiOperation({ summary: '获取咨询记录列表（所有登录用户）' })
  async findAllRecords(@Query() query: QueryCounselingRecordDto, @CurrentUser() user: User) {
    return this.counselingService.findAllRecords(query, user);
  }

  @Get('records/my')
  @ApiOperation({ summary: '获取我的咨询记录（所有登录用户）' })
  async getMyRecords(@CurrentUser() user: User) {
    return this.counselingService.getMyRecords(user.id);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取咨询记录详情（所有登录用户）' })
  async findOneRecord(@Param('id') id: string, @CurrentUser() user: User) {
    return this.counselingService.findOneRecord(parseInt(id, 10), user);
  }

  @Put('records/:id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.ASSESSMENT_ADMIN)
  @ApiOperation({ summary: '更新咨询记录（管理员/咨询师）' })
  async updateRecord(
    @Param('id') id: string,
    @Body() updateCounselingRecordDto: UpdateCounselingRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.counselingService.updateRecord(parseInt(id, 10), updateCounselingRecordDto, user);
  }
}
