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
} from '@nestjs/common';
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
import { Delegate } from './delegates.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@ApiTags('Delegates')
@ApiBearerAuth()
@Controller('delegates')
export class DelegatesController {
  private readonly logger = new Logger(DelegatesController.name);
  constructor(
    private readonly delegatesService: DelegatesService,
    private readonly badgeService: BadgeService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({
    summary: 'Create a new delegate',
    description:
      'Creates a new delegate with comprehensive validation and error handling',
  })
  @ApiCreatedResponse({
    description: 'Delegate successfully created',
    type: Delegate,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Validation failed: email must be a valid email address',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Delegate with the same email already exists!',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Delegate with email john.doe@example.com and event year 2025 already exists',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Failed to create delegate' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  })
  @ApiBody({ type: CreateDelegateDto })
  async create(
    @Body() createDelegateDto: CreateDelegateDto,
  ): Promise<Delegate> {
    this.logger.log(
      `POST /delegates - Creating delegate: ${createDelegateDto.email}`,
    );
    return await this.delegatesService.create(createDelegateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
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
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid event ID format' },
        error: { type: 'string', example: 'Bad Request' },
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
  ) {
    this.logger.log(`GET /delegates - Page: ${page}, Limit: ${limit}`);
    return await this.delegatesService.findAll(
      page,
      limit,
      eventId,
      delegateType,
      attendanceMode,
    );
  }

  // ===========================================================================
  // ADMIN ROUTES
  // ===========================================================================

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
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
    @Req() req: ExpressRequest,
  ): Promise<Delegate> {
    const userId = (req.user as any).id;
    this.logger.log(`POST /delegates/${id}/approve - Approving delegate`);
    return this.delegatesService.approve(id, approveDto, userId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
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
    @Req() req: ExpressRequest,
  ): Promise<Delegate> {
    const userId = (req.user as any).id;
    this.logger.log(`POST /delegates/${id}/reject - Rejecting delegate`);
    return this.delegatesService.reject(id, rejectDto, userId);
  }

  @Post(':id/check-in')
  @UseGuards(JwtAuthGuard)
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
    @Req() req: ExpressRequest,
  ): Promise<Delegate> {
    const userId = (req.user as any).id;
    this.logger.log(`POST /delegates/${id}/check-in - Checking in delegate`);
    return this.delegatesService.checkIn(id, checkInDto, userId);
  }

  @Get(':id/badge')
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
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
}
