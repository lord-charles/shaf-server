import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUrl,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  DelegateType,
  AttendanceMode,
  IdentificationType,
  Title,
} from '../delegates.schema';

// Nested DTOs
export class IdentificationDto {
  @ApiProperty({
    enum: IdentificationType,
    description: 'Type of identification document',
    example: IdentificationType.PASSPORT,
  })
  @IsEnum(IdentificationType)
  @IsNotEmpty()
  type: IdentificationType;

  @ApiProperty({
    description: 'Identification document number',
    example: 'A1234567',
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({
    description: 'Document expiry date (ISO format)',
    example: '2030-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Is delegate an admin',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdmin: boolean;

  @ApiProperty({
    description: 'Country that issued the document',
    example: 'Kenya',
  })
  @IsString()
  @IsOptional()
  issuingCountry?: string;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Uhuru Highway',
  })
  @IsString()
  @IsOptional()
  street: string;

  @ApiProperty({
    description: 'City',
    example: 'Nairobi',
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'Nairobi County',
  })
  @IsString()
  @IsOptional()
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'Kenya',
  })
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '00100',
  })
  @IsString()
  @IsOptional()
  postalCode: string;
}

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Emergency contact full name',
    example: 'Jane Doe Smith',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'Relationship to delegate',
    example: 'Spouse',
  })
  @IsString()
  @IsOptional()
  relationship: string;

  @ApiProperty({
    description: 'Emergency contact phone number',
    example: '+254712345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Emergency contact email address',
    example: 'jane.doe@example.com',
  })
  @IsOptional()
  email?: string;
}

export class AccommodationDetailsDto {
  @ApiPropertyOptional({
    description: 'Hotel name',
    example: 'Nairobi Serena Hotel',
  })
  @IsOptional()
  @IsString()
  hotelName?: string;

  @ApiPropertyOptional({
    description: 'Check-in date (ISO format)',
    example: '2025-06-15T14:00:00.000Z',
  })
  @IsOptional()
  checkIn?: string;

  @ApiPropertyOptional({
    description: 'Check-out date (ISO format)',
    example: '2025-06-18T11:00:00.000Z',
  })
  @IsOptional()
  checkOut?: string;

  @ApiPropertyOptional({
    description: 'Room preference',
    example: 'Non-smoking, single bed',
  })
  @IsOptional()
  @IsString()
  roomPreference?: string;
}

export class FlightDetailsDto {
  @ApiPropertyOptional({
    description: 'Arrival flight number',
    example: 'KQ101',
  })
  @IsOptional()
  @IsString()
  arrivalFlight?: string;

  @ApiPropertyOptional({
    description: 'Departure flight number',
    example: 'KQ102',
  })
  @IsOptional()
  @IsString()
  departureFlight?: string;
}

export class SocialMediaDto {
  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Twitter profile URL',
    example: 'https://twitter.com/johndoe',
  })
  @IsOptional()
  twitter?: string;
}

// Main Create Delegate DTO
export class CreateDelegateDto {
  @ApiProperty({
    enum: Title,
    description: 'Title of the delegate',
    example: Title.MR,
  })
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Delegate first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Delegate last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Delegate email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Delegate event year',
    example: '2025',
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  eventYear: number;

  @ApiProperty({
    description: 'Delegate phone number with country code',
    example: '+254712345678',
  })
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Delegate nationality',
    example: 'Kenyan',
  })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiPropertyOptional({
    description: 'Delegate is admin',
    example: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Kenya Commercial Bank',
  })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({
    description: 'Position/title in organization',
    example: 'Chief Executive Officer',
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    enum: DelegateType,
    description: 'Type of delegate',
    example: DelegateType.GUEST,
  })
  @IsEnum(DelegateType)
  @IsNotEmpty()
  delegateType: DelegateType;

  @ApiProperty({
    enum: AttendanceMode,
    description: 'Mode of attendance',
    example: AttendanceMode.PHYSICAL,
  })
  @IsEnum(AttendanceMode)
  @IsNotEmpty()
  attendanceMode: AttendanceMode;

  @ApiProperty({
    type: IdentificationDto,
    description: 'Identification document details',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @ValidateNested()
  @Type(() => IdentificationDto)
  @IsNotEmpty()
  identification: IdentificationDto;

  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @ApiProperty({
    type: [String],
    description: 'Languages spoken by delegate',
    example: ['English', 'Swahili', 'French'],
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  languagesSpoken: string[];

  @ApiPropertyOptional({
    description: 'Preferred communication language',
    example: 'English',
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  // @ApiProperty({
  //   description: 'Event ID (MongoDB ObjectId)',
  //   example: '60d5ecb74f4d2c001f5e4b2a',
  // })
  // @IsMongoId()
  // @IsNotEmpty()
  // eventId: string;

  @ApiProperty({
    type: AddressDto,
    description: 'Delegate address',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @ApiProperty({
    type: EmergencyContactDto,
    description: 'Emergency contact information',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsNotEmpty()
  emergencyContact: EmergencyContactDto;

  @ApiPropertyOptional({
    description: 'Whether delegate has accommodation',
    example: true,
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  hasAccommodation?: boolean;

  @ApiPropertyOptional({
    type: AccommodationDetailsDto,
    description: 'Accommodation details if hasAccommodation is true',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @IsOptional()
  @ValidateNested()
  @Type(() => AccommodationDetailsDto)
  accommodationDetails?: AccommodationDetailsDto;

  @ApiPropertyOptional({
    description: 'Whether delegate requires visa',
    example: false,
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  requiresVisa?: boolean;

  @ApiPropertyOptional({
    description: 'Current visa status',
    example: 'Approved',
  })
  @IsOptional()
  @IsString()
  visaStatus?: string;

  @ApiPropertyOptional({
    description: 'Expected arrival date (ISO format)',
    example: '2025-06-15T10:00:00.000Z',
  })
  @IsOptional()
  arrivalDate?: string;

  @ApiPropertyOptional({
    description: 'Expected departure date (ISO format)',
    example: '2025-06-18T15:00:00.000Z',
  })
  @IsOptional()
  departureDate?: string;

  @ApiPropertyOptional({
    type: FlightDetailsDto,
    description: 'Flight information',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightDetailsDto)
  flightDetails?: FlightDetailsDto;

  @ApiPropertyOptional({
    type: SocialMediaDto,
    description: 'Social media profiles',
  })
  @Transform(
    ({ value }) => (typeof value === 'string' ? JSON.parse(value) : value),
    { toClassOnly: true },
  )
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @ApiPropertyOptional({
    description: 'Brief biography or description',
    example: 'Experienced banking executive with 15+ years in African markets.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Consent to photography during event',
    example: true,
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  consentToPhotography?: boolean;

  @ApiPropertyOptional({
    description: 'Consent to data processing',
    example: true,
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  consentToDataProcessing?: boolean;

  @ApiProperty({
    description: 'Password for the delegate account',
    example: 'h$shedP@sswOrd',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateDelegateDto extends PartialType(CreateDelegateDto) {}
