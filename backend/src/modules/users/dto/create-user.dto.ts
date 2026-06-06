import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@/common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: '部门' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: '职位' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: '角色', enum: Role, default: Role.EMPLOYEE })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
