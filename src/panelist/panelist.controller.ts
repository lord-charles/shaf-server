import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { PanelistService } from './panelist.service';
import {
  ConfirmPanelistDto,
  CreatePanelistDto,
  PanelistResponseDto,
  UpdatePanelistDto,
} from './panelist.dto';
import {
  ExpertiseArea,
  OrganizationType,
  PanelistRole,
  ParticipationMode,
} from './panelist.schema';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { CloudinaryService } from '../modules/cloudinary/cloudinary.service';

@ApiTags('Panelists')
@Controller('panelists')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PanelistController {
  private readonly logger = new Logger(PanelistController.name);

  constructor(
    private readonly panelistService: PanelistService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Creates a new panelist
  @Post()
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException(
              'Only image files are allowed for profile picture',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new panelist with profile picture upload',
    description: 'Registers a new panelist for the Shelter Afrique AGM event',
  })
  @ApiBody({
    description: 'Multipart form data for creating a panelist.',
    schema: {
      type: 'object',
      required: [
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'jobTitle',
        'organization',
        'organizationType',
        'country',
        'city',
        'role',
        'expertiseAreas',
        'biography',
        'participationMode',
        'eventYear',
      ],
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (JPEG, PNG, max 5MB)',
        },
        firstName: { type: 'string', example: 'Dr. Amina' },
        lastName: { type: 'string', example: 'Hassan' },
        email: {
          type: 'string',
          format: 'email',
          example: 'amina.hassan@centralbank.go.ke',
        },
        phoneNumber: { type: 'string', example: '+254712345678' },
        eventYear: { type: 'number', example: 2025 },
        jobTitle: { type: 'string', example: 'Director of Housing Finance' },
        organization: { type: 'string', example: 'Central Bank of Kenya' },
        organizationType: {
          type: 'string',
          enum: Object.values(OrganizationType),
          example: OrganizationType.GOVERNMENT,
        },
        country: { type: 'string', example: 'Kenya' },
        city: { type: 'string', example: 'Nairobi' },
        role: {
          type: 'string',
          enum: Object.values(PanelistRole),
          example: PanelistRole.KEYNOTE_SPEAKER,
        },
        expertiseAreas: {
          type: 'array',
          items: { type: 'string', enum: Object.values(ExpertiseArea) },
          example: [
            ExpertiseArea.HOUSING_FINANCE,
            ExpertiseArea.POLICY_REGULATION,
          ],
        },
        biography: {
          type: 'string',
          example:
            'Dr. Amina Hassan is a seasoned financial expert with over 15 years of experience...',
        },
        participationMode: {
          type: 'string',
          enum: Object.values(ParticipationMode),
          example: ParticipationMode.IN_PERSON,
        },
        linkedinProfile: {
          type: 'string',
          format: 'uri',
          example: 'https://linkedin.com/in/amina-hassan',
        },
        companyWebsite: {
          type: 'string',
          format: 'uri',
          example: 'https://www.centralbank.go.ke',
        },
        specialRequirements: {
          type: 'string',
          example:
            'Requires wheelchair accessible venue and dietary restrictions',
        },
        sessionTitle: {
          type: 'string',
          example:
            'Innovative Housing Finance Models for Affordable Housing in Africa',
        },
        sessionDescription: {
          type: 'string',
          example:
            'This session will explore cutting-edge financing mechanisms...',
        },
        sessionDateTime: {
          type: 'string',
          format: 'date-time',
          example: '2024-09-15T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Panelist successfully created',
    type: PanelistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Panelist with email already exists',
  })
  async create(
    @Body() createPanelistDto: CreatePanelistDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ): Promise<any> {
    this.logger.log(
      `Received request to create panelist: ${createPanelistDto.email}`,
    );

    if (profilePicture) {
      const result = await this.cloudinaryService.uploadFile(
        profilePicture,
        'panelists/profile-pictures',
      );
      createPanelistDto.profileImageUrl = result.secure_url;
    }

    return await this.panelistService.create(createPanelistDto);
  }

  // Retrieves all panelists with filtering and pagination
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all panelists',
    description:
      'Retrieves a paginated list of panelists with optional filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: PanelistRole,
    description: 'Filter by panelist role',
  })
  @ApiQuery({
    name: 'organizationType',
    required: false,
    enum: OrganizationType,
    description: 'Filter by organization type',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    type: String,
    description: 'Filter by country',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'eventYear',
    required: false,
    type: Number,
    description: 'Filter by event year',
  })
  @ApiQuery({
    name: 'isConfirmed',
    required: false,
    type: Boolean,
    description: 'Filter by confirmation status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of panelists retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        panelists: {
          type: 'array',
          items: { $ref: '#/components/schemas/PanelistResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: PanelistRole,
    @Query('organizationType') organizationType?: OrganizationType,
    @Query('country') country?: string,
    @Query('isActive') isActive?: boolean,
    @Query('eventYear') eventYear?: number,
    @Query('isConfirmed') isConfirmed?: boolean,
  ) {
    this.logger.log(`Received request to fetch all panelists with filters`);
    return await this.panelistService.findAll(
      page,
      limit,
      role,
      organizationType,
      country,
      isActive,
      eventYear,
      isConfirmed,
    );
  }

  // Gets panelist statistics
  @Get('statistics')
  @Public()
  @ApiOperation({
    summary: 'Get panelist statistics',
    description:
      'Retrieves statistical data about panelists for dashboard and reporting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        confirmed: { type: 'number' },
        pending: { type: 'number' },
        byRole: { type: 'object' },
        byOrganizationType: { type: 'object' },
        byParticipationMode: { type: 'object' },
        byCountry: { type: 'object' },
      },
    },
  })
  async getStatistics() {
    this.logger.log('Received request for panelist statistics');
    return await this.panelistService.getStatistics();
  }

  // Searches panelists
  @Get('search')
  @Public()
  @ApiOperation({
    summary: 'Search panelists',
    description:
      'Searches panelists by name, organization, job title, or expertise areas',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search term (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (default: 20, max: 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: [PanelistResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search term (too short)',
  })
  async search(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    this.logger.log(`Received search request for: "${searchTerm}"`);
    return await this.panelistService.search(searchTerm, limit);
  }

  // Retrieves a single panelist by ID
  @Get(':id')
  @ApiOperation({
    summary: 'Get panelist by ID',
    description: 'Retrieves a specific panelist by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Panelist ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Panelist retrieved successfully',
    type: PanelistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Panelist not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  async findOne(@Param('id') id: string): Promise<any> {
    this.logger.log(`Received request to fetch panelist: ${id}`);
    return await this.panelistService.findOne(id);
  }

  // Updates an existing panelist
  @Patch(':id')
  @ApiOperation({
    summary: 'Update panelist',
    description: 'Updates an existing panelist with partial data',
  })
  @ApiParam({ name: 'id', description: 'Panelist ID' })
  @ApiBody({ type: UpdatePanelistDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Panelist updated successfully',
    type: PanelistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Panelist not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use by another panelist',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or ID format',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePanelistDto: UpdatePanelistDto,
  ): Promise<any> {
    this.logger.log(`Received request to update panelist: ${id}`);
    return await this.panelistService.update(id, updatePanelistDto);
  }

  // Confirms or unconfirms panelist participation
  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'Confirm panelist participation',
    description:
      "Confirms or unconfirms a panelist's participation in the AGM event",
  })
  @ApiParam({ name: 'id', description: 'Panelist ID' })
  @ApiBody({ type: ConfirmPanelistDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Panelist confirmation status updated successfully',
    type: PanelistResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Panelist not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  async confirmParticipation(
    @Param('id') id: string,
    @Body() confirmDto: ConfirmPanelistDto,
  ): Promise<any> {
    this.logger.log(
      `Received request to confirm panelist participation: ${id}`,
    );
    return await this.panelistService.confirmParticipation(id, confirmDto);
  }

  // Deactivates a panelist (soft delete)
  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate panelist',
    description: 'Soft deletes a panelist by setting their status to inactive',
  })
  @ApiParam({ name: 'id', description: 'Panelist ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Panelist deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Panelist not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Received request to deactivate panelist: ${id}`);
    await this.panelistService.remove(id);
    return { message: 'Panelist deactivated successfully' };
  }
}
