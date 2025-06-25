import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Enums
export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
}

export enum NewsCategory {
  CORPORATE = 'corporate',
  FINANCIAL = 'financial',
  HOUSING = 'housing',
  DEVELOPMENT = 'development',
  SUSTAINABILITY = 'sustainability',
  EVENTS = 'events',
  PRESS_RELEASE = 'press-release',
  PARTNERSHIPS = 'partnerships',
}

export enum NewsPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Embedded document for media attachments
@Schema({ _id: false })
export class MediaAttachment {
  @ApiProperty({
    description: 'URL of the media file',
    example: 'https://shelterafrique.org/media/images/housing-project-2024.jpg',
  })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Type of media attachment',
    enum: ['image', 'video', 'document', 'audio'],
    example: 'image',
  })
  @Prop({ required: true, enum: ['image', 'video', 'document', 'audio'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Caption for the media', required: false })
  @Prop({ maxlength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  caption?: string;

  @ApiProperty({
    description: 'Alternative text for accessibility',
    required: false,
  })
  @Prop({ maxlength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  altText?: string;

  @ApiProperty({ description: 'File size in bytes', required: false })
  @Prop()
  @IsOptional()
  size?: number;

  @ApiProperty({ description: 'MIME type of the file', required: false })
  @Prop()
  @IsString()
  @IsOptional()
  mimeType?: string;
}

// Author embedded document
@Schema({ _id: false })
export class Author {
  @ApiProperty({ description: 'Full name of the author' })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Author's email", required: false })
  @Prop()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "Author's professional title", required: false })
  @Prop()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: "Author's biography", required: false })
  @Prop()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: "URL to author's avatar", required: false })
  @Prop()
  @IsString()
  @IsOptional()
  avatar?: string;
}

// Translation support
@Schema({ _id: false })
export class Translation {
  @ApiProperty({ description: 'Language code (ISO 639-1)', example: 'fr' })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  language: string; //(en, fr)

  @ApiProperty({ description: 'Translated title' })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Translated content' })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Translated excerpt', required: false })
  @Prop()
  @IsString()
  @IsOptional()
  excerpt?: string;
}

// Main News Schema
@Schema({
  timestamps: true,
  collection: 'news',
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class News extends Document {
  @ApiProperty({ type: String, description: 'Unique identifier' })
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text',
  })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'News article title' })
  @MaxLength(200)
  title: string;

  @Prop({
    required: true,
    index: 'text',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @Prop({
    trim: true,
    maxlength: 300,
  })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Brief summary of the article', required: false })
  @MaxLength(300)
  excerpt?: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  })
  @IsString()
  @ApiProperty({ description: 'URL-friendly slug' })
  @IsNotEmpty()
  slug: string;

  // Status and visibility
  @Prop({
    enum: NewsStatus,
    default: NewsStatus.DRAFT,
    index: true,
  })
  @ApiProperty({ enum: NewsStatus, description: 'Publication status' })
  @IsEnum(NewsStatus)
  status: NewsStatus;

  @Prop({
    default: false,
    index: true,
  })
  @ApiProperty({ description: 'Is the article featured?' })
  @IsBoolean()
  featured: boolean;

  @Prop({
    default: false,
  })
  @IsBoolean()
  pinned: boolean;

  // Categorization
  @Prop({
    enum: NewsCategory,
    required: true,
    index: true,
  })
  @IsEnum(NewsCategory)
  category: NewsCategory;

  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  @IsArray()
  @IsOptional()
  tags: string[];

  @Prop({
    enum: NewsPriority,
    default: NewsPriority.MEDIUM,
  })
  @IsEnum(NewsPriority)
  priority: NewsPriority;

  // Publishing control
  @Prop({
    default: Date.now,
    index: -1,
  })
  @IsDate()
  @IsOptional()
  publishedAt?: Date;

  @Prop({
    index: true,
  })
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;
  // Core content fields

  @Prop()
  @IsDate()
  @IsOptional()
  archivedAt?: Date;

  // Author information
  @Prop({
    type: Author,
    required: true,
  })
  @ValidateNested()
  author: Author;

  // Media and attachments
  @Prop()
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @Prop({
    type: [MediaAttachment],
    default: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  attachments: MediaAttachment[];

  // Multi-language support
  @Prop({
    type: [Translation],
    default: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  translations: Translation[];

  // Engagement metrics
  @Prop({
    default: 0,
    min: 0,
    index: true,
  })
  viewCount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  shareCount: number;

  @Prop({
    default: 0,
    min: 0,
  })
  likeCount: number;

  // Relations
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'News' }],
    default: [],
  })
  relatedNews: Types.ObjectId[];

  // External links
  @Prop({
    type: [String],
    default: [],
  })
  @IsArray()
  @IsOptional()
  externalLinks: string[];

  // Audit fields
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  updatedBy?: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  publishedBy?: Types.ObjectId;

  // Soft delete
  @Prop({
    default: false,
    index: true,
  })
  deleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  deletedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({ status: 1, publishedAt: -1 });
NewsSchema.index({ category: 1, publishedAt: -1 });
NewsSchema.index({ featured: 1, publishedAt: -1 });
NewsSchema.index({ status: 1, category: 1, publishedAt: -1 });
NewsSchema.index({ tags: 1, publishedAt: -1 });
NewsSchema.index({ createdBy: 1, createdAt: -1 });
NewsSchema.index({ deleted: 1, status: 1, publishedAt: -1 });

NewsSchema.index(
  {
    title: 'text',
    content: 'text',
    excerpt: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 10,
      excerpt: 5,
      content: 1,
      tags: 3,
    },
  },
);

// Pre-save middleware for slug generation
NewsSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Pre-save middleware for published date
NewsSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status === NewsStatus.PUBLISHED &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for URL generation
NewsSchema.virtual('url').get(function () {
  return `/news/${this.slug}`;
});

export type NewsDocument = News & Document;
