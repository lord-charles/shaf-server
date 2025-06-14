import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Event, EventDocument, EventStatus } from './events.schema';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { PaginatedEventsResponseDto } from './dto/res.dto';

export interface FindAllOptions {
  page: number;
  limit: number;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  organizer?: string;
}

export interface EventStats {
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  draftEvents: number;
  totalAttendees: number;
  averageAttendance: number;
  upcomingEvents: number;
  ongoingEvents: number;
  pastEvents: number;
  popularVenues: Array<{ venueName: string; eventCount: number }>;
  eventsByMonth: Array<{ month: string; count: number }>;
  registrationTrends: Array<{ date: string; registrations: number }>;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  /**
   * Create a new event with comprehensive validation
   */
  async create(
    createEventDto: CreateEventDto,
    createdBy: string,
  ): Promise<Event> {
    try {
      this.logger.debug(`Creating event: ${createEventDto.title}`);

      const eventwithYear = await this.eventModel.findOne({
        eventYear: createEventDto.eventYear,
      });

      if (eventwithYear) {
        throw new HttpException(
          'An event with similar year already exists',
          HttpStatus.CONFLICT,
        );
      }

      // Business rule validations
      await this.validateEventDates(createEventDto);
      await this.checkForConflictingEvents(createEventDto);
      await this.validateCapacityConstraints(createEventDto);

      // Set default values
      const eventData = {
        ...createEventDto,
        status: createEventDto.status || EventStatus.DRAFT,
        currentAttendees: createEventDto.currentAttendees || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
      };

      const createdEvent = new this.eventModel(eventData);
      const savedEvent = await createdEvent.save();

      this.logger.log(`Event created successfully: ${savedEvent._id}`);
      return savedEvent.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to create event: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle MongoDB specific errors
      if (error.name === 'ValidationError') {
        throw new HttpException(
          `Validation failed: ${Object.values(error.errors)
            .map((e: any) => e.message)
            .join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.code === 11000) {
        throw new HttpException(
          'An event with similar details already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        'Failed to create event due to internal error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findCurrentYearEvent(): Promise<Event> {
    try {
      const event = await this.eventModel.findOne({
        eventYear: new Date().getFullYear(),
      });

      if (!event) {
        throw new NotFoundException('Current year event not found');
      }

      return event;
    } catch (error) {
      this.logger.error(
        `Failed to fetch current year event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all events with advanced filtering, sorting, and pagination
   */
  async findAll(options: FindAllOptions): Promise<any[]> {
    try {
      this.logger.debug(
        `Fetching events with options: ${JSON.stringify(options)}`,
      );

      const { page, limit, status, startDate, endDate, search, organizer } =
        options;

      // Build dynamic filter query
      const filter: FilterQuery<EventDocument> = {};

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) {
          filter.startDate.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.startDate.$lte = new Date(endDate);
        }
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } },
          { 'location.venueName': { $regex: search, $options: 'i' } },
          { 'location.address.city': { $regex: search, $options: 'i' } },
        ];
      }

      // Organizer filter
      if (organizer) {
        if (Types.ObjectId.isValid(organizer)) {
          filter.$or = [
            { createdBy: organizer },
            { organizers: { $in: [organizer] } },
          ];
        } else {
          throw new HttpException(
            'Invalid organizer ID format',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Execute query with aggregation for better performance
      const [events, totalCount] = await Promise.all([
        this.eventModel
          .find(filter)
          .sort({ startDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('createdBy', 'name email')
          .populate('organizers', 'name email')
          .lean()
          .exec(),
        this.eventModel.countDocuments(filter).exec(),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);

      this.logger.log(
        `Retrieved ${events.length} events (page ${page}/${totalPages})`,
      );

      return events;
    } catch (error) {
      this.logger.error(
        `Failed to fetch events: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get comprehensive event statistics
   */
  async getEventStats(): Promise<EventStats> {
    try {
      this.logger.debug('Calculating event statistics');

      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Use aggregation pipeline for efficient statistics calculation
      const statsAggregation = await this.eventModel.aggregate([
        {
          $facet: {
            // Basic counts
            statusCounts: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                },
              },
            ],
            // Time-based counts
            timeCounts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  upcoming: {
                    $sum: {
                      $cond: [{ $gte: ['$startDate', now] }, 1, 0],
                    },
                  },
                  ongoing: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $lte: ['$startDate', now] },
                            { $gte: ['$endDate', now] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  past: {
                    $sum: {
                      $cond: [{ $lt: ['$endDate', now] }, 1, 0],
                    },
                  },
                  totalAttendees: { $sum: '$currentAttendees' },
                },
              },
            ],
            // Popular venues
            popularVenues: [
              {
                $group: {
                  _id: '$location.venueName',
                  eventCount: { $sum: 1 },
                },
              },
              { $sort: { eventCount: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 0,
                  venueName: '$_id',
                  eventCount: 1,
                },
              },
            ],
            // Events by month (current year)
            eventsByMonth: [
              {
                $match: {
                  startDate: { $gte: startOfYear },
                },
              },
              {
                $group: {
                  _id: {
                    month: { $month: '$startDate' },
                    year: { $year: '$startDate' },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { '_id.month': 1 } },
              {
                $project: {
                  _id: 0,
                  month: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: {
                        $dateFromParts: {
                          year: '$_id.year',
                          month: '$_id.month',
                        },
                      },
                    },
                  },
                  count: 1,
                },
              },
            ],
          },
        },
      ]);

      const aggregationResult = statsAggregation[0];

      // Process status counts
      const statusCounts = aggregationResult.statusCounts.reduce(
        (acc, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {},
      );

      // Process time-based counts
      const timeCounts = aggregationResult.timeCounts[0] || {};

      // Calculate average attendance
      const averageAttendance =
        timeCounts.total > 0
          ? Math.round(timeCounts.totalAttendees / timeCounts.total)
          : 0;

      const stats: EventStats = {
        totalEvents: timeCounts.total || 0,
        activeEvents:
          (statusCounts[EventStatus.COMPLETED] || 0) +
          (statusCounts[EventStatus.PUBLISHED] || 0),
        completedEvents: statusCounts[EventStatus.COMPLETED] || 0,
        cancelledEvents: statusCounts[EventStatus.CANCELLED] || 0,
        draftEvents: statusCounts[EventStatus.DRAFT] || 0,
        totalAttendees: timeCounts.totalAttendees || 0,
        averageAttendance,
        upcomingEvents: timeCounts.upcoming || 0,
        ongoingEvents: timeCounts.ongoing || 0,
        pastEvents: timeCounts.past || 0,
        popularVenues: aggregationResult.popularVenues || [],
        eventsByMonth: aggregationResult.eventsByMonth || [],
        registrationTrends: [], // This would require additional tracking data
      };

      this.logger.log('Event statistics calculated successfully');
      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to calculate event statistics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to retrieve event statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Find a single event by ID with comprehensive error handling
   */
  async findOne(id: string): Promise<Event | null> {
    try {
      this.logger.debug(`Fetching event with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const event = await this.eventModel
        .findById(id)
        .populate('createdBy', 'name email')
        .populate('organizers', 'name email')
        .lean()
        .exec();

      if (event) {
        this.logger.log(`Event ${id} retrieved successfully`);
      }

      return event;
    } catch (error) {
      this.logger.error(
        `Failed to fetch event ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to retrieve event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update an event with business rule validation
   */
  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event | null> {
    try {
      this.logger.debug(`Updating event with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Fetch existing event
      const existingEvent = await this.eventModel.findById(id).exec();
      if (!existingEvent) {
        return null;
      }

      // Business rule validations
      await this.validateEventUpdate(existingEvent, updateEventDto);

      const updatedEvent = await this.eventModel
        .findByIdAndUpdate(id, updateEventDto, {
          new: true,
          runValidators: true,
        })
        .populate('createdBy', 'name email')
        .populate('organizers', 'name email')
        .lean()
        .exec();

      if (updatedEvent) {
        this.logger.log(`Event ${id} updated successfully`);
      }

      return updatedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to update event ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.name === 'ValidationError') {
        throw new HttpException(
          `Validation failed: ${Object.values(error.errors)
            .map((e: any) => e.message)
            .join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to update event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cancel an event with proper validation
   */
  async cancelEvent(
    id: string,
    cancellationReason: string,
  ): Promise<Event | null> {
    try {
      this.logger.debug(`Cancelling event with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingEvent = await this.eventModel.findById(id).exec();
      if (!existingEvent) {
        return null;
      }

      // Validate cancellation is allowed
      if (existingEvent.status === EventStatus.CANCELLED) {
        throw new HttpException(
          'Event is already cancelled',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (existingEvent.status === EventStatus.COMPLETED) {
        throw new HttpException(
          'Cannot cancel a completed event',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if event has already started
      const now = new Date();
      if (existingEvent.endDate < now) {
        throw new HttpException(
          'Cannot cancel an event that has already ended',
          HttpStatus.BAD_REQUEST,
        );
      }

      const cancelledEvent = await this.eventModel
        .findByIdAndUpdate(
          id,
          {
            status: EventStatus.CANCELLED,
            cancellationReason,
            cancelledAt: now,
            updatedAt: now,
          },
          { new: true, runValidators: true },
        )
        .populate('createdBy', 'name email')
        .populate('organizers', 'name email')
        .lean()
        .exec();

      if (cancelledEvent) {
        this.logger.log(`Event ${id} cancelled successfully`);
        // Here you could trigger notifications to attendees
      }

      return cancelledEvent;
    } catch (error) {
      this.logger.error(
        `Failed to cancel event ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to cancel event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete an event with validation
   */
  async remove(id: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting event with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid event ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingEvent = await this.eventModel.findById(id).exec();
      if (!existingEvent) {
        return false;
      }

      // Business rule: Only allow deletion of draft events or events with no registrations
      if (
        existingEvent.status === EventStatus.ONGOING ||
        existingEvent.status === EventStatus.COMPLETED ||
        existingEvent.currentAttendees > 0
      ) {
        throw new HttpException(
          'Cannot delete event with active registrations. Cancel the event first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.eventModel.findByIdAndDelete(id).exec();

      if (result) {
        this.logger.log(`Event ${id} deleted successfully`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Failed to delete event ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to delete event',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Private helper methods for validation

  /**
   * Validate event dates
   */
  private async validateEventDates(
    eventDto: CreateEventDto | UpdateEventDto,
  ): Promise<void> {
    const startDate = new Date(eventDto.startDate);
    const endDate = new Date(eventDto.endDate);
    const registrationStart = new Date(eventDto.registrationStartDate);
    const registrationEnd = new Date(eventDto.registrationEndDate);
    const now = new Date();

    // Basic date validations
    if (startDate >= endDate) {
      throw new HttpException(
        'Event start date must be before end date',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (registrationStart >= registrationEnd) {
      throw new HttpException(
        'Registration start date must be before registration end date',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (registrationEnd > startDate) {
      throw new HttpException(
        'Registration must end before event starts',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if dates are in the past (for new events)
    if (eventDto instanceof CreateEventDto) {
      if (startDate < now) {
        throw new HttpException(
          'Event start date cannot be in the past',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (registrationStart < now) {
        throw new HttpException(
          'Registration start date cannot be in the past',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * Check for conflicting events (same venue, overlapping times)
   */
  private async checkForConflictingEvents(
    eventDto: CreateEventDto,
  ): Promise<void> {
    if (!eventDto.location?.venueName) return;

    const conflictingEvents = await this.eventModel
      .find({
        'location.venueName': eventDto.location.venueName,
        status: { $nin: [EventStatus.CANCELLED, EventStatus.DRAFT] },
        $or: [
          {
            startDate: {
              $lte: new Date(eventDto.endDate),
              $gte: new Date(eventDto.startDate),
            },
          },
          {
            endDate: {
              $lte: new Date(eventDto.endDate),
              $gte: new Date(eventDto.startDate),
            },
          },
          {
            $and: [
              { startDate: { $lte: new Date(eventDto.startDate) } },
              { endDate: { $gte: new Date(eventDto.endDate) } },
            ],
          },
        ],
      })
      .exec();

    if (conflictingEvents.length > 0) {
      throw new HttpException(
        `Venue "${eventDto.location.venueName}" is already booked for the selected time period`,
        HttpStatus.CONFLICT,
      );
    }
  }

  /**
   * Validate capacity constraints
   */
  private async validateCapacityConstraints(
    eventDto: CreateEventDto | UpdateEventDto,
  ): Promise<void> {
    if (eventDto.maxAttendees && eventDto.currentAttendees) {
      if (eventDto.currentAttendees > eventDto.maxAttendees) {
        throw new HttpException(
          'Current attendees cannot exceed maximum capacity',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (eventDto.location?.capacity && eventDto.maxAttendees) {
      if (eventDto.maxAttendees > eventDto.location.capacity) {
        throw new HttpException(
          'Maximum attendees cannot exceed venue capacity',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * Validate event update operations
   */
  private async validateEventUpdate(
    existingEvent: EventDocument,
    updateDto: UpdateEventDto,
  ): Promise<void> {
    // Prevent updates to cancelled events
    if (existingEvent.status === EventStatus.CANCELLED) {
      throw new HttpException(
        'Cannot update a cancelled event',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Prevent updates to completed events
    if (existingEvent.status === EventStatus.COMPLETED) {
      throw new HttpException(
        'Cannot update a completed event',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate date changes
    if (updateDto.startDate || updateDto.endDate) {
      await this.validateEventDates({
        ...existingEvent.toObject(),
        ...updateDto,
      });
    }

    // Check capacity constraints
    await this.validateCapacityConstraints({
      ...existingEvent.toObject(),
      ...updateDto,
    });
  }
}
