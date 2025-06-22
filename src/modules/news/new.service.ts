import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  News,
  NewsDocument,
  NewsStatus,
  NewsCategory,
  NewsPriority,
} from './schema';
import { CreateNewsDto, UpdateNewsDto } from './dto/create.dto';

export interface NewsQuery {
  page?: number;
  limit?: number;
  status?: NewsStatus;
  category?: NewsCategory;
  priority?: NewsPriority;
  featured?: boolean;
  pinned?: boolean;
  search?: string;
  tags?: string[];
  author?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    @InjectModel(News.name) private readonly newsModel: Model<NewsDocument>,
  ) {}

  /**
   * Create a new news article
   */
  async create(createNewsDto: CreateNewsDto, userId?: string): Promise<News> {
    try {
      // Check for duplicate slug
      if (createNewsDto.slug) {
        const existingNews = await this.newsModel.findOne({
          slug: createNewsDto.slug,
        });
        if (existingNews) {
          throw new ConflictException(
            `News with slug '${createNewsDto.slug}' already exists`,
          );
        }
      }

      const newsData = {
        ...createNewsDto,
        createdBy: userId ? new Types.ObjectId(userId) : undefined,
        publishedAt:
          createNewsDto.status === NewsStatus.PUBLISHED
            ? new Date()
            : createNewsDto.publishedAt,
      };

      const news = new this.newsModel(newsData);
      const savedNews = await news.save();

      this.logger.log(`News article created with ID: ${savedNews._id}`);
      return savedNews.populate('relatedNews');
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating news article', error);
      throw new BadRequestException('Failed to create news article');
    }
  }

  /**
   * Get all news articles with pagination and filtering
   */
  async findAll(query: NewsQuery): Promise<PaginatedResponse<News>> {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      featured,
      pinned,
      search,
      tags,
      author,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Build filter conditions
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (typeof featured === 'boolean') filter.featured = featured;
    if (typeof pinned === 'boolean') filter.pinned = pinned;
    if (author) filter['author.name'] = new RegExp(author, 'i');
    if (tags && tags.length > 0) filter.tags = { $in: tags };

    // Date range filter
    if (startDate || endDate) {
      filter.publishedAt = {};
      if (startDate) filter.publishedAt.$gte = new Date(startDate);
      if (endDate) filter.publishedAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    try {
      const [data, total] = await Promise.all([
        this.newsModel
          .find(filter)
          .sort(sortConfig)
          .skip(skip)
          .limit(limit)
          .populate('relatedNews', 'title slug publishedAt')
          .exec(),
        this.newsModel.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching news articles', error);
      throw new BadRequestException('Failed to fetch news articles');
    }
  }

  /**
   * Get a single news article by ID
   */
  async findOne(id: string): Promise<News> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID format');
    }

    try {
      const news = await this.newsModel
        .findById(id)
        .populate('relatedNews', 'title slug publishedAt featuredImage')
        .exec();

      if (!news) {
        throw new NotFoundException(`News article with ID ${id} not found`);
      }

      // Increment view count
      await this.incrementViews(id);

      return news;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching news article with ID: ${id}`, error);
      throw new BadRequestException('Failed to fetch news article');
    }
  }

  /**
   * Get a news article by slug
   */
  async findBySlug(slug: string): Promise<News> {
    try {
      const news = await this.newsModel
        .findOne({ slug })
        .populate('relatedNews', 'title slug publishedAt featuredImage')
        .exec();

      if (!news) {
        throw new NotFoundException(
          `News article with slug '${slug}' not found`,
        );
      }

      // Increment view count
      await this.incrementViews(news._id.toString());

      return news;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error fetching news article with slug: ${slug}`,
        error,
      );
      throw new BadRequestException('Failed to fetch news article');
    }
  }

  /**
   * Update a news article
   */
  async update(
    id: string,
    updateNewsDto: UpdateNewsDto,
    userId?: string,
  ): Promise<News> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID format');
    }

    // Check for slug conflicts
    if (updateNewsDto.slug) {
      const existingNews = await this.newsModel.findOne({
        slug: updateNewsDto.slug,
        _id: { $ne: id },
      });
      if (existingNews) {
        throw new ConflictException(
          `News with slug '${updateNewsDto.slug}' already exists`,
        );
      }
    }

    try {
      const updateData = {
        ...updateNewsDto,
        updatedBy: userId ? new Types.ObjectId(userId) : undefined,
      };

      // Set publishedAt if status is being changed to published
      if (updateNewsDto.status === NewsStatus.PUBLISHED) {
        const currentNews = await this.newsModel.findById(id);
        if (currentNews && currentNews.status !== NewsStatus.PUBLISHED) {
          updateData.publishedAt = new Date();
        }
      }

      const news = await this.newsModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('relatedNews', 'title slug publishedAt featuredImage')
        .exec();

      if (!news) {
        throw new NotFoundException(`News article with ID ${id} not found`);
      }

      this.logger.log(`News article updated with ID: ${id}`);
      return news;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error updating news article with ID: ${id}`, error);
      throw new BadRequestException('Failed to update news article');
    }
  }

  /**
   * Delete a news article (soft delete)
   */
  async remove(id: string, userId?: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID format');
    }

    try {
      const news = await this.newsModel.findByIdAndUpdate(
        id,
        {
          status: NewsStatus.ARCHIVED,
          archivedAt: new Date(),
          archivedBy: userId ? new Types.ObjectId(userId) : undefined,
        },
        { new: true },
      );

      if (!news) {
        throw new NotFoundException(`News article with ID ${id} not found`);
      }

      this.logger.log(`News article archived with ID: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error archiving news article with ID: ${id}`, error);
      throw new BadRequestException('Failed to archive news article');
    }
  }

  /**
   * Hard delete a news article (permanent deletion)
   */
  async hardDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID format');
    }

    try {
      const result = await this.newsModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException(`News article with ID ${id} not found`);
      }

      this.logger.log(`News article permanently deleted with ID: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error permanently deleting news article with ID: ${id}`,
        error,
      );
      throw new BadRequestException(
        'Failed to permanently delete news article',
      );
    }
  }

  /**
   * Get featured news articles
   */
  async getFeaturedNews(limit: number = 5): Promise<News[]> {
    try {
      return await this.newsModel
        .find({ featured: true, status: NewsStatus.PUBLISHED })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title excerpt slug featuredImage publishedAt author category')
        .exec();
    } catch (error) {
      this.logger.error('Error fetching featured news', error);
      throw new BadRequestException('Failed to fetch featured news');
    }
  }

  /**
   * Get news by category
   */
  async getNewsByCategory(
    category: NewsCategory,
    limit: number = 10,
  ): Promise<News[]> {
    try {
      return await this.newsModel
        .find({ category, status: NewsStatus.PUBLISHED })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title excerpt slug featuredImage publishedAt author')
        .exec();
    } catch (error) {
      this.logger.error(`Error fetching news by category: ${category}`, error);
      throw new BadRequestException('Failed to fetch news by category');
    }
  }

  /**
   * Get related news articles
   */
  async getRelatedNews(id: string, limit: number = 3): Promise<News[]> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid news ID format');
    }

    try {
      const currentNews = await this.newsModel
        .findById(id)
        .select('category tags');
      if (!currentNews) {
        throw new NotFoundException(`News article with ID ${id} not found`);
      }

      const filter: any = {
        _id: { $ne: id },
        status: NewsStatus.PUBLISHED,
        $or: [
          { category: currentNews.category },
          { tags: { $in: currentNews.tags || [] } },
        ],
      };

      return await this.newsModel
        .find(filter)
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title excerpt slug featuredImage publishedAt author')
        .exec();
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching related news for ID: ${id}`, error);
      throw new BadRequestException('Failed to fetch related news');
    }
  }

  /**
   * Increment view count for analytics
   */
  private async incrementViews(id: string): Promise<void> {
    try {
      await this.newsModel.findByIdAndUpdate(
        id,
        {
          $inc: { 'analytics.views': 1 },
          $set: { 'analytics.lastViewed': new Date() },
        },
        { upsert: false },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to increment view count for news ID: ${id}`,
        error,
      );
    }
  }

  /**
   * Get news statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const stats = await this.newsModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const categoryStats = await this.newsModel.aggregate([
        {
          $match: { status: NewsStatus.PUBLISHED },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        totalByStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        totalByCategory: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logger.error('Error fetching news statistics', error);
      throw new BadRequestException('Failed to fetch news statistics');
    }
  }

  /**
   * Bulk update news articles
   */
  async bulkUpdate(
    ids: string[],
    updateData: Partial<UpdateNewsDto>,
  ): Promise<number> {
    try {
      const objectIds = ids.map((id) => new Types.ObjectId(id));
      const result = await this.newsModel.updateMany(
        { _id: { $in: objectIds } },
        updateData,
      );

      this.logger.log(`Bulk updated ${result.modifiedCount} news articles`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Error in bulk update operation', error);
      throw new BadRequestException('Failed to perform bulk update');
    }
  }
}
