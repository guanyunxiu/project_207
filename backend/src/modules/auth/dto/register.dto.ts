import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, Length, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '用户名', minLength: 4, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(4, 50)
  username: string;

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '密码', minLength: 6, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  password: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsString()
  @IsOptional()
  nickname?: string;
}
