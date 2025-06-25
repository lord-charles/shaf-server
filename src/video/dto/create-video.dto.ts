import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  IsOptional,
  IsUrl,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { VideoCategory, VideoStatus } from '../entities/video.entity';

export class CreateVideoDto {
  @ApiProperty({
    description: 'Title of the video presentation',
    example: 'Shelter Afrique Digital Transformation Strategy 2024',
    maxLength: 200,
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Detailed description of the video content',
    example:
      "This presentation covers Shelter Afrique's comprehensive digital transformation strategy, including technology adoption, process optimization, and member service enhancement initiatives for 2024.",
    maxLength: 2000,
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description: string;

  @ApiProperty({
    description: 'YouTube URL of the video (must be a valid YouTube link)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    pattern: '^https://(www.)?(youtube.com|youtu.be)/.+',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid URL' })
  youtubeUrl: string;

  @ApiProperty({
    description: 'Category of the video content',
    enum: VideoCategory,
    example: VideoCategory.KEYNOTE_SPEECH,
    enumName: 'VideoCategory',
  })
  @IsEnum(VideoCategory, { message: 'Invalid video category' })
  category: VideoCategory;

  @ApiProperty({
    description: 'Year of the AGM event',
    example: 2024,
  })
  @IsNumber({}, { message: 'AGM year must be a number' })
  @Type(() => Number)
  agmYear: number;

  @ApiProperty({
    description: 'Date when the event/presentation took place',
    example: '2024-03-15T10:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString({}, { message: 'Event date must be a valid ISO date string' })
  eventDate: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing and searching videos',
    example: ['digital-transformation', 'strategy', 'technology', 'innovation'],
    type: [String],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Transform(({ value }) =>
    value?.map((tag: string) => tag.trim().toLowerCase()),
  )
  tags?: string[];

  @ApiProperty({
    description: 'Name of the main speaker or presenter',
    example: 'Dr. Thierno-Habib Hann',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Speaker name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  speaker: string;

  @ApiPropertyOptional({
    description: 'Professional title of the speaker',
    example: 'Managing Director & CEO',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  speakerTitle?: string;

  @ApiPropertyOptional({
    description: 'Organization or company the speaker represents',
    example: 'Shelter Afrique Development Bank',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  organization?: string;

  @ApiPropertyOptional({
    description: 'Duration of the video in minutes',
    example: 45,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Mark video as featured content',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the video',
    example: {
      sessionNumber: 3,
      room: 'Main Auditorium',
      language: 'English',
      hasTranscript: true,
      hasCaptions: false,
    },
  })
  @IsOptional()
  @Type(() => Object)
  metadata?: {
    sessionNumber?: number;
    room?: string;
    language?: string;
    hasTranscript?: boolean;
    hasCaptions?: boolean;
  };
}

// UPDATE VIDEO DTO

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

// QUERY/FILTER DTO

export class VideoQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by AGM year',
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  agmYear?: number;

  @ApiPropertyOptional({
    description: 'Filter by video category',
    enum: VideoCategory,
    enumName: 'VideoCategory',
  })
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  @ApiPropertyOptional({
    description: 'Filter by video status',
    enum: VideoStatus,
    enumName: 'VideoStatus',
  })
  @IsOptional()
  @IsEnum(VideoStatus)
  status?: VideoStatus;

  @ApiPropertyOptional({
    description: 'Search in title and description',
    example: 'digital transformation',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by speaker name',
    example: 'Dr. Thierno-Habib Hann',
  })
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'technology,innovation',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Show only featured videos',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Show only highlight videos',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHighlight?: boolean;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'eventDate',
    enum: ['eventDate', 'createdAt', 'title', 'viewCount', 'likeCount'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'eventDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
