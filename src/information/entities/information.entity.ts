import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
  IsDateString,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums
export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InfoCategory {
  MEDICAL_SERVICES = 'medical_services',
  DATA_PROTECTION = 'data_protection',
  OFFICIAL_CARRIER = 'official_carrier',
  EVENT_DETAILS = 'event_details',
  TRAVEL_REQUIREMENTS = 'travel_requirements',
  HOST_LOCATION = 'host_location',
  TRANSPORTATION = 'transportation',
  ACCOMMODATION = 'accommodation',
  EMERGENCY_CONTACTS = 'emergency_contacts',
  CULTURAL_ETIQUETTE = 'cultural_etiquette',
  CURRENCY_BANKING = 'currency_banking',
}

export enum LanguageCode {
  EN = 'en',
  FR = 'fr',
  PT = 'pt',
  AR = 'ar',
  SW = 'sw',
}

// Subdocument schemas
@Schema({ _id: false })
export class ContactInfo {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Contact name', example: 'Dr. John Doe' })
  name: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Phone number', example: '+254-712-345678' })
  phone: string;

  @IsOptional()
  @IsEmail()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Email address',
    example: 'emergency@nairobihospital.org',
    required: false,
  })
  email?: string;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Physical address',
    example: 'Argwings Kodhek Road, Nairobi',
    required: false,
  })
  address?: string;

  @IsOptional()
  @IsUrl()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Website URL',
    example: 'https://www.nairobihospital.org',
    required: false,
  })
  website?: string;

  @IsBoolean()
  @Prop({ default: true })
  @ApiProperty({ description: '24/7 availability', example: true })
  available24_7: boolean;
}

@Schema({ _id: false })
export class MedicalServiceProvider {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Provider name', example: 'Nairobi Hospital' })
  name: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Service type', example: 'Hospital' })
  serviceType: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => ContactInfo)
  @Prop({ required: false, type: ContactInfo })
  @ApiProperty({ description: 'Contact information', type: ContactInfo })
  contact: ContactInfo;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Specialties offered',
    example: ['Emergency Care', 'Cardiology', 'Internal Medicine'],
  })
  specialties: string[];

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Insurance information',
    example: 'Accepts international insurance, direct billing available',
  })
  insuranceInfo?: string;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({
    description: 'Distance from venue in kilometers',
    example: 5.2,
  })
  distanceFromVenue?: number;
}

@Schema({ _id: false })
export class TravelRequirement {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Type of requirement', example: 'Visa' })
  type: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Detailed description of the requirement',
    example:
      'A valid tourist visa is required for citizens of non-ECOWAS countries.',
  })
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Required documents',
    example: ['Valid passport', 'Return ticket', 'Hotel booking'],
  })
  requiredDocuments: string[];

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({ description: 'Processing time in days', example: 7 })
  processingDays?: number;

  @IsOptional()
  @IsUrl()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Application website',
    example: 'https://evisa.go.ke',
  })
  applicationUrl?: string;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Additional notes',
    example: 'Yellow fever vaccination required from endemic countries',
  })
  notes?: string;
}

@Schema({ _id: false })
export class TransportationOption {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Type of transportation',
    example: 'Airport Shuttle',
  })
  type: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Service provider',
    example: 'Hotel Shuttle Service',
  })
  provider: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Description of the service',
    example: 'Complimentary shuttle service to and from JKIA airport.',
  })
  description: string;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({ description: 'Estimated cost in USD', example: 25 })
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Booking information',
    example: 'Book through event portal or contact +254-700-000000',
  })
  bookingInfo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({ description: 'Operating hours', example: ['06:00-22:00'] })
  operatingHours?: string[];

  @IsBoolean()
  @Prop({ default: true })
  @ApiProperty({ description: 'Service availability', example: true })
  available: boolean;
}

