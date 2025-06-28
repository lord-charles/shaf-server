import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Panelist, PanelistRole, OrganizationType } from './panelist.schema';
import {
  ConfirmPanelistDto,
  CreatePanelistDto,
  UpdatePanelistDto,
} from './panelist.dto';

// ============================
// SERVICE CLASS
// ============================

/**
 * Service class for managing Shelter Afrique AGM panelists
 * Handles all business logic and database operations for panelist management
 */
@Injectable()
export class PanelistService {
  private readonly logger = new Logger(PanelistService.name);

  constructor(
    @InjectModel(Panelist.name)
    private readonly panelistModel: Model<Panelist>,
  ) {}

  /**
   * Creates a new panelist record
   * @param createPanelistDto - Panelist data for creation
   * @returns Promise<Panelist> - The created panelist
   * @throws ConflictException if panelist with email already exists
   */
  async create(createPanelistDto: CreatePanelistDto): Promise<Panelist> {
    try {
      this.logger.log(`Creating new panelist: ${createPanelistDto.email}`);

      // Check if panelist with email already exists
      const existingPanelist = await this.panelistModel.findOne({
        email: createPanelistDto.email.toLowerCase(),
      });

      if (existingPanelist) {
        throw new ConflictException(
          `Panelist with email ${createPanelistDto.email} already exists`,
        );
      }

      // Create new panelist
      const newPanelist = new this.panelistModel({
        ...createPanelistDto,
        email: createPanelistDto.email.toLowerCase(),
        registeredAt: new Date(),
      });

      const savedPanelist = await newPanelist.save();
      this.logger.log(
        `Successfully created panelist with ID: ${savedPanelist._id}`,
      );

      return savedPanelist;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Error creating panelist: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create panelist');
    }
  }

