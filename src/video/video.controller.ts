import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import {
  CreateVideoDto,
  UpdateVideoDto,
  VideoQueryDto,
} from './dto/create-video.dto';
import { Video } from './entities/video.entity';
import { VideoService } from './video.service';
import { Public } from 'src/modules/auth/decorators/public.decorator';

@ApiTags('Videos')
@Controller('videos')
@ApiBearerAuth()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload a new video',
    description:
      'Create a new video entry for the Shelter Afrique AGM event using a YouTube link. The video will be pending approval by default.',
  })
  @ApiCreatedResponse({
    description: 'Video uploaded successfully',
    type: Video,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or YouTube URL already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'A video with this YouTube URL already exists',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBody({
    type: CreateVideoDto,
    description: 'Video data to upload',
  })
  async create(@Body() createVideoDto: CreateVideoDto) {
    return this.videoService.create(createVideoDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all videos',
    description:
      'Retrieve a paginated list of videos with optional filtering and sorting capabilities.',
  })
  @ApiOkResponse({
    description: 'Videos retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        videos: {
          type: 'array',
          items: { $ref: '#/components/schemas/Video' },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 15 },
      },
    },
  })
  async findAll(@Query() query: VideoQueryDto) {
    return this.videoService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get video by ID',
    description: 'Retrieve a specific video by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Video ID',
    example: '64a1b2c3d4e5f6789012345a',
  })
  @ApiOkResponse({
    description: 'Video found',
    type: Video,
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Video not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update video',
    description:
      'Update video information. Some fields may require admin privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'Video ID',
    example: '64a1b2c3d4e5f6789012345a',
  })
  @ApiOkResponse({
    description: 'Video updated successfully',
    type: Video,
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  @ApiBody({
    type: UpdateVideoDto,
    description: 'Video data to update',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    return this.videoService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete video',
    description: 'Delete a video entry. This action requires admin privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'Video ID',
    example: '64a1b2c3d4e5f6789012345a',
  })
  @ApiOkResponse({
    description: 'Video deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin privileges required',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }
}
