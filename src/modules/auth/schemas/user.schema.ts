import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'Employee first name', example: 'Jane' })
  @Prop({ required: true })
  firstName: string;

  @ApiProperty({ description: 'Employee last name', example: 'Wanjiku' })
  @Prop({ required: true })
  lastName: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'jane.wanjiku@ofgen.com',
  })
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+254712345678',
  })
  @Prop({ required: true, unique: true, index: true })
  phoneNumber: string;

  @ApiProperty({
    description: 'National ID of the employee',
    example: '23456789',
  })
  @Prop({ required: true, unique: true })
  nationalId: string;

  @ApiProperty({
    description: 'User password (hashed)',
    example: 'h$shedP@sswOrd',
  })
  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty({
    description: 'Password reset PIN',
    example: '123456',
    required: false,
  })
  @Prop({ type: String, required: false, select: false })
  resetPasswordPin?: string;

  @ApiProperty({
    description: 'Expiry date for password reset PIN',
    required: false,
  })
  @Prop({ type: Date, required: false, select: false })
  resetPasswordExpires?: Date;

  @ApiProperty({
    description: 'Status of the employee account',
    example: 'active',
    enum: ['active', 'inactive', 'suspended', 'terminated'],
  })
  @Prop({ type: String, default: 'active' })
  status: string;

  @ApiProperty({ description: 'Employee date of birth', example: '1990-01-15' })
  @Prop({ required: false })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Roles assigned in the app',
    example: ['employee'],
  })
  @Prop({
    type: [String],
    default: ['employee'],
    enum: ['employee', 'admin', 'hr', 'finance'],
  })
  roles: string[];

  @ApiProperty({
    description: 'Employee ID or staff number',
    example: 'EMP2024001',
  })
  @Prop({ required: false, unique: true })
  employeeId?: string;

  @ApiProperty({
    description: 'Job title or position',
    example: 'Senior Software Engineer',
  })
  @Prop({ required: true })
  position: string;

  @ApiProperty({
    description: 'Employment end date (if applicable)',
    example: '2024-12-31',
  })
  @Prop()
  employmentEndDate?: Date;

  @ApiProperty({
    description: 'Type of employment',
    example: 'full-time',
    enum: ['full-time', 'part-time', 'contract', 'intern'],
  })
  @Prop({ required: true })
  employmentType: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;

  @ApiProperty({
    description: 'Expo push notification tokens for the user',
    example: [
      'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]',
    ],
    required: false,
    type: [String],
  })
  @Prop({ type: [String], required: false, default: [] })
  expoPushTokens?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ _id: false, timestamps: true })
export class Counter {
  @ApiProperty({ required: true })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ required: true, default: 0 })
  @Prop({ required: true, default: 0 })
  sequenceValue: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (!this.employeeId) {
    const counter = await this.db
      .model('Counter', CounterSchema)
      .findOneAndUpdate(
        { name: 'employeeId' },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true },
      );
    this.employeeId = `EMP-${counter.sequenceValue
      .toString()
      .padStart(3, '0')}`;
  }
  next();
});