@Schema({ _id: false })
export class AccommodationInfo {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Hotel name', example: 'Sarova Stanley Hotel' })
  name: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Hotel category',
    example: 'Official Partner Hotel',
  })
  category: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => ContactInfo)
  @Prop({ required: false, type: ContactInfo })
  @ApiProperty({ description: 'Contact information', type: ContactInfo })
  contact: ContactInfo;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({
    description: 'Distance from venue in kilometers',
    example: 2.5,
  })
  distanceFromVenue?: number;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({
    description: 'Negotiated rate per night in USD',
    example: 180,
  })
  negotiatedRate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Amenities offered',
    example: ['Free WiFi', 'Business Center', 'Fitness Center'],
  })
  amenities?: string[];

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Booking reference code',
    example: 'SHELTER2024',
  })
  bookingCode?: string;

  @IsOptional()
  @IsDateString()
  @Prop()
  @ApiProperty({
    description: 'Booking deadline',
    example: '2024-08-15T23:59:59Z',
  })
  bookingDeadline?: Date;
}

@Schema({ _id: false })
export class CurrencyBankingInfo {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Local currency name',
    example: 'Kenyan Shilling',
  })
  currencyName: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Currency code', example: 'KES' })
  currencyCode: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Currency symbol', example: 'KSh' })
  currencySymbol: string;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({
    description: 'Approximate exchange rate to USD',
    example: 143.5,
  })
  exchangeRateUSD?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Widely accepted credit cards',
    example: ['Visa', 'Mastercard', 'American Express'],
  })
  acceptedCards?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'ATM locations near venue',
    example: [
      'Sarova Stanley Hotel Lobby',
      'Kenyatta Avenue',
      'Village Market',
    ],
  })
  atmLocations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Money exchange locations',
    example: ['JKIA Airport', 'City Center Banks', 'Hotel Front Desks'],
  })
  exchangeLocations?: string[];

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Banking tips',
    example:
      'Notify your bank of travel dates. USD widely accepted at hotels and restaurants.',
  })
  tips?: string;
}

@Schema({ _id: false })
export class DataProtectionInfo {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Data protection overview',
    example:
      'Shelter Afrique is committed to protecting delegate personal information in accordance with international standards.',
  })
  overview: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Types of data collected',
    example: [
      'Personal identification',
      'Contact information',
      'Dietary preferences',
      'Emergency contacts',
    ],
  })
  dataCollected?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Data usage purposes',
    example: [
      'Event registration',
      'Communication',
      'Safety and security',
      'Networking facilitation',
    ],
  })
  usagePurposes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Data sharing policies',
    example: [
      'Shared with official partners only',
      'Not sold to third parties',
      'Anonymized for analytics',
    ],
  })
  sharingPolicies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Delegate rights',
    example: [
      'Access your data',
      'Request corrections',
      'Request deletion',
      'Opt-out of communications',
    ],
  })
  delegateRights?: string[];

  @IsOptional()
  @IsEmail()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Contact for data protection queries',
    example: 'dataprotection@shelterafrique.org',
  })
  contactEmail?: string;

  @IsOptional()
  @IsUrl()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Full privacy policy URL',
    example: 'https://shelterafrique.org/privacy-policy',
  })
  privacyPolicyUrl?: string;

  @IsOptional()
  @IsDateString()
  @Prop()
  @ApiProperty({
    description: 'Policy last updated date',
    example: '2024-01-15T00:00:00Z',
  })
  lastUpdated?: Date;
}

@Schema({ _id: false })
export class OfficialCarrierInfo {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Airline name', example: 'Kenya Airways' })
  airlineName: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Airline code', example: 'KQ' })
  airlineCode: string;

  @IsOptional()
  @IsNumber()
  @Prop({ type: Number })
  @ApiProperty({
    description: 'Discount percentage for delegates',
    example: 10,
  })
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Booking reference code',
    example: 'SHELTER2024AGM',
  })
  bookingCode?: string;

  @IsOptional()
  @IsUrl()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Special booking URL',
    example: 'https://www.kenya-airways.com/corporate/shelter-afrique',
  })
  bookingUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Routes covered',
    example: ['Nairobi-Johannesburg', 'Nairobi-Lagos', 'Nairobi-Cairo'],
  })
  routesCovered?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Additional benefits',
    example: [
      'Extra baggage allowance',
      'Priority check-in',
      'Lounge access discounts',
    ],
  })
  additionalBenefits?: string[];

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Contact information for bookings',
    example: '+254-20-3274747 or corporate@kenya-airways.com',
  })
  contactInfo?: string;

  @IsOptional()
  @IsDateString()
  @Prop()
  @ApiProperty({
    description: 'Offer valid until',
    example: '2024-09-30T23:59:59Z',
  })
  validUntil?: Date;
}

