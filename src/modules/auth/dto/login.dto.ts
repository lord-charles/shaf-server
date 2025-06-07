import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsMongoId,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'Employee email address',
    example: 'jane.wanjiku@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Employee password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
