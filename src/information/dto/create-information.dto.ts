import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { EventStatus, LanguageCode } from '../entities/information.entity';
import {
  ContactInfo,
  MedicalServiceProvider,
  TravelRequirement,
  TransportationOption,
  AccommodationInfo,
  CurrencyBankingInfo,
  DataProtectionInfo,
  OfficialCarrierInfo,
  EmergencyContact,
} from '../entities/information.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInformationDto {
  @ApiProperty({ example: '2024', description: 'AGM year' })
  @IsString()
  @MaxLength(4)
  eventYear: string;

  @ApiProperty({
    example: 'Shelter Afrique 44th Annual General Meeting',
    description: 'Event title',
  })
  @IsString()
  @MaxLength(200)
  eventTitle: string;

  @ApiProperty({ example: 'Nairobi', description: 'Host city' })
  @IsString()
  @MaxLength(100)
  hostCity: string;

  @ApiProperty({ example: 'Kenya', description: 'Host country' })
  @IsString()
  @MaxLength(100)
  hostCountry: string;

  @ApiProperty({
    example: '2024-09-15T00:00:00Z',
    description: 'Event start date',
  })
  @IsDateString()
  eventStartDate: Date;

  @ApiProperty({
    example: '2024-09-18T23:59:59Z',
    description: 'Event end date',
  })
  @IsDateString()
  eventEndDate: Date;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.UPCOMING,
    description: 'Event status',
  })
  @IsEnum(EventStatus)
  eventStatus: EventStatus;

  @ApiProperty({
    enum: LanguageCode,
    example: LanguageCode.EN,
    description: 'Primary language',
  })
  @IsEnum(LanguageCode)
  primaryLanguage: LanguageCode;

  @ApiProperty({
    isArray: true,
    enum: LanguageCode,
    example: [LanguageCode.FR, LanguageCode.SW],
    description: 'Additional languages',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.includes('[')
        ? JSON.parse(value)
        : value.split(',').map((v: string) => v.trim())
      : value,
  )
  additionalLanguages?: LanguageCode[];

  @ApiProperty({
    example:
      'The 44th AGM brings together housing finance leaders from across Africa...',
    description: 'Event overview',
  })
  @IsString()
  @MaxLength(2000)
  eventOverview: string;

  @ApiProperty({
    example: 'Sarova Stanley Hotel, Nairobi',
    description: 'Main venue name and address',
  })
  @IsString()
  @MaxLength(500)
  mainVenue: string;

  @ApiProperty({
    example: ['Sustainable Housing Finance', 'Digital Innovation'],
    description: 'Key themes',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  keyThemes?: string[];

  @ApiProperty({
    example: ['Policy recommendations', 'Strategic partnerships'],
    description: 'Expected outcomes',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  expectedOutcomes?: string[];

  @ApiProperty({
    type: [MedicalServiceProvider],
    description: 'Medical services (JSON string)',
    example:
      '[{"name": "Nairobi Hospital", "serviceType": "Hospital", "contact": {"name": "Emergency Ward", "phone": "+254-20-2845000"}}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicalServiceProvider)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(MedicalServiceProvider, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  medicalServices?: MedicalServiceProvider[];

  @ApiProperty({
    example: 'Comprehensive travel insurance recommended.',
    description: 'Medical insurance info',
  })
  @IsOptional()
  @IsString()
  medicalInsuranceInfo?: string;

  @ApiProperty({
    type: DataProtectionInfo,
    description: 'Data protection information (JSON string)',
    example: '{"overview": "Data is protected according to GDPR standards."}',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DataProtectionInfo)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(DataProtectionInfo, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  dataProtection?: DataProtectionInfo;

  @ApiProperty({
    type: OfficialCarrierInfo,
    description: 'Official carrier information (JSON string)',
    example: '{"airlineName": "Kenya Airways", "airlineCode": "KQ"}',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfficialCarrierInfo)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(OfficialCarrierInfo, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  officialCarrier?: OfficialCarrierInfo;

  @ApiProperty({
    type: [TravelRequirement],
    description: 'Travel requirements (JSON string)',
    example:
      '[{"type": "Visa", "description": "Required for non-ECOWAS citizens."}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TravelRequirement)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(TravelRequirement, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  travelRequirements?: TravelRequirement[];

  @ApiProperty({
    example: ['Uganda', 'Tanzania'],
    description: 'Visa-free countries',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  visaFreeCountries?: string[];

  @ApiProperty({
    type: [TransportationOption],
    description: 'Transportation options (JSON string)',
    example:
      '[{"type": "Airport Shuttle", "provider": "Hotel Shuttle", "description": "Complimentary service"}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TransportationOption)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(TransportationOption, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  transportationOptions?: TransportationOption[];

  @ApiProperty({
    example: 'Jomo Kenyatta International Airport - 18km from venue',
    description: 'Airport information',
  })
  @IsOptional()
  @IsString()
  airportInfo?: string;

  @ApiProperty({
    type: [AccommodationInfo],
    description: 'Accommodation options (JSON string)',
    example:
      '[{"name": "Sarova Stanley", "category": "Partner Hotel", "contact": {"name": "Reservations", "phone": "+254-20-222222"}}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccommodationInfo)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(AccommodationInfo, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  accommodationOptions?: AccommodationInfo[];

  @ApiProperty({
    example: 'Nairobi is a vibrant metropolis...',
    description: 'About the host city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutHostCity?: string;

  @ApiProperty({ example: 'UTC+3', description: 'Time zone' })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiProperty({
    type: CurrencyBankingInfo,
    description: 'Currency and banking information (JSON string)',
    example:
      '{"currencyName": "Kenyan Shilling", "currencyCode": "KES", "currencySymbol": "KSh"}',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyBankingInfo)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(CurrencyBankingInfo, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  currencyBanking?: CurrencyBankingInfo;

  @ApiProperty({
    type: [EmergencyContact],
    description: 'Emergency contacts (JSON string)',
    example:
      '[{"serviceType": "Police", "emergencyNumber": "999"}, {"serviceType": "Ambulance", "emergencyNumber": "112"}]',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContact)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(EmergencyContact, parsed);
      } catch {
        return value;
      }
    }
    return value;
  })
  emergencyContacts?: EmergencyContact[];

  @ApiProperty({
    example: '+254-700-000000',
    description: 'Event emergency contact',
  })
  @IsOptional()
  @IsString()
  eventEmergencyContact?: string;

  @ApiProperty({
    example: ['Respect for elders', 'Modest dress'],
    description: 'Cultural etiquette',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  culturalEtiquette?: string[];

  @ApiProperty({
    example: ['Business cards with both hands'],
    description: 'Local customs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  localCustoms?: string[];

  @ApiProperty({
    example: ['Yellow fever vaccination'],
    description: 'Health precautions',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  healthPrecautions?: string[];

  @ApiProperty({
    example: ['Use registered taxis only'],
    description: 'Safety guidelines',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  safetyGuidelines?: string[];

  @ApiProperty({
    example: 'Safaricom, Airtel; SIM cards available at airport.',
    description: 'Mobile network information',
  })
  @IsOptional()
  @IsString()
  mobileNetworkInfo?: string;

  @ApiProperty({
    example: 'Free WiFi at venue; good 4G coverage.',
    description: 'Internet information',
  })
  @IsOptional()
  @IsString()
  internetInfo?: string;

  @ApiProperty({
    example: ['Bring universal adapter', 'Business casual attire'],
    description: 'Important notes',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch {
          return [value];
        }
      }
      return value.split(',').map((v: string) => v.trim());
    }
    return value;
  })
  importantNotes?: string[];

  @ApiProperty({
    example: 'delegates@shelterafrique.org',
    description: 'Delegate support contact',
  })
  @IsOptional()
  @IsString()
  delegateSupportContact?: string;
}