@Schema({ _id: false })
export class EmergencyContact {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({
    description: 'Emergency service type',
    example: 'Police Emergency',
  })
  serviceType: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Prop({ required: false, trim: true })
  @ApiProperty({ description: 'Emergency number', example: '999' })
  emergencyNumber: string;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Alternative number',
    example: '+254-20-2222222',
  })
  alternativeNumber?: string;

  @IsOptional()
  @IsString()
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Service description',
    example: 'National emergency services - Police, Fire, Ambulance',
  })
  description?: string;

  @IsBoolean()
  @Prop({ default: true })
  @ApiProperty({ description: 'Available 24/7', example: true })
  available24_7: boolean;
}

// Main schema
@Schema({
  collection: 'delegate_information',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Information extends Document {
  @Prop({ required: true, trim: true, maxlength: 4 })
  @ApiProperty({ description: 'AGM year', example: '2024' })
  eventYear: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  @ApiProperty({
    description: 'Event title',
    example: 'Shelter Afrique 44th Annual General Meeting',
  })
  eventTitle: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  @ApiProperty({ description: 'Host city', example: 'Nairobi' })
  hostCity: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  @ApiProperty({ description: 'Host country', example: 'Kenya' })
  hostCountry: string;

  @Prop({ required: true })
  @ApiProperty({
    description: 'Event start date',
    example: '2024-09-15T00:00:00Z',
  })
  eventStartDate: Date;

  @Prop({ required: true })
  @ApiProperty({
    description: 'Event end date',
    example: '2024-09-18T23:59:59Z',
  })
  eventEndDate: Date;

  @Prop({ required: true, enum: EventStatus })
  @ApiProperty({
    description: 'Event status',
    enum: EventStatus,
    example: EventStatus.UPCOMING,
  })
  eventStatus: EventStatus;

  @Prop({ required: true, enum: LanguageCode })
  @ApiProperty({
    description: 'Primary language',
    enum: LanguageCode,
    example: LanguageCode.EN,
  })
  primaryLanguage: LanguageCode;

  @Prop({ type: [String], enum: LanguageCode })
  @ApiProperty({
    description: 'Additional languages available',
    enum: LanguageCode,
    isArray: true,
    example: [LanguageCode.FR, LanguageCode.SW],
  })
  additionalLanguages?: LanguageCode[];

  // Event Details
  @Prop({ required: true, trim: true, maxlength: 2000 })
  @ApiProperty({
    description: 'Event overview',
    example:
      'The 44th AGM brings together housing finance leaders from across Africa to discuss sustainable housing solutions.',
  })
  eventOverview: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  @ApiProperty({
    description: 'Main venue name and address',
    example:
      'Sarova Stanley Hotel, Corner of Kenyatta Avenue and Kimathi Street, Nairobi',
  })
  mainVenue: string;

  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Key themes of the AGM',
    example: [
      'Sustainable Housing Finance',
      'Digital Innovation',
      'Climate Resilience',
    ],
  })
  keyThemes?: string[];

  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Expected outcomes',
    example: [
      'Strategic partnerships',
      'Policy recommendations',
      'Innovation showcase',
    ],
  })
  expectedOutcomes?: string[];

  // Medical Services
  @Prop({ type: [MedicalServiceProvider] })
  @ApiProperty({
    description: 'Medical service providers',
    type: [MedicalServiceProvider],
  })
  medicalServices?: MedicalServiceProvider[];

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Medical insurance recommendations',
    example:
      'Comprehensive travel insurance with medical coverage recommended. Emergency medical evacuation coverage advised.',
  })
  medicalInsuranceInfo?: string;

  // Data Protection
  @Prop({ type: DataProtectionInfo })
  @ApiProperty({
    description: 'Data protection information',
    type: DataProtectionInfo,
  })
  dataProtection?: DataProtectionInfo;

  // Official Carrier
  @Prop({ type: OfficialCarrierInfo })
  @ApiProperty({
    description: 'Official airline partner information',
    type: OfficialCarrierInfo,
  })
  officialCarrier?: OfficialCarrierInfo;

  // Travel Requirements
  @Prop({ type: [TravelRequirement] })
  @ApiProperty({
    description: 'Entry requirements for host country',
    type: [TravelRequirement],
  })
  travelRequirements?: TravelRequirement[];

  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Visa-free countries',
    example: ['Uganda', 'Tanzania', 'Rwanda'],
  })
  visaFreeCountries?: string[];

  // Transportation
  @Prop({ type: [TransportationOption] })
  @ApiProperty({
    description: 'Transportation options',
    type: [TransportationOption],
  })
  transportationOptions?: TransportationOption[];

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Airport information',
    example:
      'Jomo Kenyatta International Airport (JKIA) - 18km from city center, 45 minutes drive',
  })
  airportInfo?: string;

  // Accommodation
  @Prop({ type: [AccommodationInfo] })
  @ApiProperty({
    description: 'Recommended accommodation options',
    type: [AccommodationInfo],
  })
  accommodationOptions?: AccommodationInfo[];

  // Host Location Information
  @Prop({ trim: true, maxlength: 1000 })
  @ApiProperty({
    description: 'About the host city',
    example:
      "Nairobi, Kenya's capital, is a vibrant metropolis and the commercial hub of East Africa.",
  })
  aboutHostCity?: string;

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Time zone',
    example: 'East Africa Time (EAT) - UTC+3',
  })
  timeZone?: string;

  // Currency and Banking
  @Prop({ type: CurrencyBankingInfo })
  @ApiProperty({
    description: 'Currency and banking information',
    type: CurrencyBankingInfo,
  })
  currencyBanking?: CurrencyBankingInfo;

  // Emergency Contacts
  @Prop({ type: [EmergencyContact] })
  @ApiProperty({
    description: 'Emergency contact numbers',
    type: [EmergencyContact],
  })
  emergencyContacts?: EmergencyContact[];

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Event emergency contact',
    example: '+254-700-000000 (Event Coordinator)',
  })
  eventEmergencyContact?: string;

  // Cultural Information
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Cultural etiquette tips',
    example: [
      'Handshakes are common greetings',
      'Dress modestly for business',
      'Tipping 10% is customary',
    ],
  })
  culturalEtiquette?: string[];

  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Local customs to be aware of',
    example: [
      'Respect for elders',
      'Punctuality is valued',
      'Business cards exchanged with both hands',
    ],
  })
  localCustoms?: string[];

  // Health and Safety
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Health precautions',
    example: [
      'Yellow fever vaccination required',
      'Malaria prophylaxis recommended',
      'Drink bottled water',
    ],
  })
  healthPrecautions?: string[];

  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Safety guidelines',
    example: [
      'Avoid displaying expensive items',
      'Use reputable taxi services',
      'Stay in well-lit areas at night',
    ],
  })
  safetyGuidelines?: string[];

  // Communication
  @Prop({ trim: true })
  @ApiProperty({
    description: 'Local mobile network information',
    example:
      'Major networks: Safaricom, Airtel. International roaming available. SIM cards available at airport.',
  })
  mobileNetworkInfo?: string;

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Internet connectivity information',
    example:
      'Free WiFi available at most hotels and venues. 4G coverage excellent in Nairobi.',
  })
  internetInfo?: string;

  // Additional Information
  @Prop({ type: [String] })
  @ApiProperty({
    description: 'Important notes for delegates',
    example: [
      'Bring universal power adapter',
      'Business casual dress code',
      'Photography restrictions in some areas',
    ],
  })
  importantNotes?: string[];

  @Prop({ trim: true })
  @ApiProperty({
    description: 'Delegate support contact',
    example: 'delegates@shelterafrique.org or +254-20-4262721',
  })
  delegateSupportContact?: string;
}

export const InformationSchema = SchemaFactory.createForClass(Information);

// Create indexes for better performance
InformationSchema.index({ eventYear: 1 });
InformationSchema.index({ hostCountry: 1 });
InformationSchema.index({ eventStatus: 1 });
InformationSchema.index({ eventStartDate: 1, eventEndDate: 1 });

// Virtual for event duration
InformationSchema.virtual('eventDuration').get(function () {
  const start = new Date(this.eventStartDate);
  const end = new Date(this.eventEndDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until event
InformationSchema.virtual('daysUntilEvent').get(function () {
  const now = new Date();
  const eventStart = new Date(this.eventStartDate);
  const diffTime = eventStart.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});
