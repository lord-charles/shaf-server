import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsUrl,
  IsNotEmpty,
  IsDateString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ExpertiseArea,
  OrganizationType,
  PanelistRole,
  ParticipationMode,
} from './panelist.schema';

export class CreatePanelistDto {
  @ApiProperty({
    description: 'First name of the panelist',
    example: 'Dr. Amina',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Last name of the panelist',
    example: 'Hassan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Professional email address',
    example: 'amina.hassan@centralbank.go.ke',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contact phone number with country code',
    example: '+254712345678',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Year of the event',
    example: 2024,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  eventYear: number;

  @ApiProperty({
    description: 'Current job title/position',
    example: 'Director of Housing Finance',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  jobTitle: string;

  @ApiProperty({
    description: 'Name of the organization/company',
    example: 'Central Bank of Kenya',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  organization: string;

  @ApiProperty({
    description: 'Type of organization',
    enum: OrganizationType,
    example: OrganizationType.GOVERNMENT,
  })
  @IsEnum(OrganizationType)
  @IsNotEmpty()
  organizationType: OrganizationType;

  @ApiProperty({
    description: 'Country of residence/work',
    example: 'Kenya',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country: string;

  @ApiProperty({
    description: 'City of residence/work',
    example: 'Nairobi',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({
    description: 'Role at the AGM event',
    enum: PanelistRole,
    example: PanelistRole.KEYNOTE_SPEAKER,
  })
  @IsEnum(PanelistRole)
  @IsNotEmpty()
  role: PanelistRole;

  @ApiProperty({
    description: 'Areas of expertise (multiple selections allowed)',
    enum: ExpertiseArea,
    isArray: true,
    example: [ExpertiseArea.HOUSING_FINANCE, ExpertiseArea.POLICY_REGULATION],
  })
  @IsEnum(ExpertiseArea, { each: true })
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v: string) => v.trim())
      : value,
  )
  expertiseAreas: ExpertiseArea[];

  @ApiProperty({
    description: 'Professional biography (max 1000 characters)',
    example:
      'Dr. Amina Hassan is a seasoned financial expert with over 15 years of experience in housing finance and policy development across East Africa. She currently serves as the Director of Housing Finance at the Central Bank of Kenya, where she leads initiatives to improve access to affordable housing finance.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  biography: string;

  @ApiProperty({
    description: 'Mode of participation in the event',
    enum: ParticipationMode,
    example: ParticipationMode.IN_PERSON,
  })
  @IsEnum(ParticipationMode)
  @IsNotEmpty()
  participationMode: ParticipationMode;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/amina-hassan',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkedinProfile?: string;

  @ApiProperty({
    description: 'Company/organization website',
    example: 'https://www.centralbank.go.ke',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({
    description: 'Any special requirements or accommodations needed',
    example:
      'Requires wheelchair accessible venue and dietary restrictions (vegetarian)',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  specialRequirements?: string;

  @ApiProperty({
    description: 'URL to profile image',
    example: 'https://example.com/images/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Title of the session the panelist will lead/participate in',
    example:
      'Innovative Housing Finance Models for Affordable Housing in Africa',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  sessionTitle?: string;

  @ApiProperty({
    description: 'Description of the session',
    example:
      'This session will explore cutting-edge financing mechanisms that can unlock affordable housing development across African markets.',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  sessionDescription?: string;

  @ApiProperty({
    description: 'Date and time of the session (ISO 8601 format)',
    example: '2024-09-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  sessionDateTime?: string;
}

/**
 * DTO for updating an existing panelist
 */
export class UpdatePanelistDto {
  @ApiProperty({
    description: 'First name of the panelist',
    example: 'Dr. Amina',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the panelist',
    example: 'Hassan',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiProperty({
    description: 'Professional email address',
    example: 'amina.hassan@centralbank.go.ke',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'Contact phone number with country code',
    example: '+254712345678',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Current job title/position',
    example: 'Director of Housing Finance',
    required: false,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  jobTitle?: string;

  @ApiProperty({
    description: 'Name of the organization/company',
    example: 'Central Bank of Kenya',
    required: false,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  organization?: string;

  @ApiProperty({
    description: 'Type of organization',
    enum: OrganizationType,
    example: OrganizationType.GOVERNMENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  @ApiProperty({
    description: 'Country of residence/work',
    example: 'Kenya',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiProperty({
    description: 'City of residence/work',
    example: 'Nairobi',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiProperty({
    description: 'Role at the AGM event',
    enum: PanelistRole,
    example: PanelistRole.KEYNOTE_SPEAKER,
    required: false,
  })
  @IsOptional()
  @IsEnum(PanelistRole)
  role?: PanelistRole;

  @ApiProperty({
    description: 'Areas of expertise (multiple selections allowed)',
    enum: ExpertiseArea,
    isArray: true,
    example: [ExpertiseArea.HOUSING_FINANCE, ExpertiseArea.POLICY_REGULATION],
    required: false,
  })
  @IsOptional()
  @IsEnum(ExpertiseArea, { each: true })
  expertiseAreas?: ExpertiseArea[];

  @ApiProperty({
    description: 'Professional biography (max 1000 characters)',
    example:
      'Dr. Amina Hassan is a seasoned financial expert with over 15 years of experience in housing finance and policy development across East Africa.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  biography?: string;

  @ApiProperty({
    description: 'Mode of participation in the event',
    enum: ParticipationMode,
    example: ParticipationMode.IN_PERSON,
    required: false,
  })
  @IsOptional()
  @IsEnum(ParticipationMode)
  participationMode?: ParticipationMode;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/amina-hassan',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkedinProfile?: string;

  @ApiProperty({
    description: 'Company/organization website',
    example: 'https://www.centralbank.go.ke',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @ApiProperty({
    description: 'Any special requirements or accommodations needed',
    example:
      'Requires wheelchair accessible venue and dietary restrictions (vegetarian)',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  specialRequirements?: string;

  @ApiProperty({
    description: 'URL to profile image',
    example: 'https://example.com/images/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Title of the session the panelist will lead/participate in',
    example:
      'Innovative Housing Finance Models for Affordable Housing in Africa',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  sessionTitle?: string;

  @ApiProperty({
    description: 'Description of the session',
    example:
      'This session will explore cutting-edge financing mechanisms that can unlock affordable housing development across African markets.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  sessionDescription?: string;

  @ApiProperty({
    description: 'Date and time of the session (ISO 8601 format)',
    example: '2024-09-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  sessionDateTime?: string;
}

/**
 * DTO for panelist response
 */
export class PanelistResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the panelist',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'First name of the panelist',
    example: 'Dr. Amina',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the panelist',
    example: 'Hassan',
  })
  lastName: string;

  @ApiProperty({
    description: 'Full name (virtual field)',
    example: 'Dr. Amina Hassan',
  })
  fullName: string;

  @ApiProperty({
    description: 'Professional email address',
    example: 'amina.hassan@centralbank.go.ke',
  })
  email: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+254712345678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Current job title',
    example: 'Director of Housing Finance',
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Central Bank of Kenya',
  })
  organization: string;

  @ApiProperty({
    description: 'Type of organization',
    enum: OrganizationType,
    example: OrganizationType.GOVERNMENT,
  })
  organizationType: OrganizationType;

  @ApiProperty({
    description: 'Country',
    example: 'Kenya',
  })
  country: string;

  @ApiProperty({
    description: 'City',
    example: 'Nairobi',
  })
  city: string;

  @ApiProperty({
    description: 'Role at the AGM',
    enum: PanelistRole,
    example: PanelistRole.KEYNOTE_SPEAKER,
  })
  role: PanelistRole;

  @ApiProperty({
    description: 'Areas of expertise',
    enum: ExpertiseArea,
    isArray: true,
    example: [ExpertiseArea.HOUSING_FINANCE, ExpertiseArea.POLICY_REGULATION],
  })
  expertiseAreas: ExpertiseArea[];

  @ApiProperty({
    description: 'Professional biography',
    example: 'Dr. Amina Hassan is a seasoned financial expert...',
  })
  biography: string;

  @ApiProperty({
    description: 'Participation mode',
    enum: ParticipationMode,
    example: ParticipationMode.IN_PERSON,
  })
  participationMode: ParticipationMode;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/amina-hassan',
    required: false,
  })
  linkedinProfile?: string;

  @ApiProperty({
    description: 'Company website',
    example: 'https://www.centralbank.go.ke',
    required: false,
  })
  companyWebsite?: string;

  @ApiProperty({
    description: 'Special requirements',
    example: 'Requires wheelchair accessible venue',
    required: false,
  })
  specialRequirements?: string;

  @ApiProperty({
    description: 'Whether the panelist is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether participation is confirmed',
    example: true,
  })
  isConfirmed: boolean;

  @ApiProperty({
    description: 'Confirmation timestamp',
    example: '2024-08-15T10:30:00Z',
    required: false,
  })
  confirmedAt?: Date;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://example.com/images/profile.jpg',
    required: false,
  })
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Session title',
    example: 'Innovative Housing Finance Models',
    required: false,
  })
  sessionTitle?: string;

  @ApiProperty({
    description: 'Session description',
    example: 'This session will explore...',
    required: false,
  })
  sessionDescription?: string;

  @ApiProperty({
    description: 'Session date and time',
    example: '2024-09-15T10:30:00Z',
    required: false,
  })
  sessionDateTime?: Date;

  @ApiProperty({
    description: 'Registration timestamp',
    example: '2024-08-01T09:00:00Z',
  })
  registeredAt: Date;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2024-08-01T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2024-08-15T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO for confirming panelist participation
 */
export class ConfirmPanelistDto {
  @ApiProperty({
    description: 'Confirmation status',
    example: true,
  })
  @IsNotEmpty()
  isConfirmed: boolean;
}
