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
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  Logger,
  Header,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { DelegatesService } from './delegate.service';
import { BadgeService } from '../badge/badge.service';
import {
  CreateDelegateDto,
  UpdateDelegateDto,
} from './dto/create-delegate.dto';
import {
  ApproveDelegateDto,
  RejectDelegateDto,
  CheckInDelegateDto,
} from './dto/admin-delegate.dto';
import {
  AttendanceMode,
  Delegate,
  DelegateType,
  IdentificationType,
  Title,
} from './delegates.schema';
import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { LoginUserDto } from '../auth/dto/login.dto';
import { AuthResponse } from '../auth/interfaces/auth.interface';
import { Request as ExpressRequest } from 'express';
import {
  ConfirmPasswordResetDto,
  RequestPasswordResetDto,
} from '../auth/dto/reset-password.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterPushTokenDto } from '../auth/dto/register-push-token.dto';
import { NotificationService } from '../notifications/services/notification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import * as sharp from 'sharp';

@ApiTags('Delegates')
@ApiBearerAuth()
@Controller('delegates')
export class DelegatesController {
  private readonly logger = new Logger(DelegatesController.name);
  constructor(
    private readonly delegatesService: DelegatesService,
    private readonly badgeService: BadgeService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'document', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit to accommodate larger raw images
        },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'profilePicture') {
            const allowedMimes = [
              'image/jpeg',
              'image/png',
              'image/jpg',
              'image/gif',
              'image/heic',
              'image/heif',
            ];
            if (allowedMimes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(
                  'Only image files (jpg, png, gif, heic) are allowed for profile picture',
                ),
                false,
              );
            }
          } else if (file.fieldname === 'document') {
            const allowedMimes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'image/jpeg',
              'image/png',
            ];
            if (allowedMimes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(
                new BadRequestException(
                  'Only PDF, DOC, DOCX, JPG, PNG files are allowed for documents',
                ),
                false,
              );
            }
          } else {
            cb(null, true);
          }
        },
      },
    ),
  )
  @ApiOperation({
    summary: 'Create a new delegate with file uploads',
    description: `Creates a new delegate with file uploads support. All fields are required unless marked optional.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multipart form data for creating a delegate.',
    schema: {
      type: 'object',
      required: [
        'title',
        'firstName',
        'lastName',
        'email',
        'eventYear',
        'phoneNumber',
        'nationality',
        'delegateType',
        'attendanceMode',
        'identification',
        'languagesSpoken',
        // 'eventId',
        'address',
        'emergencyContact',
        'password',
      ],
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture of the delegate (JPG, PNG, GIF, HEIC).',
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Identification document (PDF, DOC, DOCX, JPG, PNG).',
        },
        title: { type: 'string', enum: Object.values(Title) },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        eventYear: { type: 'number' },
        phoneNumber: { type: 'string' },
        nationality: { type: 'string' },
        delegateType: { type: 'string', enum: Object.values(DelegateType) },
        attendanceMode: {
          type: 'string',
          enum: Object.values(AttendanceMode),
        },
        identification: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: Object.values(IdentificationType),
            },
            number: { type: 'string' },
          },
        },
        languagesSpoken: { type: 'array', items: { type: 'string' } },
        // eventId: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            postalCode: { type: 'string' },
          },
        },
        emergencyContact: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationship: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        hasAccommodation: { type: 'boolean', default: false },
        accommodationDetails: {
          type: 'object',
          properties: {
            hotelName: { type: 'string', example: 'Nairobi Serena Hotel' },
            checkIn: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-15T14:00:00.000Z',
            },
            checkOut: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-18T11:00:00.000Z',
            },
            roomPreference: {
              type: 'string',
              example: 'Non-smoking, single bed',
            },
          },
        },
        requiresVisa: { type: 'boolean', default: false },
        visaStatus: { type: 'string', example: 'Approved' },
        arrivalDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-15T10:00:00.000Z',
        },
        departureDate: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-18T15:00:00.000Z',
        },
        flightDetails: {
          type: 'object',
          properties: {
            arrivalFlight: { type: 'string', example: 'KQ101' },
            departureFlight: { type: 'string', example: 'KQ102' },
          },
        },
        socialMedia: {
          type: 'object',
          properties: {
            linkedin: {
              type: 'string',
              format: 'uri',
              example: 'https://linkedin.com/in/johndoe',
            },
            twitter: {
              type: 'string',
              format: 'uri',
              example: 'https://twitter.com/johndoe',
            },
          },
        },
        bio: { type: 'string', example: 'Experienced banking executive...' },
        consentToPhotography: { type: 'boolean', default: true },
        consentToDataProcessing: { type: 'boolean', default: true },
        password: {
          type: 'string',
          format: 'password',
          example: 'h$shedP@sswOrd',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Delegate successfully created',
    type: Delegate,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiConflictResponse({
    description: 'Delegate with the same email already exists!',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async create(
    @Body() createDelegateDto: CreateDelegateDto,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ): Promise<Delegate> {
    this.logger.log(
      `POST /delegates - Creating delegate: ${createDelegateDto.email}`,
    );

    // Manually parse nested JSON string fields from multipart/form-data
    const fieldsToParse = [
      'identification',
      'address',
      'emergencyContact',
      'accommodationDetails',
      'flightDetails',
      'socialMedia',
    ];

    for (const field of fieldsToParse) {
      if (
        createDelegateDto[field] &&
        typeof createDelegateDto[field] === 'string'
      ) {
        try {
          createDelegateDto[field] = JSON.parse(
            createDelegateDto[field] as string,
          );
        } catch {
          throw new BadRequestException(`Invalid JSON format for ${field}.`);
        }
      }
    }

    if (files?.profilePicture?.[0]) {
      let profilePictureFile = files.profilePicture[0];
      const heicMimes = ['image/heic', 'image/heif'];

      if (heicMimes.includes(profilePictureFile.mimetype)) {
        this.logger.log(
          `Converting HEIC image to JPEG for ${createDelegateDto.email}`,
        );
        const jpegBuffer = await sharp(profilePictureFile.buffer)
          .jpeg({ quality: 90 })
          .toBuffer();

        profilePictureFile = {
          ...profilePictureFile,
          buffer: jpegBuffer,
          mimetype: 'image/jpeg',
          originalname: `${profilePictureFile.originalname.split('.')[0]}.jpeg`,
        };
      }

      const result = await this.cloudinaryService.uploadFile(
        profilePictureFile,
        'delegates/profile-pictures',
      );
      createDelegateDto.profilePicture = result.secure_url;
    }

    if (files?.document?.[0]) {
      const result = await this.cloudinaryService.uploadFile(
        files.document[0],
        'delegates/documents',
      );
      // Ensure identification object exists with required fields
      if (!createDelegateDto.identification) {
        throw new BadRequestException(
          'Identification details are required when uploading a document',
        );
      }
      createDelegateDto.identification.documentUrl = result.secure_url;
    }

    return await this.delegatesService.create(createDelegateDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all delegates',
    description:
      'Retrieves all delegates with optional pagination and filtering',
  })
  @ApiOkResponse({
    description: 'Delegates successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        delegates: {
          type: 'array',
          items: { $ref: '#/components/schemas/Delegate' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'eventId',
    required: false,
    type: String,
    description: 'Filter by event ID',
  })
  @ApiQuery({
    name: 'delegateType',
    required: false,
    type: String,
    description: 'Filter by delegate type',
  })
  @ApiQuery({
    name: 'attendanceMode',
    required: false,
    type: String,
    description: 'Filter by attendance mode',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('eventId') eventId?: string,
    @Query('delegateType') delegateType?: string,
    @Query('attendanceMode') attendanceMode?: string,
    @Query('year') year?: number,
  ) {
    this.logger.log(`GET /delegates - Page: ${page}, Limit: ${limit}`);
    return await this.delegatesService.findAll(
      page,
      limit,
      eventId,
      delegateType,
      attendanceMode,
      year,
    );
  }

  // ===========================================================================
  // ADMIN ROUTES
  // ===========================================================================

  @Post(':id/approve')
  @Public()
  @ApiOperation({ summary: 'Approve a delegate registration' })
  @ApiParam({ name: 'id', description: 'Delegate ID' })
  @ApiOkResponse({
    description: 'Delegate approved successfully',
    type: Delegate,
  })
  @ApiNotFoundResponse({ description: 'Delegate not found' })
  @ApiBadRequestResponse({ description: 'Delegate already approved' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveDelegateDto,
  ): Promise<Delegate> {
    this.logger.log(`POST /delegates/${id}/approve - Approving delegate`);
    return this.delegatesService.approve(id, approveDto, approveDto.approvedBy);
  }

  @Post(':id/reject')
  @Public()
  @ApiOperation({ summary: 'Reject a delegate registration' })
  @ApiParam({ name: 'id', description: 'Delegate ID' })
  @ApiOkResponse({
    description: 'Delegate rejected successfully',
    type: Delegate,
  })
  @ApiNotFoundResponse({ description: 'Delegate not found' })
  @ApiBadRequestResponse({ description: 'Delegate already rejected' })
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectDelegateDto,
  ): Promise<Delegate> {
    this.logger.log(`POST /delegates/${id}/reject - Rejecting delegate`);
    return this.delegatesService.reject(id, rejectDto, rejectDto.rejectedBy);
  }

  @Post(':id/check-in')
  @Public()
  @ApiOperation({ summary: 'Check in a delegate' })
  @ApiParam({ name: 'id', description: 'Delegate ID' })
  @ApiOkResponse({
    description: 'Delegate checked in successfully',
    type: Delegate,
  })
  @ApiNotFoundResponse({ description: 'Delegate not found' })
  @ApiBadRequestResponse({ description: 'Delegate cannot be checked in' })
  async checkIn(
    @Param('id') id: string,
    @Body() checkInDto: CheckInDelegateDto,
  ): Promise<Delegate> {
    this.logger.log(`POST /delegates/${id}/check-in - Checking in delegate`);
    return this.delegatesService.checkIn(
      id,
      checkInDto,
      checkInDto.checkedInBy,
    );
  }

  @Get(':id/badge')
  @Public()
  @ApiOperation({ summary: 'Download a delegate badge' })
  @ApiParam({ name: 'id', description: 'Delegate ID' })
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'attachment; filename=badge.png')
  async downloadBadge(@Param('id') id: string, @Res() res) {
    const delegate = await this.delegatesService.findOneDocument(id);
    const badgeBuffer = await this.badgeService.generateBadge(delegate);
    res.send(badgeBuffer);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get delegate statistics',
    description: 'Retrieves comprehensive statistics about delegates',
  })
  @ApiOkResponse({
    description: 'Statistics successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        byType: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { SHAREHOLDER: 75, PROXY: 50, OBSERVER: 25 },
        },
        byAttendanceMode: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { PHYSICAL: 100, VIRTUAL: 50 },
        },
        byNationality: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { Kenyan: 80, Nigerian: 40, 'South African': 30 },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid event ID format',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiQuery({
    name: 'eventId',
    required: false,
    type: String,
    description: 'Filter statistics by event ID',
  })
  async getStatistics(@Query('eventId') eventId?: string) {
    this.logger.log(
      `GET /delegates/statistics - Event ID: ${eventId || 'all'}`,
    );
    return await this.delegatesService.getStatistics(eventId);
  }

  @Get('email/:email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get delegate by email',
    description: 'Retrieves a specific delegate by their email address',
  })
  @ApiOkResponse({
    description: 'Delegate successfully retrieved',
    type: Delegate,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @ApiNotFoundResponse({
    description: 'Delegate not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Delegate with email john.doe@example.com not found',
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'email',
    type: String,
    description: 'Delegate email address',
  })
  async findByEmail(@Param('email') email: string): Promise<Delegate> {
    this.logger.log(`GET /delegates/email/${email}`);
    return await this.delegatesService.findByEmail(email);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get delegate by ID',
    description: 'Retrieves a specific delegate by their unique ID',
  })
  @ApiOkResponse({
    description: 'Delegate successfully retrieved',
    type: Delegate,
  })
  @ApiBadRequestResponse({
    description: 'Invalid delegate ID format',
  })
  @ApiNotFoundResponse({
    description: 'Delegate not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Delegate ID (MongoDB ObjectId)',
  })
  async findOne(@Param('id') id: string): Promise<Delegate> {
    this.logger.log(`GET /delegates/${id}`);
    return await this.delegatesService.findOne(id);
  }

  @Patch(':id')
  @Public()
  @ApiOperation({
    summary: 'Update delegate',
    description: 'Updates an existing delegate with partial data',
  })
  @ApiOkResponse({
    description: 'Delegate successfully updated',
    type: Delegate,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or delegate ID format',
  })
  @ApiNotFoundResponse({
    description: 'Delegate not found',
  })
  @ApiConflictResponse({
    description: 'Email conflict with another delegate',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Delegate ID (MongoDB ObjectId)',
  })
  @ApiBody({ type: UpdateDelegateDto })
  async update(
    @Param('id') id: string,
    @Body() updateDelegateDto: UpdateDelegateDto,
  ): Promise<Delegate> {
    this.logger.log(`PATCH /delegates/${id}`);
    return await this.delegatesService.update(id, updateDelegateDto);
  }

  @Delete('delete-account/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete delegate',
    description: 'Permanently deletes a delegate from the system',
  })
  @ApiOkResponse({
    description: 'Delegate successfully deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Delegate successfully deleted' },
        deletedId: { type: 'string', example: '60d5ecb74f4d2c001f5e4b2a' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid delegate ID format',
  })
  @ApiNotFoundResponse({
    description: 'Delegate not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Delegate ID (MongoDB ObjectId)',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ message: string; deletedId: string }> {
    this.logger.log(`DELETE /delegates/${id}`);
    return await this.delegatesService.remove(id);
  }

  //auth
  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate delegate',
    description: 'Login with email and password to receive access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
        token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or inactive account',
  })
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: ExpressRequest,
  ): Promise<AuthResponse> {
    return this.delegatesService.login(loginUserDto, req);
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'If your email is registered, you will receive password reset instructions.',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or error processing request.',
  })
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
    @Req() req: ExpressRequest,
  ): Promise<{ message: string }> {
    return this.delegatesService.requestPasswordReset(
      requestPasswordResetDto,
      req,
    );
  }

  @Public()
  @Post('confirm-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been successfully reset.',
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token, or error processing request.',
  })
  async confirmPasswordReset(
    @Body() confirmPasswordResetDto: ConfirmPasswordResetDto,
    @Req() req: ExpressRequest,
  ): Promise<{ message: string }> {
    return this.delegatesService.confirmPasswordReset(
      confirmPasswordResetDto,
      req,
    );
  }

  @Post('/delegate/:id/push-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register Expo push token for the authenticated user',
    description:
      'Saves the Expo push notification token for the currently logged-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Push token registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid push token provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async registerPushToken(
    @Param('id') id: string,
    @Body() registerPushTokenDto: RegisterPushTokenDto,
  ) {
    const result = await this.notificationService.saveDelegatePushToken(
      id,
      registerPushTokenDto.token,
    );
    if (!result) {
      return {
        success: false,
        message:
          'Failed to register push token. Invalid token or user not found.',
      };
    }
    return { success: true, message: 'Push token registered successfully.' };
  }
}
