import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsMongoId } from 'class-validator';

// Approve Delegate DTO
export class ApproveDelegateDto {
  @ApiProperty({
    description: 'ID of the admin approving the delegate',
    example: '60d5ecb74f4d2c001f5e4b3b',
  })
  @IsMongoId()
  @IsNotEmpty()
  approvedBy: string;
}

// Reject Delegate DTO
export class RejectDelegateDto {
  @ApiProperty({
    description: 'Reason for rejecting the delegate registration',
    example: 'Incomplete documentation - passport copy not provided.',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

// Check-in Delegate DTO
export class CheckInDelegateDto {
  @ApiPropertyOptional({
    description: 'Location of check-in',
    example: 'Main Reception Desk A',
  })
  @IsOptional()
  @IsString()
  checkInLocation?: string;
}
