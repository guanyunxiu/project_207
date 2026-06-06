import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Length(6, 50)
  newPassword: string;
}
