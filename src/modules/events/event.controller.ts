import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './event.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { Event } from './events.schema';
import { EventStatus } from './events.schema';
import { Types } from 'mongoose';
import {
  CancelEventDto,
  EventResponseDto,
  PaginatedEventsResponseDto,
} from './dto/res.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    // forbidNonWhitelisted: true, // Reject requests with properties not defined in DTO
    // skipMissingProperties: false, // Ensure all properties are validated, even if missing
  }),
)
@ApiTags('Events Management')
@Controller('events')
@ApiBearerAuth()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  private readonly logger = new Logger(EventsController.name);

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event',
    description:
      'Creates a new Shelter Afrique AGM or corporate event with comprehensive details.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'eventBanner', maxCount: 1 },
      { name: 'eventImages', maxCount: 10 },
      { name: 'brandingLogo', maxCount: 1 },
    ]),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventBanner: {
          type: 'string',
          format: 'binary',
          description: 'Banner image for the event.',
        },
        eventImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Additional images for the event gallery.',
        },
        brandingLogo: {
          type: 'string',
          format: 'binary',
          description: 'Logo for event branding.',
        },
        eventYear: {
          type: 'number',
          example: 2025,
        },
        title: {
          type: 'string',
          example: 'Shelter Afrique Annual General Meeting 2025',
        },
        description: {
          type: 'string',
          example: 'Join us for the Annual General Meeting...',
        },
        shortDescription: {
          type: 'string',
          example: 'Annual shareholders meeting...',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-15T08:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-16T17:00:00.000Z',
        },
        registrationStartDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-05-01T00:00:00.000Z',
        },
        registrationEndDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-01T23:59:59.000Z',
        },
        status: {
          type: 'string',
          enum: Object.values(EventStatus),
          example: EventStatus.PUBLISHED,
        },
        organizers: {
          type: 'array',
          items: { type: 'string' },
          example: ['60f7b3b3b3b3b3b3b3b3b3b3'],
        },
        maxAttendees: { type: 'number', example: 500 },
        currentAttendees: { type: 'number', example: 0 },
        notes: {
          type: 'string',
          example: 'This is a mandatory meeting for all shareholders.',
        },
        'location[venueName]': {
          type: 'string',
          example: 'Kenyatta International Convention Centre',
        },
        'location[address][street]': {
          type: 'string',
          example: '123 Uhuru Highway',
        },
        'location[address][city]': { type: 'string', example: 'Nairobi' },
        'location[address][state]': {
          type: 'string',
          example: 'Nairobi County',
        },
        'location[address][country]': { type: 'string', example: 'Kenya' },
        'location[address][postalCode]': { type: 'string', example: '00100' },
        'location[coordinates][latitude]': { type: 'number', example: -1.2921 },
        'location[coordinates][longitude]': {
          type: 'number',
          example: 36.8219,
        },
        'location[venueType]': { type: 'string', example: 'Convention Center' },
        'location[capacity]': { type: 'number', example: 500 },
        'location[facilities]': {
          type: 'array',
          items: { type: 'string' },
          example: ['WiFi', 'Parking'],
        },
        'virtualDetails[platform]': { type: 'string', example: 'Zoom' },
        'virtualDetails[meetingLink]': {
          type: 'string',
          format: 'uri',
          example: 'https://zoom.us/j/123456789',
        },
        agenda: {
          type: 'string',
          description:
            'JSON string of the event agenda. See AgendaDto for structure.',
          example:
            '[{"date":"2025-07-15T00:00:00.000Z","sessions":[{"sessionId":"session-d1-001","title":"Registration & Welcome Coffee","description":"Collect your badge and materials, and enjoy a coffee with fellow attendees.","startTime":"2025-07-15T08:00:00.000Z","endTime":"2025-07-15T09:00:00.000Z","duration":60,"sessionType":"networking","speakers":[],"isBreakoutSession":false,"liveStreamAvailable":false,"recordingAvailable":false,"location":"Foyer"},{"sessionId":"session-d1-002","title":"Opening Ceremony & Welcome Address","description":"Official opening of the 44th Annual General Assembly.","startTime":"2025-07-15T09:00:00.000Z","endTime":"2025-07-15T10:00:00.000Z","duration":60,"sessionType":"plenary","speakers":[{"name":"Dr. Amina Hassan","title":"Chief Executive Officer","organization":"Shelter Afrique"}],"isBreakoutSession":false,"liveStreamAvailable":true,"recordingAvailable":true,"location":"Main Auditorium"},{"sessionId":"session-d1-003","title":"Keynote: The Future of Affordable Housing in Africa","description":"An inspiring keynote address on the challenges and opportunities in the African housing sector.","startTime":"2025-07-15T10:00:00.000Z","endTime":"2025-07-15T11:00:00.000Z","duration":60,"sessionType":"plenary","speakers":[{"name":"Prof. John Appiah","title":"Housing Policy Expert","organization":"UN-Habitat"}],"isBreakoutSession":false,"liveStreamAvailable":true,"recordingAvailable":true,"location":"Main Auditorium"},{"sessionId":"session-d1-004","title":"Lunch Break","description":"Networking lunch.","startTime":"2025-07-15T12:30:00.000Z","endTime":"2025-07-15T14:00:00.000Z","duration":90,"sessionType":"break","speakers":[],"isBreakoutSession":true,"liveStreamAvailable":false,"recordingAvailable":false,"location":"Dining Hall"}]},{"date":"2025-07-16T00:00:00.000Z","sessions":[{"sessionId":"session-d2-001","title":"Plenary: Sustainable Urban Development","description":"Exploring green building practices and sustainable development goals.","startTime":"2025-07-16T09:00:00.000Z","endTime":"2025-07-16T10:30:00.000Z","duration":90,"sessionType":"plenary","speakers":[{"name":"Ms. Fatou Diallo","title":"Director of Urban Planning","organization":"African Development Bank"}],"isBreakoutSession":false,"liveStreamAvailable":true,"recordingAvailable":true,"location":"Main Auditorium"},{"sessionId":"session-d2-002a","title":"Breakout: Public-Private Partnerships","description":"Case studies and frameworks for successful PPPs in housing.","startTime":"2025-07-16T11:00:00.000Z","endTime":"2025-07-16T12:30:00.000Z","duration":90,"sessionType":"breakout","speakers":[{"name":"Mr. David Kimani","title":"Investment Manager","organization":"Kenya Mortgage Refinance Company"}],"isBreakoutSession":true,"liveStreamAvailable":false,"recordingAvailable":true,"location":"Room 101"},{"sessionId":"session-d2-002b","title":"Breakout: Green Building Certifications","description":"A deep dive into EDGE, LEED, and other green building standards relevant to Africa.","startTime":"2025-07-16T11:00:00.000Z","endTime":"2025-07-16T12:30:00.000Z","duration":90,"sessionType":"breakout","speakers":[{"name":"Dr. Sarah Chen","title":"Sustainability Consultant","organization":"IFC"}],"isBreakoutSession":true,"liveStreamAvailable":false,"recordingAvailable":true,"location":"Room 102"}]},{"date":"2025-07-17T00:00:00.000Z","sessions":[{"sessionId":"session-d3-001","title":"Workshop: Risk Management in Large-Scale Projects","description":"Interactive workshop on identifying and mitigating risks in housing projects.","startTime":"2025-07-17T09:30:00.000Z","endTime":"2025-07-17T11:00:00.000Z","duration":90,"sessionType":"workshop","speakers":[{"name":"Mr. Tunde Adebayo","title":"Project Director","organization":"Eko Atlantic"}],"isBreakoutSession":true,"liveStreamAvailable":false,"recordingAvailable":true,"location":"Workshop Hall A"},{"sessionId":"session-d3-002","title":"Plenary: The 5-Year Strategic Plan","description":"Unveiling the strategic direction for Shelter Afrique for 2026-2030.","startTime":"2025-07-17T11:30:00.000Z","endTime":"2025-07-17T12:30:00.000Z","duration":60,"sessionType":"plenary","speakers":[{"name":"Dr. Amina Hassan","title":"Chief Executive Officer","organization":"Shelter Afrique"}],"isBreakoutSession":false,"liveStreamAvailable":true,"recordingAvailable":true,"location":"Main Auditorium"},{"sessionId":"session-d3-003","title":"Closing Ceremony & Award Ceremony","description":"Recognizing outstanding contributions to the housing sector and closing remarks.","startTime":"2025-07-17T12:30:00.000Z","endTime":"2025-07-17T13:00:00.000Z","duration":30,"sessionType":"plenary","speakers":[],"isBreakoutSession":false,"liveStreamAvailable":true,"recordingAvailable":true,"location":"Main Auditorium"}]}]',
        },
        'contactInfo[primaryContact][name]': {
          type: 'string',
          example: 'Mary Wanjiku',
        },
        'contactInfo[primaryContact][email]': {
          type: 'string',
          format: 'email',
          example: 'mary.wanjiku@shelterafrique.org',
        },
        'logistics[accommodation]': {
          type: 'string',
          description: 'JSON string of accommodation details.',
          example:
            '{"recommended":[{"hotelName":"Nairobi Serena Hotel","address":"Kenyatta Avenue, Nairobi","phone":"+254-20-2822000"}]}',
        },
        'socialMedia[hashtag]': { type: 'string', example: '#ShelterAGM2025' },
        'branding[primaryColor]': {
          type: 'string',
          format: 'hex-color',
          example: '#1E40AF',
        },
        'branding[secondaryColor]': {
          type: 'string',
          format: 'hex-color',
          example: '#3B82F6',
        },
        'branding[themeUrl]': {
          type: 'string',
          format: 'uri',
          example: 'https://shelterafrique.org/themes/agm-2025.css',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation errors',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'title should not be empty',
          'startDate must be a valid ISO 8601 date string',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Event with similar details already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'An event with similar title and date already exists',
        error: 'Conflict',
      },
    },
  })
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles()
    files: {
      eventBanner?: Express.Multer.File[];
      eventImages?: Express.Multer.File[];
      brandingLogo?: Express.Multer.File[];
    },
    @Req()
    req: ExpressRequest,
  ): Promise<Event> {
    try {
      this.logger.log(`Creating new event: ${createEventDto.title}`);

      // Manually parse stringified JSON fields from multipart/form-data
      const fieldsToParse = [
        'location',
        'virtualDetails',
        'agenda',
        'contactInfo',
        'logistics',
        'socialMedia',
        'branding',
        'sponsors',
        'partners',
        'faq',
      ];

      for (const field of fieldsToParse) {
        if (
          createEventDto[field] &&
          typeof createEventDto[field] === 'string'
        ) {
          try {
            (createEventDto as any)[field] = JSON.parse(
              createEventDto[field] as string,
            );
          } catch (e) {
            this.logger.warn(
              `Failed to parse JSON for field: ${field}. Value: ${createEventDto[field]}`,
            );
            throw new HttpException(
              `Invalid JSON format for field: ${field}`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      // Handle nested stringified JSON fields
      const dto = createEventDto as any;
      if (dto.logistics && typeof dto.logistics.accommodation === 'string') {
        try {
          dto.logistics.accommodation = JSON.parse(dto.logistics.accommodation);
        } catch (e) {
          this.logger.warn(
            `Failed to parse nested JSON for field: logistics.accommodation. Value: ${dto.logistics.accommodation}`,
          );
          throw new HttpException(
            'Invalid JSON format for field: logistics.accommodation',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (files.eventBanner?.[0]) {
        const result = await this.cloudinaryService.uploadFile(
          files.eventBanner[0],
          'events/banners',
        );
        createEventDto.eventBanner = result.secure_url;
      }

      if (files.eventImages?.length > 0) {
        const imageUrls = await Promise.all(
          files.eventImages.map((file) =>
            this.cloudinaryService.uploadFile(file, 'events/images'),
          ),
        );
        createEventDto.eventImages = imageUrls.map((r) => r.secure_url);
      }

      if (files.brandingLogo?.[0]) {
        const result = await this.cloudinaryService.uploadFile(
          files.brandingLogo[0],
          'events/branding',
        );
        if (createEventDto.branding) {
          createEventDto.branding.logoUrl = result.secure_url;
        } else {
          createEventDto.branding = { logoUrl: result.secure_url };
        }
      }
      const createdBy = (req.user as any).id;
      const event = await this.eventsService.create(createEventDto, createdBy);
      this.logger.log(`Event created successfully with ID: ${event.title}`);
      return event;
    } catch (error) {
      this.logger.error(
        `Failed to create event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all events with filtering and pagination',
    description:
      'Retrieves a paginated list of events with optional filtering by status, date range, and search.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of events per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter events by status',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter events starting from this date (ISO 8601)',
    example: '2025-07-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter events ending before this date (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search events by title or description',
    example: 'AGM',
  })
  @ApiQuery({
    name: 'organizer',
    required: false,
    type: String,
    description: 'Filter events by organizer ID',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events retrieved successfully',
    type: PaginatedEventsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid date format or pagination parameters',
        error: 'Bad Request',
      },
    },
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: EventStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('organizer') organizer?: string,
  ): Promise<any[]> {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

      this.logger.log(`Fetching events - Page: ${pageNum}, Limit: ${limitNum}`);

      const result = await this.eventsService.findAll({
        page: pageNum,
        limit: limitNum,
        status,
        startDate,
        endDate,
        search,
        organizer,
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get event statistics',
    description:
      'Retrieves comprehensive statistics about events including counts by status, attendance, etc.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event statistics retrieved successfully',
    schema: {
      example: {
        totalEvents: 25,
        activeEvents: 15,
        completedEvents: 8,
        cancelledEvents: 2,
        totalAttendees: 1250,
        averageAttendance: 50,
        upcomingEvents: 5,
      },
    },
  })
  async getEventStats(): Promise<any> {
    try {
      this.logger.log('Fetching event statistics');
      return await this.eventsService.getEventStats();
    } catch (error) {
      this.logger.error(
        `Failed to fetch event statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get('current-year')
  @Public()
  @ApiOperation({
    summary: 'Get current year event',
    description:
      'Retrieves detailed information about the current year event including agenda, speakers, and logistics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event retrieved successfully',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Current year event not found',
        error: 'Not Found',
      },
    },
  })
  async findCurrentYearEvent(): Promise<Event> {
    try {
      this.logger.log(`Fetching current year event`);

      const event = await this.eventsService.findCurrentYearEvent();

      return event;
    } catch (error) {
      this.logger.error(
        `Failed to fetch current year event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get event by ID',
    description:
      'Retrieves detailed information about a specific event including agenda, speakers, and logistics.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (MongoDB ObjectId)',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event retrieved successfully',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Event with ID 60f7b3b3b3b3b3b3b3b3b3b3 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid event ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid event ID format',
        error: 'Bad Request',
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Event> {
    try {
      // Validate MongoDB ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Fetching event with ID: ${id}`);
      const event = await this.eventsService.findOne(id);

      if (!event) {
        throw new HttpException(
          `Event with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return event;
    } catch (error) {
      this.logger.error(
        `Failed to fetch event ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update an existing event',
    description: 'Updates an existing event, with support for file uploads.',
  })
  @ApiParam({ name: 'id', description: 'ID of the event to update' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'eventBanner', maxCount: 1 },
      { name: 'eventImages', maxCount: 10 },
      { name: 'brandingLogo', maxCount: 1 },
    ]),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventBanner: {
          type: 'string',
          format: 'binary',
          description:
            'New banner image for the event. Replaces the existing one.',
          nullable: true,
        },
        eventImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'New gallery images. Replaces all existing ones.',
          nullable: true,
        },
        brandingLogo: {
          type: 'string',
          format: 'binary',
          description: 'New branding logo. Replaces the existing one.',
          nullable: true,
        },
        title: {
          type: 'string',
          example: 'Shelter Afrique AGM 2025',
          nullable: true,
        },
        description: {
          type: 'string',
          example: 'Annual General Meeting for Shelter Afrique stakeholders.',
          nullable: true,
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-15T09:00:00Z',
          nullable: true,
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-17T17:00:00Z',
          nullable: true,
        },
        category: {
          type: 'string',
          example: 'Annual General Meeting',
          nullable: true,
        },
        type: { type: 'string', example: 'Corporate', nullable: true },
        status: {
          type: 'string',
          enum: Object.values(EventStatus),
          example: EventStatus.PUBLISHED,
          nullable: true,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['AGM', 'Housing', 'Finance'],
          nullable: true,
        },
        location: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the location object. All fields are optional.',
          example:
            '{"venueName": "KICC", "address": {"street": "Harambee Avenue", "city": "Nairobi", "state": "Nairobi", "country": "Kenya", "postalCode": "00100"}, "coordinates": {"latitude": -1.286389, "longitude": 36.817223}}',
          nullable: true,
        },
        branding: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the branding object. All fields are optional.',
          example: '{"primaryColor": "#00447a", "secondaryColor": "#fdb913"}',
          nullable: true,
        },
        sponsors: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the sponsors array. All fields are optional.',
          example:
            '[{"name": "World Bank", "logoUrl": "http://example.com/logo.png", "website": "http://worldbank.org"}]',
          nullable: true,
        },
        speakers: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the speakers array. All fields are optional.',
          example:
            '[{"name": "Dr. Akinwumi Adesina", "title": "President, AfDB", "bio": "A brief bio...", "profileImageUrl": "http://example.com/profile.png"}]',
          nullable: true,
        },
        schedule: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the schedule array. All fields are optional.',
          example:
            '[{"day": "2025-07-15", "sessions": [{"time": "09:00-10:30", "title": "Opening Ceremony", "description": "Welcome remarks."}]}]',
          nullable: true,
        },
        registration: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the registration object. All fields are optional.',
          example:
            '{"required": true, "link": "http://example.com/register", "deadline": "2025-07-01T23:59:59Z"}',
          nullable: true,
        },
        contact: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the contact object. All fields are optional.',
          example:
            '{"name": "Event Support", "email": "support@shafagm.org", "phone": "+254700000000"}',
          nullable: true,
        },
        settings: {
          type: 'string',
          format: 'json',
          description:
            'A JSON string representing the settings object. All fields are optional.',
          example:
            '{"isPublic": true, "maxAttendees": 500, "allowWaitlist": true}',
          nullable: true,
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of attendee user IDs.',
          example: ['60d5ecf31c9d440000a1b2c3'],
          nullable: true,
        },
        isEmailSent: {
          type: 'boolean',
          description:
            'Flag to indicate if the event notification email has been sent.',
          example: false,
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFiles()
    files: {
      eventBanner?: Express.Multer.File[];
      eventImages?: Express.Multer.File[];
      brandingLogo?: Express.Multer.File[];
    },
  ): Promise<Event> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingEvent = await this.eventsService.findOne(id);
      if (!existingEvent) {
        throw new HttpException(
          `Event with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Manually parse stringified JSON fields from multipart/form-data
      const fieldsToParse = [
        'location',
        'virtualDetails',
        'agenda',
        'contactInfo',
        'logistics',
        'socialMedia',
        'branding',
        'sponsors',
        'partners',
        'faq',
        'speakers',
        'schedule',
        'registration',
        'contact',
        'settings',
      ];

      for (const field of fieldsToParse) {
        if (
          updateEventDto[field] &&
          typeof updateEventDto[field] === 'string'
        ) {
          try {
            (updateEventDto as any)[field] = JSON.parse(
              updateEventDto[field] as string,
            );
          } catch (e) {
            this.logger.warn(
              `Failed to parse JSON for field: ${field}. Value: ${updateEventDto[field]}`,
            );
            throw new HttpException(
              `Invalid JSON format for field: ${field}`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      // Handle nested stringified JSON fields
      const dto = updateEventDto as any;
      if (dto.logistics && typeof dto.logistics.accommodation === 'string') {
        try {
          dto.logistics.accommodation = JSON.parse(dto.logistics.accommodation);
        } catch (e) {
          this.logger.warn(
            `Failed to parse nested JSON for field: logistics.accommodation. Value: ${dto.logistics.accommodation}`,
          );
          throw new HttpException(
            'Invalid JSON format for field: logistics.accommodation',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Handle event banner update
      if (files.eventBanner?.[0]) {
        if (existingEvent.eventBanner) {
          const publicId = this.getPublicIdFromUrl(existingEvent.eventBanner);
          if (publicId) await this.cloudinaryService.deleteFile(publicId);
        }
        const result = await this.cloudinaryService.uploadFile(
          files.eventBanner[0],
          'events/banners',
        );
        updateEventDto.eventBanner = result.secure_url;
      }

      // Handle event images update
      if (files.eventImages?.length > 0) {
        if (existingEvent.eventImages && existingEvent.eventImages.length > 0) {
          await Promise.all(
            existingEvent.eventImages.map(async (url) => {
              const publicId = this.getPublicIdFromUrl(url);
              if (publicId) await this.cloudinaryService.deleteFile(publicId);
            }),
          );
        }
        const imageUrls = await Promise.all(
          files.eventImages.map((file) =>
            this.cloudinaryService.uploadFile(file, 'events/images'),
          ),
        );
        updateEventDto.eventImages = imageUrls.map((r) => r.secure_url);
      }

      // Handle branding logo update
      if (files.brandingLogo?.[0]) {
        if (existingEvent.branding?.logoUrl) {
          const publicId = this.getPublicIdFromUrl(
            existingEvent.branding.logoUrl,
          );
          if (publicId) await this.cloudinaryService.deleteFile(publicId);
        }
        const result = await this.cloudinaryService.uploadFile(
          files.brandingLogo[0],
          'events/branding',
        );
        if (!updateEventDto.branding) {
          updateEventDto.branding = {};
        }
        updateEventDto.branding.logoUrl = result.secure_url;
      }

      this.logger.log(`Updating event with ID: ${id}`);
      const updatedEvent = await this.eventsService.update(id, updateEventDto);

      this.logger.log(`Event ${id} updated successfully`);
      return updatedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to update event ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getPublicIdFromUrl(url: string): string {
    try {
      const uploadMarker = '/upload/';
      const afterUpload = url.substring(
        url.indexOf(uploadMarker) + uploadMarker.length,
      );
      const pathWithoutVersion = afterUpload.substring(
        afterUpload.indexOf('/') + 1,
      );
      const publicId = pathWithoutVersion.substring(
        0,
        pathWithoutVersion.lastIndexOf('.'),
      );
      return publicId;
    } catch (error) {
      this.logger.error(
        `Failed to extract public ID from URL: ${url}`,
        error.stack,
      );
      return '';
    }
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cancel event',
    description:
      'Cancels an event and provides a cancellation reason. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (MongoDB ObjectId)',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @ApiBody({ type: CancelEventDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event cancelled successfully',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Event cannot be cancelled (already completed or cancelled)',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot cancel an event that has already ended',
        error: 'Bad Request',
      },
    },
  })
  async cancelEvent(
    @Param('id') id: string,
    @Body() cancelEventDto: CancelEventDto,
  ): Promise<Event> {
    try {
      // Validate MongoDB ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Cancelling event with ID: ${id}`);
      const cancelledEvent = await this.eventsService.cancelEvent(
        id,
        cancelEventDto.cancellationReason,
      );

      if (!cancelledEvent) {
        throw new HttpException(
          `Event with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Event ${id} cancelled successfully`);
      return cancelledEvent;
    } catch (error) {
      this.logger.error(
        `Failed to cancel event ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Delete event (Hard delete)',
    description:
      'Permanently deletes an event from the database. This action cannot be undone. Use with caution.',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID (MongoDB ObjectId)',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event deleted successfully',
    schema: {
      example: {
        message: 'Event deleted successfully',
        deletedEventId: '60f7b3b3b3b3b3b3b3b3b3b3',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete event with active registrations',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Cannot delete event with active registrations. Cancel the event first.',
        error: 'Bad Request',
      },
    },
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ message: string; deletedEventId: string }> {
    try {
      // Validate MongoDB ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Deleting event with ID: ${id}`);
      const deleted = await this.eventsService.remove(id);

      if (!deleted) {
        throw new HttpException(
          `Event with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Event ${id} deleted successfully`);
      return {
        message: 'Event deleted successfully',
        deletedEventId: id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete event ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
