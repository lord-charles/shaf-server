import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEmail,
  IsUrl,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  IsHexColor,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../events.schema';

// Nested DTOs for complex objects

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Uhuru Highway',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'City name',
    example: 'Nairobi',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State or region',
    example: 'Nairobi County',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Kenya',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Postal code',
    example: '00100',
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

export class CoordinatesDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: -1.2921,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 36.8219,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class LocationDto {
  @ApiProperty({
    description: 'Name of the venue',
    example: 'Kenyatta International Convention Centre',
  })
  @IsString()
  @IsNotEmpty()
  venueName: string;

  @ApiProperty({
    description: 'Venue address details',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'GPS coordinates of the venue',
    type: CoordinatesDto,
  })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ApiProperty({
    description: 'Type of venue',
    example: 'Convention Center',
  })
  @IsString()
  @IsNotEmpty()
  venueType: string;

  @ApiProperty({
    description: 'Maximum capacity of the venue',
    example: 500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'Available facilities at the venue',
    example: ['WiFi', 'Parking', 'Audio/Visual Equipment', 'Catering Services'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  facilities: string[];

  @ApiPropertyOptional({
    description: 'Venue contact phone number',
    example: '+254-20-2221000',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Directions to the venue',
    example: 'Take Uhuru Highway exit, venue is 200m on the right',
  })
  @IsOptional()
  @IsString()
  directions?: string;

  @ApiPropertyOptional({
    description: 'Nearby landmark for reference',
    example: 'Opposite University of Nairobi',
  })
  @IsOptional()
  @IsString()
  landmarkNearby?: string;
}

export class VirtualDetailsDto {
  @ApiProperty({
    description: 'Virtual meeting platform',
    example: 'Zoom',
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    description: 'Meeting link URL',
    example: 'https://zoom.us/j/123456789',
  })
  @IsUrl()
  meetingLink: string;

  @ApiProperty({
    description: 'Meeting ID',
    example: '123 456 789',
  })
  @IsString()
  @IsNotEmpty()
  meetingId: string;

  @ApiPropertyOptional({
    description: 'Meeting passcode',
    example: 'ShelterAGM2025',
  })
  @IsOptional()
  @IsString()
  passcode?: string;

  @ApiPropertyOptional({
    description: 'Dial-in phone numbers',
    example: ['+254-20-1234567', '+1-646-558-8656'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dialInNumbers?: string[];

  @ApiPropertyOptional({
    description: 'Live streaming link',
    example: 'https://youtube.com/live/abc123',
  })
  @IsOptional()
  @IsUrl()
  streamingLink?: string;

  @ApiProperty({
    description: 'Whether recording is enabled',
    example: true,
  })
  @IsBoolean()
  recordingEnabled: boolean;

  @ApiProperty({
    description: 'Technical support contact',
    example: 'tech-support@shelterafrique.org',
  })
  @IsEmail()
  technicalSupportContact: string;
}

export class SpeakerDto {
  @ApiProperty({
    description: 'Speaker full name',
    example: 'Dr. Amina Hassan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Speaker job title',
    example: 'Chief Executive Officer',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Speaker organization',
    example: 'Shelter Afrique',
  })
  @IsString()
  @IsNotEmpty()
  organization: string;

  @ApiPropertyOptional({
    description: 'Speaker biography',
    example:
      'Dr. Hassan has over 20 years of experience in affordable housing development across Africa.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Speaker profile image URL',
    example: 'https://example.com/images/speakers/amina-hassan.jpg',
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Speaker email address',
    example: 'amina.hassan@shelterafrique.org',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Speaker LinkedIn profile URL',
    example: 'https://linkedin.com/in/amina-hassan',
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;
}

export class ModeratorDto {
  @ApiProperty({
    description: 'Moderator full name',
    example: 'Prof. John Mbeki',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Moderator job title',
    example: 'Board Chairman',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Moderator organization',
    example: 'Shelter Afrique',
  })
  @IsString()
  @IsNotEmpty()
  organization: string;
}

export class SessionDto {
  @ApiProperty({
    description: 'Unique session identifier',
    example: 'session-001',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Session title',
    example: 'Annual Financial Report Presentation',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Session description',
    example:
      'Comprehensive review of financial performance for the fiscal year 2023-2025',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Session start time',
    example: '2025-07-15T09:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Session end time',
    example: '2025-07-15T10:30:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Session duration in minutes',
    example: 90,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Type of session',
    example: 'plenary',
    enum: ['plenary', 'breakout', 'workshop', 'networking', 'break', 'lunch'],
  })
  @IsString()
  @IsNotEmpty()
  sessionType: string;

  @ApiPropertyOptional({
    description: 'Room or hall name',
    example: 'Main Auditorium',
  })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({
    description: 'Room capacity',
    example: 300,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  roomCapacity?: number;

  @ApiProperty({
    description: 'Session speakers',
    type: [SpeakerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpeakerDto)
  speakers: SpeakerDto[];

  @ApiPropertyOptional({
    description: 'Session moderator',
    type: ModeratorDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ModeratorDto)
  moderator?: ModeratorDto;

  @ApiProperty({
    description: 'Whether this is a breakout session',
    example: false,
  })
  @IsBoolean()
  isBreakoutSession: boolean;

  @ApiPropertyOptional({
    description: 'Session learning objectives',
    example: [
      'Understand financial performance',
      'Review investment strategies',
      'Discuss future outlook',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiProperty({
    description: 'Whether live streaming is available',
    example: true,
  })
  @IsBoolean()
  liveStreamAvailable: boolean;

  @ApiProperty({
    description: 'Whether session recording is available',
    example: true,
  })
  @IsBoolean()
  recordingAvailable: boolean;
}

export class AgendaDto {
  @ApiProperty({
    description: 'Date of the agenda',
    example: '2025-07-15T00:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Sessions for the day',
    type: [SessionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionDto)
  @ArrayMinSize(1)
  sessions: SessionDto[];
}

export class ContactPersonDto {
  @ApiProperty({
    description: 'Contact person full name',
    example: 'Mary Wanjiku',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Contact person job title',
    example: 'Event Coordinator',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Contact person email',
    example: 'mary.wanjiku@shelterafrique.org',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contact person phone number',
    example: '+254-722-123456',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class SupportContactDto {
  @ApiProperty({
    description: 'Support email address',
    example: 'support@shelterafrique.org',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Support phone number',
    example: '+254-20-4273000',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Emergency contact name',
    example: 'Dr. James Kiprotich',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+254-722-987654',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class ContactInfoDto {
  @ApiProperty({
    description: 'Primary contact person',
    type: ContactPersonDto,
  })
  @ValidateNested()
  @Type(() => ContactPersonDto)
  primaryContact: ContactPersonDto;

  @ApiProperty({
    description: 'Technical support contact',
    type: SupportContactDto,
  })
  @ValidateNested()
  @Type(() => SupportContactDto)
  technicalSupport: SupportContactDto;

  @ApiProperty({
    description: 'Registration support contact',
    type: SupportContactDto,
  })
  @ValidateNested()
  @Type(() => SupportContactDto)
  registrationSupport: SupportContactDto;

  @ApiProperty({
    description: 'Emergency contact',
    type: EmergencyContactDto,
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;
}

export class ParkingDto {
  @ApiProperty({
    description: 'Whether parking is available',
    example: true,
  })
  @IsBoolean()
  available: boolean;

  @ApiPropertyOptional({
    description: 'Parking cost information',
    example: 'Free for attendees',
  })
  @IsOptional()
  @IsString()
  cost?: string;

  @ApiPropertyOptional({
    description: 'Parking instructions',
    example: 'Use entrance C for event parking',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class AccessibilityDto {
  @ApiProperty({
    description: 'Whether venue is wheelchair accessible',
    example: true,
  })
  @IsBoolean()
  wheelchairAccessible: boolean;

  @ApiProperty({
    description: 'Whether sign language interpreter is available',
    example: true,
  })
  @IsBoolean()
  signLanguageInterpreter: boolean;

  @ApiProperty({
    description: 'Whether hearing loop system is available',
    example: true,
  })
  @IsBoolean()
  hearingLoop: boolean;

  @ApiPropertyOptional({
    description: 'Other accessibility features',
    example: ['Braille signage', 'Service animal friendly'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  other?: string[];
}

export class CateringDto {
  @ApiProperty({
    description: 'Whether catering is provided',
    example: true,
  })
  @IsBoolean()
  provided: boolean;

  @ApiProperty({
    description: 'Available dietary options',
    example: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  dietaryOptionsAvailable: string[];

  @ApiPropertyOptional({
    description: 'URL to menu details',
    example: 'https://shelterafrique.org/events/agm-2025/menu',
  })
  @IsOptional()
  @IsUrl()
  menuUrl?: string;
}

export class AccommodationDto {
  @ApiProperty({
    description: 'Hotel name',
    example: 'Nairobi Serena Hotel',
  })
  @IsString()
  @IsNotEmpty()
  hotelName: string;

  @ApiProperty({
    description: 'Hotel address',
    example: 'Kenyatta Avenue, Nairobi',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Hotel phone number',
    example: '+254-20-2822000',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({
    description: 'Hotel website URL',
    example: 'https://www.serenahotels.com/nairobi',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Special rate for attendees',
    example: 'USD 120 per night (regular rate: USD 180)',
  })
  @IsOptional()
  @IsString()
  specialRate?: string;

  @ApiProperty({
    description: 'Distance from event venue',
    example: '2.5 km (5 minutes by car)',
  })
  @IsString()
  @IsNotEmpty()
  distanceFromVenue: string;

  @ApiPropertyOptional({
    description: 'Booking deadline',
    example: '2025-06-15T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  bookingDeadline?: string;

  @ApiPropertyOptional({
    description: 'Special booking code',
    example: 'SHELTERAGM2025',
  })
  @IsOptional()
  @IsString()
  bookingCode?: string;
}

export class TransportationDto {
  @ApiProperty({
    description: 'Whether airport transfer is provided',
    example: true,
  })
  @IsBoolean()
  airportTransfer: boolean;

  @ApiProperty({
    description: 'Available public transport options',
    example: ['Bus Route 34', 'Matatu Route 111', 'Taxi services'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  publicTransport: string[];

  @ApiProperty({
    description: 'Whether shuttle service is provided',
    example: true,
  })
  @IsBoolean()
  shuttleService: boolean;

  @ApiPropertyOptional({
    description: 'Transportation instructions',
    example: 'Shuttle pickup at 7:30 AM from partner hotels',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class LogisticsDto {
  @ApiProperty({
    description: 'Event timezone',
    example: 'Africa/Nairobi',
  })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({
    description: 'Primary event language',
    example: 'English',
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Event currency',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiPropertyOptional({
    description: 'Dress code for the event',
    example: 'Business formal',
  })
  @IsOptional()
  @IsString()
  dresscode?: string;

  @ApiProperty({
    description: 'Parking information',
    type: ParkingDto,
  })
  @ValidateNested()
  @Type(() => ParkingDto)
  parking: ParkingDto;

  @ApiProperty({
    description: 'Accessibility information',
    type: AccessibilityDto,
  })
  @ValidateNested()
  @Type(() => AccessibilityDto)
  accessibility: AccessibilityDto;

  @ApiProperty({
    description: 'Catering information',
    type: CateringDto,
  })
  @ValidateNested()
  @Type(() => CateringDto)
  catering: CateringDto;

  @ApiProperty({
    description: 'Recommended accommodation options',
    type: [AccommodationDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AccommodationDto)
  accommodation: { recommended: AccommodationDto[] };

  @ApiProperty({
    description: 'Transportation information',
    type: TransportationDto,
  })
  @ValidateNested()
  @Type(() => TransportationDto)
  transportation: TransportationDto;
}

export class SocialMediaDto {
  @ApiPropertyOptional({
    description: 'Event hashtag',
    example: '#ShelterAGM2025',
  })
  @IsOptional()
  @IsString()
  hashtag?: string;

  @ApiPropertyOptional({
    description: 'Facebook event page URL',
    example: 'https://facebook.com/events/shelteragm2025',
  })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({
    description: 'Twitter/X handle or URL',
    example: 'https://twitter.com/shelterafrique',
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn event page URL',
    example: 'https://linkedin.com/company/shelter-afrique/events',
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/shelterafrique',
  })
  @IsOptional()
  @IsUrl()
  instagram?: string;
}

export class BrandingDto {
  @ApiPropertyOptional({
    description: 'Primary brand color (hex code)',
    example: '#1E40AF',
  })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Secondary brand color (hex code)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional({
    description:
      'Event logo URL. This will be populated from the uploaded branding logo file.',
    example: 'https://shelterafrique.org/assets/agm-2025-logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Event theme template URL',
    example: 'https://shelterafrique.org/themes/agm-2025.css',
  })
  @IsOptional()
  @IsUrl()
  themeUrl?: string;
}

// Main Create Event DTO
export class CreateEventDto {
  @ApiProperty({
    description: 'Event year',
    example: 2025,
  })
  @IsNumber()
  @IsNotEmpty()
  eventYear: number;

  @ApiProperty({
    description: 'Event title',
    example: 'Shelter Afrique Annual General Meeting 2025',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Full event description',
    example:
      'Join us for the Annual General Meeting where we will review our achievements, financial performance, and strategic direction for the coming year. This meeting brings together shareholders, board members, and stakeholders from across Africa.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Brief event description',
    example:
      'Annual shareholders meeting to review performance and strategic direction.',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    description: 'Event start date and time',
    example: '2025-07-15T08:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Event end date and time',
    example: '2025-07-16T17:00:00.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Registration opening date',
    example: '2025-05-01T00:00:00.000Z',
  })
  @IsDateString()
  registrationStartDate: string;

  @ApiProperty({
    description: 'Registration closing date',
    example: '2025-07-01T23:59:59.000Z',
  })
  @IsDateString()
  registrationEndDate: string;

  @ApiProperty({
    description: 'Event location details',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Virtual meeting details (for hybrid/virtual events)',
    type: VirtualDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VirtualDetailsDto)
  virtualDetails?: VirtualDetailsDto;

  @ApiPropertyOptional({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Array of organizer user IDs',
    example: ['60f7b3b3b3b3b3b3b3b3b3b3', '60f7b3b3b3b3b3b3b3b3b3b4'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  organizers?: string[];

  @ApiPropertyOptional({
    description: 'Maximum number of attendees (0 for unlimited)',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttendees?: number;

  @ApiPropertyOptional({
    description: 'Current number of registered attendees',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAttendees?: number;

  @ApiPropertyOptional({
    description:
      'Event banner image URL. This will be populated from the uploaded event banner file.',
    example: 'https://shelterafrique.org/assets/agm-2025-banner.jpg',
  })
  @IsOptional()
  @IsString()
  eventBanner?: string;

  @ApiPropertyOptional({
    description:
      'Additional event images. These will be populated from the uploaded event image files.',
    example: [
      'https://shelterafrique.org/assets/venue-1.jpg',
      'https://shelterafrique.org/assets/venue-2.jpg',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventImages?: string[];

  @ApiPropertyOptional({
    description: 'Event agenda with sessions',
    type: [AgendaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaDto)
  agenda?: AgendaDto[];

  @ApiProperty({
    description: 'Event contact information',
    type: ContactInfoDto,
  })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @ApiPropertyOptional({
    description: 'Event logistics information',
    type: LogisticsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogisticsDto)
  logistics?: LogisticsDto;

  @ApiPropertyOptional({
    description: 'Social media links',
    type: SocialMediaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @ApiPropertyOptional({
    description: 'Event branding configuration',
    type: BrandingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingDto)
  branding?: BrandingDto;

  @ApiPropertyOptional({
    description: 'Additional notes about the event',
    example:
      'This is a mandatory meeting for all shareholders. Proxy forms must be submitted by July 10th.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Update Event DTO
export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Reason for cancellation (required if status is cancelled)',
    example:
      'Event cancelled due to unforeseen circumstances. New date will be announced soon.',
  })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
