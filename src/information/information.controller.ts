import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { InformationService } from './information.service';
import { Information } from './entities/information.entity';
import { CreateInformationDto } from './dto/create-information.dto';
import { Public } from 'src/modules/auth/decorators/public.decorator';

@ApiTags('Information')
@ApiBearerAuth()
@Controller('information')
export class InformationController {
  constructor(private readonly informationService: InformationService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create event information' })
  @ApiBody({
    description: 'Multipart form data for creating event information.',
    schema: {
      type: 'object',
      required: [
        'eventYear',
        'eventTitle',
        'hostCity',
        'hostCountry',
        'eventStartDate',
        'eventEndDate',
        'eventStatus',
        'primaryLanguage',
        'eventOverview',
        'mainVenue',
      ],
      properties: {
        eventYear: { type: 'string', example: '2024' },
        eventTitle: {
          type: 'string',
          example: 'Shelter Afrique 44th Annual General Meeting',
        },
        hostCity: { type: 'string', example: 'Nairobi' },
        hostCountry: { type: 'string', example: 'Kenya' },
        eventStartDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-09-15T00:00:00Z',
        },
        eventEndDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-09-18T23:59:59Z',
        },
        eventStatus: {
          type: 'string',
          enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
          example: 'upcoming',
        },
        primaryLanguage: {
          type: 'string',
          enum: ['en', 'fr', 'pt', 'ar', 'sw'],
          example: 'en',
        },
        additionalLanguages: {
          type: 'array',
          items: { type: 'string', enum: ['en', 'fr', 'pt', 'ar', 'sw'] },
          example: ['fr', 'sw'],
        },
        eventOverview: {
          type: 'string',
          example:
            'The 44th AGM brings together housing finance leaders from across Africa to discuss sustainable housing solutions.',
        },
        mainVenue: {
          type: 'string',
          example:
            'Sarova Stanley Hotel, Corner of Kenyatta Avenue and Kimathi Street, Nairobi',
        },
        keyThemes: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Sustainable Housing Finance',
            'Digital Innovation',
            'Climate Resilience',
          ],
        },
        expectedOutcomes: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Strategic partnerships formed',
            'Policy recommendations published',
            'Innovation showcase held',
            'Capacity building workshops delivered',
          ],
        },
        medicalServices: {
          type: 'array',
          items: { type: 'object' },
          example: [
            {
              name: 'Nairobi Hospital',
              serviceType: 'General Hospital',
              contact: {
                name: 'Nairobi Hospital Emergency',
                phone: '+254-20-2845000',
                email: 'emergency@nairobihospital.org',
                address: 'Argwings Kodhek Road, Nairobi',
                website: 'https://www.nairobihospital.org',
                available24_7: true,
              },
              specialties: [
                'Emergency Care',
                'Cardiology',
                'Internal Medicine',
              ],
              insuranceInfo:
                'Accepts international insurance, direct billing available',
              distanceFromVenue: 5.2,
            },
          ],
        },
        medicalInsuranceInfo: {
          type: 'string',
          example:
            'Comprehensive travel insurance with medical coverage recommended.',
        },
        dataProtection: {
          type: 'object',
          example: {
            overview:
              'Committed to protecting delegate personal information in accordance with international standards.',
            dataCollected: [
              'Personal identification',
              'Contact information',
              'Dietary preferences',
              'Emergency contacts',
            ],
            usagePurposes: [
              'Event registration',
              'Communication',
              'Safety and security',
              'Networking facilitation',
            ],
            sharingPolicies: [
              'Shared with official partners only',
              'Not sold to third parties',
              'Anonymized for analytics',
            ],
            delegateRights: [
              'Access your data',
              'Request corrections',
              'Request deletion',
              'Opt-out of communications',
            ],
            contactEmail: 'dataprotection@shelterafrique.org',
            privacyPolicyUrl: 'https://shelterafrique.org/privacy-policy',
            lastUpdated: '2024-01-15T00:00:00Z',
          },
        },
        officialCarrier: {
          type: 'object',
          example: {
            airlineName: 'Kenya Airways',
            airlineCode: 'KQ',
            discountPercentage: 10,
            bookingCode: 'SHELTER2024AGM',
            bookingUrl:
              'https://www.kenya-airways.com/corporate/shelter-afrique',
            routesCovered: [
              'Nairobi-Johannesburg',
              'Nairobi-Lagos',
              'Nairobi-Cairo',
            ],
            additionalBenefits: [
              'Extra baggage allowance',
              'Priority check-in',
              'Lounge access discounts',
            ],
            contactInfo: '+254-20-3274747 or corporate@kenya-airways.com',
            validUntil: '2024-09-30T23:59:59Z',
          },
        },
        travelRequirements: {
          type: 'array',
          items: { type: 'object' },
          example: [
            {
              type: 'Visa',
              description: 'Tourist visa required for stays up to 90 days',
              requiredDocuments: [
                'Valid passport',
                'Return ticket',
                'Hotel booking',
              ],
              processingDays: 7,
              applicationUrl: 'https://evisa.go.ke',
              notes: 'Yellow fever vaccination required from endemic countries',
            },
          ],
        },
        visaFreeCountries: {
          type: 'array',
          items: { type: 'string' },
          example: ['Uganda', 'Tanzania', 'Rwanda'],
        },
        transportationOptions: {
          type: 'array',
          items: { type: 'object' },
          example: [
            {
              type: 'Airport Shuttle',
              provider: 'Shelter Afrique Official Transport',
              description:
                'Complimentary shuttle service from JKIA to event venues',
              estimatedCost: 25,
              bookingInfo:
                'Book through event portal or contact +254-700-000000',
              operatingHours: ['06:00-22:00'],
              available: true,
            },
          ],
        },
        airportInfo: {
          type: 'string',
          example:
            'Jomo Kenyatta International Airport (JKIA) - 18km from city center, 45 minutes drive',
        },
        accommodationOptions: {
          type: 'array',
          items: { type: 'object' },
          example: [
            {
              name: 'Sarova Stanley Hotel',
              category: 'Official Partner Hotel',
              contact: {
                name: 'Hotel Reservations',
                phone: '+254-20-2757000',
                email: 'reservations@sarovahotels.com',
                address:
                  'Corner of Kenyatta Avenue and Kimathi Street, Nairobi',
                website: 'https://www.sarovahotels.com/stanley-nairobi',
                available24_7: true,
              },
              distanceFromVenue: 2.5,
              negotiatedRate: 180,
              amenities: ['Free WiFi', 'Business Center', 'Fitness Center'],
              bookingCode: 'SHELTER2024',
              bookingDeadline: '2024-08-15T23:59:59Z',
            },
          ],
        },
        aboutHostCity: {
          type: 'string',
          example:
            "Nairobi, Kenya's capital, is a vibrant metropolis and the commercial hub of East Africa.",
        },
        timeZone: { type: 'string', example: 'East Africa Time (EAT) - UTC+3' },
        currencyBanking: {
          type: 'object',
          example: {
            currencyName: 'Kenyan Shilling',
            currencyCode: 'KES',
            currencySymbol: 'KSh',
            exchangeRateUSD: 143.5,
            acceptedCards: ['Visa', 'Mastercard', 'American Express'],
            atmLocations: [
              'Sarova Stanley Hotel Lobby',
              'Kenyatta Avenue',
              'Village Market',
            ],
            exchangeLocations: [
              'JKIA Airport',
              'City Center Banks',
              'Hotel Front Desks',
            ],
            tips: 'Notify your bank of travel dates. USD widely accepted at hotels and restaurants.',
          },
        },
        emergencyContacts: {
          type: 'array',
          items: { type: 'object' },
          example: [
            {
              serviceType: 'Police Emergency',
              emergencyNumber: '999',
              alternativeNumber: '+254-20-2222222',
              description:
                'National emergency services - Police, Fire, Ambulance',
              available24_7: true,
            },
            {
              serviceType: 'Ambulance',
              emergencyNumber: '123',
              alternativeNumber: '+254-20-1111111',
              description: '24/7 ambulance service',
              available24_7: true,
            },
          ],
        },
        eventEmergencyContact: {
          type: 'string',
          example: '+254-700-000000 (Event Coordinator)',
        },
        culturalEtiquette: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Handshakes are common greetings',
            'Dress modestly for business',
            'Tipping 10% is customary',
          ],
        },
        localCustoms: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Respect for elders',
            'Punctuality is valued',
            'Business cards exchanged with both hands',
          ],
        },
        healthPrecautions: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Yellow fever vaccination required',
            'Malaria prophylaxis recommended',
            'Drink bottled water',
          ],
        },
        safetyGuidelines: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Avoid displaying expensive items',
            'Use reputable taxi services',
            'Stay in well-lit areas at night',
          ],
        },
        mobileNetworkInfo: {
          type: 'string',
          example:
            'Major networks: Safaricom, Airtel. International roaming available. SIM cards available at airport.',
        },
        internetInfo: {
          type: 'string',
          example:
            'Free WiFi available at most hotels and venues. 4G coverage excellent in Nairobi.',
        },
        importantNotes: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Bring universal power adapter',
            'Business casual dress code',
            'Photography restrictions in some areas',
          ],
        },
        delegateSupportContact: {
          type: 'string',
          example: 'delegates@shelterafrique.org or +254-20-4262721',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Delegate information created successfully',
    type: Information,
  })
  async create(
    @Body() createInformationDto: CreateInformationDto,
  ): Promise<Information> {
    console.log(createInformationDto);
    return this.informationService.create(createInformationDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all delegate information records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all delegate information',
    type: [Information],
  })
  async findAll(@Query('year') year?: string) {
    return this.informationService.findAll(year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delegate information by ID' })
  @ApiParam({ name: 'id', description: 'Delegate information ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delegate information retrieved successfully',
    type: Information,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Delegate information not found',
  })
  async findOne(@Param('id') id: string): Promise<Information> {
    const result = await this.informationService.findById(id);
    if (!result) {
      throw new NotFoundException('Delegate information not found');
    }
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update delegate information by ID' })
  @ApiParam({ name: 'id', description: 'Delegate information ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delegate information updated successfully',
    type: Information,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: CreateInformationDto,
  ): Promise<Information> {
    const result = await this.informationService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException('Delegate information not found');
    }
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete delegate information by ID' })
  @ApiParam({ name: 'id', description: 'Delegate information ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delegate information deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    const deleted = await this.informationService.delete(id);
    if (!deleted) {
      throw new NotFoundException('Delegate information not found');
    }
  }
}
