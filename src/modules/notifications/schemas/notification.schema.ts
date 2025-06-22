import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Delegate } from '../../delegates/delegates.schema';

export type NotificationDocument = Notification & Document;

export enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({ type: String, description: 'Recipient User ID' })
  @Prop({ type: Types.ObjectId, ref: 'Delegate', required: true, index: true })
  recipient: Types.ObjectId | Delegate;

  @ApiProperty({ type: String, description: 'Notification Title' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ type: String, description: 'Notification Body' })
  @Prop({ required: true })
  body: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
  })
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @ApiProperty({
    enum: NotificationStatus,
    description: 'Status of the notification',
    default: NotificationStatus.UNREAD,
  })
  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
    index: true,
  })
  status: NotificationStatus;

  @ApiProperty({
    description: 'Additional data payload for push notifications',
    required: false,
    type: Object,
  })
  @Prop({ type: Object })
  data?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
