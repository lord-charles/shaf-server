import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoDocument = Video & Document;

export enum VideoCategory {
  OPENING_CEREMONY = 'opening_ceremony',
  KEYNOTE_SPEECH = 'keynote_speech',
  PANEL_DISCUSSION = 'panel_discussion',
  PRESENTATION = 'presentation',
  WORKSHOP = 'workshop',
  NETWORKING = 'networking',
  CLOSING_CEREMONY = 'closing_ceremony',
  SPECIAL_SESSION = 'special_session',
  CULTURAL_EVENT = 'cultural_event',
  AWARD_CEREMONY = 'award_ceremony',
  AGM_SESSION = 'agm_session',
  BOARD_MEETING = 'board_meeting',
  INVESTOR_PRESENTATION = 'investor_presentation',
  FINANCIAL_REPORT = 'financial_report',
  CEO_SPEECH = 'ceo_speech',
  GUEST_SPEAKER = 'guest_speaker',
  TECHNICAL_SESSION = 'technical_session',
  PROJECT_LAUNCH = 'project_launch',
  PARTNER_SESSION = 'partner_session',
  QA_SESSION = 'qa_session',
  MEDIA_BRIEFING = 'media_briefing',
  PRESS_CONFERENCE = 'press_conference',
  GALA_DINNER = 'gala_dinner',
  WELCOME_RECEPTION = 'welcome_reception',
  COFFEE_BREAK = 'coffee_break',
  LUNCH_BREAK = 'lunch_break',
  EXHIBITION = 'exhibition',
  SITE_VISIT = 'site_visit',
  GROUP_PHOTO = 'group_photo',
  ENTERTAINMENT = 'entertainment',
  REGISTRATION = 'registration',
  OTHER = 'other',
}

export enum VideoStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  description: string;

  @Prop({
    required: true,
  })
  youtubeUrl: string;

  @Prop({ required: true, enum: VideoCategory })
  category: VideoCategory;

  @Prop({ required: true })
  agmYear: number;

  @Prop({ required: true })
  eventDate: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, trim: true })
  speaker: string;

  @Prop({ trim: true })
  speakerTitle?: string;

  @Prop({ trim: true })
  organization?: string;

  @Prop({ default: 0, min: 0 })
  duration: number; // in minutes

  @Prop({ type: String, enum: VideoStatus, default: VideoStatus.PENDING })
  status: VideoStatus;

  @Prop({ trim: true })
  moderationNotes?: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isHighlight: boolean;

  @Prop({ type: Object })
  metadata?: {
    sessionNumber?: number;
    room?: string;
    language?: string;
    hasTranscript?: boolean;
    hasCaptions?: boolean;
  };
}

export const VideoSchema = SchemaFactory.createForClass(Video);

VideoSchema.index({ agmYear: 1, category: 1 });
VideoSchema.index({ status: 1 });
VideoSchema.index({ eventDate: -1 });
VideoSchema.index({ tags: 1 });
