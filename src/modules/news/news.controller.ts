import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ValidationPipe,
  UsePipes,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiProduces,
  getSchemaPath,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateNewsDto,
  UpdateNewsDto,
  SwaggerExamples,
} from './dto/create.dto';
import { News, NewsStatus, NewsCategory, NewsPriority } from './schema';
import { NewsQuery, NewsService, PaginatedResponse } from './new.service';
import { Public } from '../auth/decorators/public.decorator';

// Define interfaces for standardized responses
interface ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

interface BulkUpdateRequestDto {
  ids: string[];
  updateData: Partial<UpdateNewsDto>;
}

@ApiTags('News Management')
@Controller('news')
@ApiBearerAuth()
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(private readonly newsService: NewsService) {}

  /**
   * Create a new news article
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new news article',
    description:
      'Creates a new news article with the provided information. Supports multilingual content, media attachments, and various publication statuses.',
  })
  @ApiBody({
    type: CreateNewsDto,
    description: 'News article data',
    examples: {
      pressRelease: SwaggerExamples.createPressRelease,
      corporateNews: SwaggerExamples.createCorporateNews,
      eventNews: SwaggerExamples.createEventNews,
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'News article created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News article created successfully',
        },
        data: { $ref: getSchemaPath(News) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        error: {
          type: 'string',
          example: 'Title is required and must be at least 10 characters long',
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'News with the same slug already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Conflict error' },
        error: {
          type: 'string',
          example: 'News with slug "example-slug" already exists',
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createNewsDto: CreateNewsDto,
    @Req() request: Request,
  ): Promise<ApiResponseDto<News>> {
    try {
      const userId = request.user?.['id'] || request.user?.['sub'];
      const news = await this.newsService.create(createNewsDto, userId);

      this.logger.log(`News article created: ${news.title} (ID: ${news._id})`);

      return {
        success: true,
        message: 'News article created successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to create news article', error);
      throw error;
    }
  }

  /**
   * Get all news articles with filtering and pagination
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Retrieve news articles',
    description:
      'Fetches news articles with support for pagination, filtering by various criteria, and full-text search capabilities.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: NewsStatus,
    description: 'Filter by publication status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: NewsCategory,
    description: 'Filter by news category',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: NewsPriority,
    description: 'Filter by priority level',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter featured articles only',
  })
  @ApiQuery({
    name: 'pinned',
    required: false,
    type: Boolean,
    description: 'Filter pinned articles only',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Full-text search query',
    example: 'affordable housing Kenya',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags (comma-separated)',
    example: 'housing,kenya,affordable',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Filter by author name',
    example: 'Dr. Kingsley Mulingwa',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (default: publishedAt)',
    example: 'publishedAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter articles from this date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter articles until this date',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News articles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News articles retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: getSchemaPath(News) } },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 150 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 15 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: NewsStatus,
    @Query('category') category?: NewsCategory,
    @Query('priority') priority?: NewsPriority,
    @Query('featured', new ParseBoolPipe({ optional: true }))
    featured?: boolean,
    @Query('pinned', new ParseBoolPipe({ optional: true })) pinned?: boolean,
    @Query('search') search?: string,
    @Query(
      'tags',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    tags?: string[],
    @Query('author') author?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponseDto<PaginatedResponse<News>>> {
    try {
      // Validate limit to prevent excessive requests
      const validatedLimit =
        limit && limit <= 100 ? limit : limit && limit > 100 ? 100 : undefined;

      const query: NewsQuery = {
        page,
        limit: validatedLimit,
        status,
        category,
        priority,
        featured,
        pinned,
        search,
        tags,
        author,
        sortBy,
        sortOrder,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      const result = await this.newsService.findAll(query);

      this.logger.log(
        `Retrieved ${result.data.length} news articles (Page ${result.pagination.page}/${result.pagination.totalPages})`,
      );

      return {
        success: true,
        message: 'News articles retrieved successfully',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve news articles', error);
      throw error;
    }
  }

  /**
   * Get a specific news article by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get news article by ID',
    description:
      'Retrieves a specific news article by its unique identifier. Automatically increments view count for analytics.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the news article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News article retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News article retrieved successfully',
        },
        data: { $ref: getSchemaPath(News) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Resource not found' },
        error: {
          type: 'string',
          example: 'News article with ID 507f1f77bcf86cd799439011 not found',
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid request' },
        error: { type: 'string', example: 'Invalid news ID format' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<News>> {
    try {
      const news = await this.newsService.findOne(id);

      this.logger.log(`News article retrieved: ${news.title} (ID: ${id})`);

      return {
        success: true,
        message: 'News article retrieved successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve news article with ID: ${id}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get a news article by slug
   */
  @Get('slug/:slug')
  @Public()
  @ApiOperation({
    summary: 'Get news article by slug',
    description:
      'Retrieves a news article using its URL-friendly slug identifier. Useful for SEO-friendly URLs.',
  })
  @ApiParam({
    name: 'slug',
    description: 'URL-friendly slug of the news article',
    example: 'shelterafrique-launches-affordable-housing-kenya-2024',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News article retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News article retrieved successfully',
        },
        data: { $ref: getSchemaPath(News) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<ApiResponseDto<News>> {
    try {
      const news = await this.newsService.findBySlug(slug);

      this.logger.log(
        `News article retrieved by slug: ${news.title} (Slug: ${slug})`,
      );

      return {
        success: true,
        message: 'News article retrieved successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve news article with slug: ${slug}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update a news article
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update news article',
    description:
      'Updates an existing news article with new information. Supports partial updates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the news article to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: UpdateNewsDto,
    description: 'Updated news article data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News article updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News article updated successfully',
        },
        data: { $ref: getSchemaPath(News) },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Slug already exists',
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @Req() request: Request,
  ): Promise<ApiResponseDto<News>> {
    try {
      const userId = request.user?.['id'] || request.user?.['sub'];
      const news = await this.newsService.update(id, updateNewsDto, userId);

      this.logger.log(`News article updated: ${news.title} (ID: ${id})`);

      return {
        success: true,
        message: 'News article updated successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to update news article with ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Soft delete a news article (archive)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Archive news article',
    description:
      'Soft deletes a news article by changing its status to archived. The article can be restored later.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the news article to archive',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'News article archived successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found',
  })
  async remove(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    try {
      const userId = request.user?.['id'] || request.user?.['sub'];
      await this.newsService.remove(id, userId);

      this.logger.log(`News article archived: ID ${id}`);
    } catch (error) {
      this.logger.error(`Failed to archive news article with ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Permanently delete a news article
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete news article',
    description:
      'Permanently removes a news article from the database. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the news article to permanently delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'News article permanently deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'News article not found',
  })
  async hardDelete(@Param('id') id: string): Promise<void> {
    try {
      await this.newsService.hardDelete(id);

      this.logger.log(`News article permanently deleted: ID ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to permanently delete news article with ID: ${id}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get featured news articles
   */
  @Get('featured/articles')
  @ApiOperation({
    summary: 'Get featured news articles',
    description:
      'Retrieves news articles marked as featured, typically displayed prominently on the homepage.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of featured articles to return (default: 5)',
    example: 5,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured news articles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Featured news articles retrieved successfully',
        },
        data: { type: 'array', items: { $ref: getSchemaPath(News) } },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getFeaturedNews(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ApiResponseDto<News[]>> {
    try {
      const news = await this.newsService.getFeaturedNews(limit);

      this.logger.log(`Retrieved ${news.length} featured news articles`);

      return {
        success: true,
        message: 'Featured news articles retrieved successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve featured news articles', error);
      throw error;
    }
  }

  /**
   * Get news articles by category
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Get news articles by category',
    description:
      'Retrieves published news articles filtered by a specific category.',
  })
  @ApiParam({
    name: 'category',
    enum: NewsCategory,
    description: 'News category to filter by',
    example: NewsCategory.HOUSING,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of articles to return (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News articles by category retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News articles retrieved successfully',
        },
        data: { type: 'array', items: { $ref: getSchemaPath(News) } },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getNewsByCategory(
    @Param('category') category: NewsCategory,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ApiResponseDto<News[]>> {
    try {
      const news = await this.newsService.getNewsByCategory(category, limit);

      this.logger.log(
        `Retrieved ${news.length} articles for category: ${category}`,
      );

      return {
        success: true,
        message: 'News articles retrieved successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve news by category: ${category}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get related news articles
   */
  @Get(':id/related')
  @ApiOperation({
    summary: 'Get related news articles',
    description:
      'Retrieves news articles related to a specific article based on category and tags.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the news article',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of related articles to return (default: 3)',
    example: 3,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Related news articles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Related news articles retrieved successfully',
        },
        data: { type: 'array', items: { $ref: getSchemaPath(News) } },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getRelatedNews(
    @Param('id') id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ApiResponseDto<News[]>> {
    try {
      const news = await this.newsService.getRelatedNews(id, limit);

      this.logger.log(
        `Retrieved ${news.length} related articles for news ID: ${id}`,
      );

      return {
        success: true,
        message: 'Related news articles retrieved successfully',
        data: news,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve related news for ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get news statistics
   */
  @Get('admin/statistics')
  @ApiOperation({
    summary: 'Get news statistics',
    description:
      'Retrieves statistical information about news articles including counts by status and category.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'News statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'News statistics retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            totalByStatus: {
              type: 'object',
              example: { published: 45, draft: 12, scheduled: 3, archived: 8 },
            },
            totalByCategory: {
              type: 'object',
              example: {
                housing: 25,
                corporate: 15,
                events: 10,
                press_release: 8,
              },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getStatistics(): Promise<ApiResponseDto<any>> {
    try {
      const statistics = await this.newsService.getStatistics();

      this.logger.log('News statistics retrieved successfully');

      return {
        success: true,
        message: 'News statistics retrieved successfully',
        data: statistics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to retrieve news statistics', error);
      throw error;
    }
  }

  /**
   * Bulk update news articles
   */
  @Put('admin/bulk-update')
  @ApiOperation({
    summary: 'Bulk update news articles',
    description:
      'Updates multiple news articles simultaneously with the same data.',
  })
  @ApiBody({
    description: 'Bulk update request data',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of news article IDs to update',
          example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        },
        updateData: {
          type: 'object',
          description: 'Data to update across all specified articles',
          example: { status: 'published', featured: true },
        },
      },
      required: ['ids', 'updateData'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk update completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Bulk update completed successfully',
        },
        data: {
          type: 'object',
          properties: {
            modifiedCount: { type: 'number', example: 5 },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkUpdate(
    @Body() bulkUpdateDto: BulkUpdateRequestDto,
  ): Promise<ApiResponseDto<{ modifiedCount: number }>> {
    try {
      const modifiedCount = await this.newsService.bulkUpdate(
        bulkUpdateDto.ids,
        bulkUpdateDto.updateData,
      );

      this.logger.log(
        `Bulk update completed. Modified ${modifiedCount} articles`,
      );

      return {
        success: true,
        message: 'Bulk update completed successfully',
        data: { modifiedCount },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to perform bulk update', error);
      throw error;
    }
  }
}