  /**
   * Retrieves all panelists with optional filtering and pagination
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @param role - Filter by panelist role
   * @param organizationType - Filter by organization type
   * @param country - Filter by country
   * @param isActive - Filter by active status
   * @param isConfirmed - Filter by confirmation status
   * @returns Promise<{ panelists: Panelist[], total: number, page: number, totalPages: number }>
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: PanelistRole,
    organizationType?: OrganizationType,
    country?: string,
    isActive?: boolean,
    eventYear?: number,
    isConfirmed?: boolean,
  ): Promise<{
    panelists: Panelist[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Validate and sanitize pagination parameters
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(1, limit), 100);
      const skip = (validatedPage - 1) * validatedLimit;

      // Build filter query
      const filterQuery: any = {};

      if (role) filterQuery.role = role;
      if (organizationType) filterQuery.organizationType = organizationType;
      if (country) filterQuery.country = new RegExp(country, 'i');
      if (typeof isActive === 'boolean') filterQuery.isActive = isActive;
      if (typeof eventYear === 'number' && !isNaN(eventYear))
        filterQuery.eventYear = eventYear;
      if (typeof isConfirmed === 'boolean')
        filterQuery.isConfirmed = isConfirmed;

      this.logger.log(
        `Fetching panelists - Page: ${validatedPage}, Limit: ${validatedLimit}, Filters: ${JSON.stringify(filterQuery)}`,
      );

      // Execute queries in parallel for better performance
      const [panelists, total] = await Promise.all([
        this.panelistModel
          .find(filterQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validatedLimit)
          .lean()
          .exec(),
        this.panelistModel.countDocuments(filterQuery).exec(),
      ]);

      const totalPages = Math.ceil(total / validatedLimit);

      this.logger.log(
        `Successfully retrieved ${panelists.length} panelists out of ${total} total`,
      );

      return {
        panelists,
        total,
        page: validatedPage,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching panelists: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch panelists');
    }
  }

  /**
   * Retrieves a single panelist by ID
   * @param id - Panelist ID
   * @returns Promise<Panelist> - The found panelist
   * @throws NotFoundException if panelist not found
   */
  async findOne(id: string): Promise<Panelist> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid panelist ID format');
      }

      const panelist = await this.panelistModel.findById(id).lean().exec();

      if (!panelist) {
        throw new NotFoundException(`Panelist with ID ${id} not found`);
      }

      this.logger.log(`Successfully retrieved panelist: ${id}`);
      return panelist;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error fetching panelist ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to fetch panelist');
    }
  }

  /**
   * Updates an existing panelist
   * @param id - Panelist ID
   * @param updatePanelistDto - Updated panelist data
   * @returns Promise<Panelist> - The updated panelist
   * @throws NotFoundException if panelist not found
   * @throws ConflictException if email already exists for another panelist
   */
  async update(
    id: string,
    updatePanelistDto: UpdatePanelistDto,
  ): Promise<Panelist> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid panelist ID format');
      }

      // Check if panelist exists
      const existingPanelist = await this.panelistModel.findById(id);
      if (!existingPanelist) {
        throw new NotFoundException(`Panelist with ID ${id} not found`);
      }

      // If email is being updated, check for conflicts
      if (
        updatePanelistDto.email &&
        updatePanelistDto.email !== existingPanelist.email
      ) {
        const emailConflict = await this.panelistModel.findOne({
          email: updatePanelistDto.email.toLowerCase(),
          _id: { $ne: id },
        });

        if (emailConflict) {
          throw new ConflictException(
            `Email ${updatePanelistDto.email} is already in use by another panelist`,
          );
        }
      }

      // Prepare update data
      const updateData = {
        ...updatePanelistDto,
        ...(updatePanelistDto.email && {
          email: updatePanelistDto.email.toLowerCase(),
        }),
      };

      const updatedPanelist = await this.panelistModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .lean()
        .exec();

      this.logger.log(`Successfully updated panelist: ${id}`);
      return updatedPanelist;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating panelist ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update panelist');
    }
  }

  /**
   * Confirms or unconfirms a panelist's participation
   * @param id - Panelist ID
   * @param confirmDto - Confirmation data
   * @returns Promise<Panelist> - The updated panelist
   * @throws NotFoundException if panelist not found
   */
  async confirmParticipation(
    id: string,
    confirmDto: ConfirmPanelistDto,
  ): Promise<Panelist> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid panelist ID format');
      }

      const updateData = {
        isConfirmed: confirmDto.isConfirmed,
        confirmedAt: confirmDto.isConfirmed ? new Date() : null,
      };

      const updatedPanelist = await this.panelistModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .lean()
        .exec();

      if (!updatedPanelist) {
        throw new NotFoundException(`Panelist with ID ${id} not found`);
      }

      const action = confirmDto.isConfirmed ? 'confirmed' : 'unconfirmed';
      this.logger.log(`Successfully ${action} panelist participation: ${id}`);

      return updatedPanelist;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error confirming panelist ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to confirm panelist participation');
    }
  }

  /**
   * Soft deletes a panelist (sets isActive to false)
   * @param id - Panelist ID
   * @returns Promise<void>
   * @throws NotFoundException if panelist not found
   */
  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid panelist ID format');
      }

      const result = await this.panelistModel
        .findByIdAndUpdate(id, { isActive: false }, { new: true })
        .lean()
        .exec();

      if (!result) {
        throw new NotFoundException(`Panelist with ID ${id} not found`);
      }

      this.logger.log(`Successfully deactivated panelist: ${id}`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error deactivating panelist ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to deactivate panelist');
    }
  }

  /**
   * Gets panelist statistics for dashboard/reporting
   * @returns Promise<object> - Statistics object
   */
  async getStatistics(): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    byRole: Record<string, number>;
    byOrganizationType: Record<string, number>;
    byParticipationMode: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    try {
      const [
        total,
        confirmed,
        roleStats,
        orgTypeStats,
        participationModeStats,
        countryStats,
      ] = await Promise.all([
        this.panelistModel.countDocuments({ isActive: true }),
        this.panelistModel.countDocuments({
          isActive: true,
          isConfirmed: true,
        }),
        this.panelistModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
        this.panelistModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$organizationType', count: { $sum: 1 } } },
        ]),
        this.panelistModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$participationMode', count: { $sum: 1 } } },
        ]),
        this.panelistModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      // Transform aggregation results to objects
      const byRole = roleStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const byOrganizationType = orgTypeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const byParticipationMode = participationModeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const byCountry = countryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      this.logger.log('Successfully generated panelist statistics');

      return {
        total,
        confirmed,
        pending: total - confirmed,
        byRole,
        byOrganizationType,
        byParticipationMode,
        byCountry,
      };
    } catch (error) {
      this.logger.error(
        `Error generating statistics: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to generate statistics');
    }
  }

  /**
   * Searches panelists by name, organization, or expertise
   * @param searchTerm - Search term
   * @param limit - Maximum results to return
   * @returns Promise<Panelist[]> - Matching panelists
   */
  async search(searchTerm: string, limit: number = 20): Promise<Panelist[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new BadRequestException(
          'Search term must be at least 2 characters long',
        );
      }

      const sanitizedLimit = Math.min(Math.max(1, limit), 50);
      const regex = new RegExp(searchTerm.trim(), 'i');

      const results = await this.panelistModel
        .find({
          isActive: true,
          $or: [
            { firstName: regex },
            { lastName: regex },
            { organization: regex },
            { jobTitle: regex },
            { expertiseAreas: { $in: [regex] } },
          ],
        })
        .limit(sanitizedLimit)
        .sort({ firstName: 1, lastName: 1 })
        .lean()
        .exec();

      this.logger.log(
        `Search for "${searchTerm}" returned ${results.length} results`,
      );
      return results;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error searching panelists: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to search panelists');
    }
  }
}
