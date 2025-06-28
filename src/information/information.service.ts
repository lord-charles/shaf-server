import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { CreateInformationDto } from './dto/create-information.dto';
import { Information } from './entities/information.entity';

@Injectable()
export class InformationService {
  private readonly logger = new Logger(InformationService.name);

  constructor(
    @InjectModel(Information.name)
    private readonly informationModel: Model<Information>,
  ) {}

  /**
   * Create a new information document
   */
  async create(createDto: CreateInformationDto): Promise<Information> {
    try {
      const created = new this.informationModel(createDto);
      return await created.save();
    } catch (error) {
      this.logger.error('Failed to create information', error.stack);
      throw new InternalServerErrorException(
        'Error creating delegate information',
      );
    }
  }

  /**
   * Retrieve all information documents, optionally filtered by year
   */
  async findAll(year?: string) {
    try {
      const query: FilterQuery<Information> = {};

      if (year?.trim()) {
        query.eventYear = year.trim();
      }

      return await this.informationModel
        .findOne(query)
        .sort({ eventStartDate: -1 })
        .select('-__v')
        .exec();
    } catch (error) {
      this.logger.error('Failed to fetch delegate information', error.stack);
      throw new InternalServerErrorException(
        'Error retrieving delegate information',
      );
    }
  }

  /**
   * Retrieve delegate information by ID
   */
  async findById(id: string): Promise<Information> {
    try {
      const doc = await this.informationModel.findById(id).exec();
      if (!doc) {
        throw new NotFoundException(`Information with ID '${id}' not found`);
      }
      return doc;
    } catch (error) {
      this.logger.error(
        `Error fetching delegate info by ID: ${id}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Could not retrieve the delegate information',
      );
    }
  }

  /**
   * Update delegate information by ID
   */
  async update(
    id: string,
    updateDto: CreateInformationDto,
  ): Promise<Information> {
    try {
      const updated = await this.informationModel
        .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
        .exec();

      if (!updated) {
        throw new NotFoundException(
          `Cannot update: No record found with ID '${id}'`,
        );
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating delegate info with ID: ${id}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update delegate information',
      );
    }
  }

  /**
   * Delete delegate information by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.informationModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(
          `Cannot delete: No record found with ID '${id}'`,
        );
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting delegate info with ID: ${id}`,
        error.stack,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to delete delegate information',
      );
    }
  }
}
