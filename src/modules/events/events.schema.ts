import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AttendanceMode {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Event Schema
@Schema({
  timestamps: true,
  collection: 'events',
})
export class Event {
  @Prop({ required: true })
  eventYear: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  registrationStartDate: Date;

  @Prop({ required: true })
  registrationEndDate: Date;

  @Prop({ type: Object, required: true })
  location: {
    venueName: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    venueType: string;
    capacity: number;
    facilities: string[];
    contactPhone?: string;
    directions?: string;
    landmarkNearby?: string;
  };

  @Prop({ type: Object })
  virtualDetails: {
    platform: string;
    meetingLink: string;
    meetingId: string;
    passcode?: string;
    dialInNumbers?: string[];
    streamingLink?: string;
    recordingEnabled: boolean;
    technicalSupportContact: string;
  };

  @Prop({ type: String, enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  organizers: Types.ObjectId[];

  @Prop({ default: 0 })
  maxAttendees: number;

  @Prop({ default: 0 })
  currentAttendees: number;

  @Prop()
  eventBanner: string;

  @Prop({ type: [String], default: [] })
  eventImages: string[];

  @Prop({ type: [Object], default: [] })
  agenda: Array<{
    date: Date;
    sessions: Array<{
      sessionId: string;
      title: string;
      description: string;
      startTime: Date;
      endTime: Date;
      duration: number; // in minutes
      sessionType: string; // 'plenary', 'breakout', 'workshop', 'networking', 'break', 'lunch'
      room?: string;
      roomCapacity?: number;
      speakers: Array<{
        name: string;
        title: string;
        organization: string;
        bio?: string;
        profileImage?: string;
        email?: string;
        linkedin?: string;
      }>;
      moderator?: {
        name: string;
        title: string;
        organization: string;
      };
      isBreakoutSession: boolean;
      objectives?: string[];
      liveStreamAvailable: boolean;
      recordingAvailable: boolean;
      eventLink?: string;
    }>;
  }>;

  //   @Prop({ type: [String], default: [] })
  //   requiredDocuments: string[];

  //   @Prop({ default: true })
  //   requiresApproval: boolean;

  @Prop({ type: Object, required: true })
  contactInfo: {
    primaryContact: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    technicalSupport: {
      email: string;
      phone: string;
    };
    registrationSupport: {
      email: string;
      phone: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
    };
  };

  @Prop({ type: Object })
  logistics: {
    timezone: string;
    language: string;
    currency: string;
    dresscode?: string;
    parking: {
      available: boolean;
      cost?: string;
      instructions?: string;
    };
    accessibility: {
      wheelchairAccessible: boolean;
      signLanguageInterpreter: boolean;
      hearingLoop: boolean;
      other?: string[];
    };
    catering: {
      provided: boolean;
      dietaryOptionsAvailable: string[];
      menuUrl?: string;
    };
    accommodation: {
      recommended: Array<{
        hotelName: string;
        address: string;
        phone: string;
        website?: string;
        specialRate?: string;
        distanceFromVenue: string;
        bookingDeadline?: Date;
        bookingCode?: string;
      }>;
    };
    transportation: {
      airportTransfer: boolean;
      publicTransport: string[];
      shuttleService: boolean;
      instructions?: string;
    };
  };

  @Prop({ type: Object })
  socialMedia: {
    hashtag?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };

  @Prop({ type: Object })
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    themeUrl?: string;
  };

  @Prop()
  cancellationReason: string;

  @Prop()
  notes: string;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ startDate: 1, status: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ eventCode: 1 });
