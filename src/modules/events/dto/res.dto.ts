import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../events.schema';
import { IsNotEmpty, IsString } from 'class-validator';

// Response DTOs for documentation
export class EventResponseDto {
  @ApiProperty({ example: '60f7b3b3b3b3b3b3b3b3b3b3' })
  _id: string;

  @ApiProperty({ example: 'Shelter Afrique Annual General Meeting 2025' })
  title: string;

  @ApiProperty({ example: 'Annual shareholders meeting...' })
  description: string;

  @ApiProperty({ example: '2025-07-15T08:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2025-07-16T17:00:00.000Z' })
  endDate: string;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty({ example: '2025-06-10T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-10T10:30:00.000Z' })
  updatedAt: Date;
}

export class PaginatedEventsResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  events: EventResponseDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class CancelEventDto {
  @ApiProperty({
    description: 'Reason for event cancellation',
    example: 'Due to unforeseen circumstances, we need to postpone this event.',
  })
  @IsString()
  @IsNotEmpty()
  cancellationReason: string;
}

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
