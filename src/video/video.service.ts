import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateVideoDto,
  UpdateVideoDto,
  VideoQueryDto,
} from './dto/create-video.dto';
import { Video, VideoDocument } from './entities/video.entity';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) {}

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    const existingVideo = await this.videoModel.findOne({
      youtubeUrl: createVideoDto.youtubeUrl,
    });

    if (existingVideo) {
      throw new BadRequestException(
        'A video with this YouTube URL already exists',
      );
    }

    const video = new this.videoModel({
      ...createVideoDto,
      eventDate: new Date(createVideoDto.eventDate),
    });

    return video.save();
  }

  async findAll(query: VideoQueryDto) {
    const {
      limit = 10,
      page = 1,
      sortBy = 'eventDate',
      sortOrder = 'desc',
      ...filters
    } = query;

    const skip = (page - 1) * limit;
    const sort: [string, 1 | -1][] = [[sortBy, sortOrder === 'desc' ? -1 : 1]];

    // Build filter object
    const filterObj: any = {};

    if (filters.agmYear) filterObj.agmYear = filters.agmYear;
    if (filters.category) filterObj.category = filters.category;
    if (filters.status) filterObj.status = filters.status;
    if (filters.speaker) filterObj.speaker = new RegExp(filters.speaker, 'i');
    if (filters.isFeatured !== undefined)
      filterObj.isFeatured = filters.isFeatured;
    if (filters.isHighlight !== undefined)
      filterObj.isHighlight = filters.isHighlight;

    if (filters.search) {
      filterObj.$or = [
        { title: new RegExp(filters.search, 'i') },
        { description: new RegExp(filters.search, 'i') },
      ];
    }

    if (filters.tags) {
      const tagArray = filters.tags.split(',').map((tag) => tag.trim());
      filterObj.tags = { $in: tagArray };
    }

    const [videos, total] = await Promise.all([
      this.videoModel.find(filterObj).sort(sort).skip(skip).limit(limit).exec(),
      this.videoModel.countDocuments(filterObj).exec(),
    ]);

    return {
      videos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.videoModel
      .findByIdAndUpdate(
        id,
        { ...updateVideoDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async remove(id: string): Promise<void> {
    const result = await this.videoModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Video not found');
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.videoModel
      .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
      .exec();
  }

  async incrementLikeCount(id: string): Promise<void> {
    await this.videoModel
      .findByIdAndUpdate(id, { $inc: { likeCount: 1 } })
      .exec();
  }
}
