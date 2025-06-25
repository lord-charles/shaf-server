import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DelegateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  CHECKED_IN = 'checked_in',
}

export enum AttendanceMode {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum IdentificationType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVERS_LICENSE = 'drivers_license',
  DIPLOMATIC_ID = 'diplomatic_id',
}

export enum DelegateType {
  BOARD_MEMBER = 'board_member',
  OBSERVER = 'observer',
  GUEST = 'guest',
  SHAF_STAFF = 'shaf_staff',
  MINISTRY_STAFF = 'ministry_staff',
  PRESS = 'press',
  OTHER = 'other',
}

export enum Title {
  MR = 'Mr.',
  MRS = 'Mrs.',
  MS = 'Ms.',
  DR = 'Dr.',
  PROF = 'Prof.',
  REV = 'Rev.',
  HON = 'Hon.',
  ENG = 'Eng.',
}

// Delegate Schema
@Schema({
  timestamps: true,
  collection: 'delegates',
})
export class Delegate {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  nationality: string;

  @Prop()
  organization: string;

  @Prop()
  position: string;

  @Prop({ type: String, enum: DelegateType, required: true })
  delegateType: DelegateType;

  @Prop({ type: String, enum: AttendanceMode, required: true })
  attendanceMode: AttendanceMode;

  @Prop({ type: Object, required: true })
  identification: {
    type: IdentificationType;
    number: string;
    expiryDate?: Date;
    issuingCountry: string;
    documentUrl?: string;
  };

  @Prop()
  profilePicture: string;

  @Prop({ type: [String], required: true })
  languagesSpoken: string[];

  @Prop()
  preferredLanguage: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    comment:
      'The year of the event this delegate registration pertains to. Should be derived from the associated event.',
  })
  eventYear: number;

  @Prop({ type: String, enum: DelegateStatus, default: DelegateStatus.PENDING })
  status: DelegateStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  approvalDate: Date;

  @Prop()
  rejectionReason: string;

  @Prop()
  rejectionDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy: Types.ObjectId;

  @Prop()
  registrationDate: Date;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  @Prop({ type: Object })
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };

  @Prop({ default: false })
  hasAccommodation: boolean;

  @Prop({ type: Object })
  accommodationDetails: {
    hotelName?: string;
    checkIn?: Date;
    checkOut?: Date;
    roomPreference?: string;
  };

  @Prop({ default: false })
  requiresVisa: boolean;

  @Prop()
  visaStatus: string;

  @Prop()
  arrivalDate: Date;

  @Prop()
  departureDate: Date;

  @Prop({ type: Object })
  flightDetails: {
    arrivalFlight?: string;
    departureFlight?: string;
  };

  @Prop()
  qrCode: string;

  @Prop({ default: false })
  hasCheckedIn: boolean;

  @Prop()
  checkInDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  checkedInBy: Types.ObjectId;

  @Prop()
  checkInNotes: string;

  @Prop()
  checkInLocation: string;

  @Prop({ type: Object })
  socialMedia: {
    linkedin?: string;
    twitter?: string;
  };

  @Prop()
  bio: string;

  @Prop({ default: true })
  consentToPhotography: boolean;

  @Prop({ default: true })
  consentToDataProcessing: boolean;

  @Prop({ type: [String], default: [], select: false })
  expoPushTokens: string[];

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ required: false, select: false })
  pin?: string;

  @Prop({ required: false, select: false })
  resetPasswordPin?: string;

  @Prop({ type: Date, required: false, select: false })
  resetPasswordExpires?: Date;
  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;
}

export type DelegateDocument = Delegate & Document;
export const DelegateSchema = SchemaFactory.createForClass(Delegate);

DelegateSchema.index({ eventId: 1, status: 1 });
DelegateSchema.index({ email: 1, eventId: 1 });
DelegateSchema.index({ nationality: 1 });
DelegateSchema.index({ organization: 1 });
DelegateSchema.index({ delegateType: 1 });
DelegateSchema.index({ eventYear: 1 });

DelegateSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Transform output to include virtuals
DelegateSchema.set('toJSON', { virtuals: true });
