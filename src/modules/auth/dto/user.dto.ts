import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDate,
  MinLength,
  IsNotEmpty,
  IsDateString,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';




export class CreateUserDto {
  @ApiProperty({ description: 'Employee first name', example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Status of the employee account',
    example: 'active',
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended', 'terminated'])
  status?: string;

  @ApiProperty({ description: 'Employee last name', example: 'Wanjiku' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the employee',
    example: 'jane.wanjiku@company.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Phone number for Mpesa transactions',
    example: '254712345678',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'National ID of the employee',
    example: '23456789',
  })
  @IsNotEmpty()
  @IsString()
  nationalId: string;

  @ApiProperty({ description: 'User password', example: 'P@sswOrd123', minLength: 8 })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Roles assigned in the app',
    example: ['employee'],
    enum: ['employee', 'admin', 'hr', 'finance'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['employee', 'admin', 'hr', 'finance'], { each: true })
  roles?: string[];

  @ApiProperty({
    description: 'Employee ID or staff number',
    example: 'EMP2024001',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'Date of birth of the employee',
    example: '2001-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Job title or position',
    example: 'Senior Software Engineer',
  })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({
    description: 'Employment end date (if applicable)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  employmentEndDate?: Date;

  @ApiProperty({
    description: 'Type of employment',
    example: 'full-time',
    enum: ['full-time', 'part-time', 'contract', 'intern'],
  })
  @IsNotEmpty()
  @IsEnum(['full-time', 'part-time', 'contract', 'intern'])
  employmentType: string;



}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'CurrentP@sswOrd',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password for the user account',
    example: 'NewP@sswOrd123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'ID of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsString()
  @IsMongoId()
  userId: string;
}
