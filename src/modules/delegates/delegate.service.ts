import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApproveDelegateDto,
  RejectDelegateDto,
  CheckInDelegateDto,
} from './dto/admin-delegate.dto';
import { DelegateStatus } from './delegates.schema';
import { Delegate, DelegateDocument } from './delegates.schema';
import { JwtService } from '@nestjs/jwt';
import { SystemLogsService } from '../system-logs/services/system-logs.service';
import { LogSeverity } from '../system-logs/schemas/system-log.schema';
import {
  CreateDelegateDto,
  UpdateDelegateDto,
} from './dto/create-delegate.dto';
import {
  AuthResponse,
  JwtPayload,
  TokenPayload,
} from '../auth/interfaces/auth.interface';
import { LoginUserDto } from '../auth/dto/login.dto';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import {
  ConfirmPasswordResetDto,
  RequestPasswordResetDto,
} from '../auth/dto/reset-password.dto';
import { NotificationService } from '../notifications/services/notification.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { NOTIFICATION_QUEUE } from '../queues/constants';
import * as QRCode from 'qrcode';
import { Event, EventDocument } from '../events/events.schema';

@Injectable()
export class DelegatesService {
  private readonly logger = new Logger(DelegatesService.name);

  constructor(
    @InjectModel(Delegate.name)
    private readonly delegateModel: Model<DelegateDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly jwtService: JwtService,
    private readonly systemLogsService: SystemLogsService,
    private readonly notificationService: NotificationService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  // ===========================================================================
  // ADMIN ACTIONS
  // ===========================================================================

  async approve(
    delegateId: string,
    approveDto: ApproveDelegateDto,
    approvedBy: string,
  ): Promise<Delegate> {
    const delegate = await this.delegateModel
      .findById(new Types.ObjectId(delegateId))
      .exec();

    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found`);
    }

    if (delegate.status === DelegateStatus.APPROVED) {
      throw new BadRequestException('Delegate is already approved.');
    }

    // Update delegate status
    delegate.status = DelegateStatus.APPROVED;
    delegate.approvedBy = new Types.ObjectId(approvedBy || '');
    delegate.approvalDate = new Date();

    const updatedDelegate = await delegate.save();

    // --- Notifications ---
    const delegateName = `${delegate.firstName} ${delegate.lastName}`;

    // 1. Generate QR Code for the check-in badge
    const qrCodeData = JSON.stringify({
      delegateId: delegate._id,
      eventYear: delegate.eventYear,
    });
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

    // 2. Create and send email with a professional badge
    const emailSubject = 'Your Registration has been Approved!';
    const emailBody = this.createApprovalEmailTemplate(delegate);
    this.notificationService
      .sendEmail(delegate.email, emailSubject, emailBody, [
        {
          filename: 'qr-code-badge.png',
          content: qrCodeBuffer,
          cid: 'qr-code-badge',
        },
      ])
      .catch((err) => {
        this.logger.error(
          `Failed to send approval email to ${delegate.email}: ${err.message}`,
          err.stack,
        );
      });

    // 3. Send push notification
    const pushTitle = 'Registration Approved!';
    const pushBody = `Congratulations, ${delegateName}! Your registration for the event has been approved.`;
    this.notificationService
      .sendNotificationToUser(delegate._id.toString(), pushTitle, pushBody)
      .catch((err) => {
        this.logger.error(
          `Failed to send approval push notification to delegate ${delegate._id}: ${err.message}`,
          err.stack,
        );
      });

    this.logger.log(
      `Delegate ${delegateId} has been approved by admin ${approveDto.approvedBy}`,
    );
    return updatedDelegate.toObject();
  }

  async reject(
    delegateId: string,
    rejectDto: RejectDelegateDto,
    rejectedBy: string,
  ): Promise<Delegate> {
    const delegate = await this.delegateModel
      .findById(new Types.ObjectId(delegateId))
      .exec();

    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found`);
    }

    if (delegate.status === DelegateStatus.REJECTED) {
      throw new BadRequestException('Delegate is already rejected.');
    }

    // Update delegate status
    delegate.status = DelegateStatus.REJECTED;
    delegate.rejectionReason = rejectDto.rejectionReason;
    delegate.rejectedBy = new Types.ObjectId(rejectedBy || '');
    delegate.rejectionDate = new Date();

    const updatedDelegate = await delegate.save();

    // --- Notifications ---
    const delegateName = `${delegate.firstName} ${delegate.lastName}`;

    // 1. Send email notification
    const emailSubject = 'Update on Your Registration Status';
    const emailBody = `<p>Dear ${delegateName},</p><p>We regret to inform you that your registration has been rejected. Reason: ${delegate.rejectionReason}.</p><p>If you believe this is an error, please contact our support team.</p>`;
    this.notificationService
      .sendEmail(delegate.email, emailSubject, emailBody)
      .catch((err) => {
        this.logger.error(
          `Failed to send rejection email to ${delegate.email}: ${err.message}`,
          err.stack,
        );
      });

    // 2. Send push notification
    const pushTitle = 'Registration Update';
    const pushBody =
      'There is an update on your registration status. Please check your email for details.';
    this.notificationService
      .sendNotificationToUser(delegate._id.toString(), pushTitle, pushBody)
      .catch((err) => {
        this.logger.error(
          `Failed to send rejection push notification to delegate ${delegate._id}: ${err.message}`,
          err.stack,
        );
      });

    this.logger.log(
      `Delegate ${delegateId} has been rejected by admin ${rejectedBy}`,
    );
    return updatedDelegate.toObject();
  }
  async checkIn(
    delegateId: string,
    checkInDto: CheckInDelegateDto,
    checkedInBy: string,
  ): Promise<Delegate> {
    const delegate = await this.delegateModel
      .findById(new Types.ObjectId(delegateId))
      .exec();

    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found`);
    }

    if (delegate.status !== DelegateStatus.APPROVED) {
      throw new BadRequestException(
        `Delegate cannot be checked in. Current status: ${delegate.status}`,
      );
    }

    // Update delegate status
    delegate.status = DelegateStatus.CHECKED_IN;
    delegate.checkedInBy = new Types.ObjectId(checkedInBy || '');
    delegate.checkInDate = new Date();
    delegate.checkInLocation = checkInDto.checkInLocation;

    const updatedDelegate = await delegate.save();

    // --- Notifications ---
    const emailSubject = 'Welcome! You are Checked In';
    const emailBody =
      this.createCheckInConfirmationEmailTemplate(updatedDelegate);
    this.notificationService
      .sendEmail(updatedDelegate.email, emailSubject, emailBody)
      .catch((err) => {
        this.logger.error(
          `Failed to send check-in email to ${updatedDelegate.email}: ${err.message}`,
          err.stack,
        );
      });

    this.logger.log(
      `Delegate ${delegateId} has been checked in by staff ${checkedInBy}`,
    );
    return updatedDelegate.toObject();
  }

  async findOneDocument(id: string): Promise<DelegateDocument> {
    const delegate = await this.delegateModel
      .findById(new Types.ObjectId(id))
      .exec();
    if (!delegate) {
      throw new NotFoundException(`Delegate document with ID ${id} not found`);
    }
    return delegate;
  }

  private createApprovalEmailTemplate(delegate: DelegateDocument): string {
    const delegateName = `${delegate.title} ${delegate.firstName} ${delegate.lastName}`;
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; max-width: 680px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #004a99 0%, #002b5a 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Registration Approved!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 18px;">Dear ${delegateName},</p>
          <p style="font-size: 16px;">We are delighted to inform you that your registration for the event has been approved. Please find your digital check-in badge below.</p>
          
          <div style="border: 2px dashed #004a99; border-radius: 15px; padding: 25px; margin: 30px 0; background-color: #fdfdfd; text-align: center;">
            <h2 style="color: #004a99; margin-top: 0; font-size: 22px; font-weight: 600;">EVENT CHECK-IN BADGE</h2>
            <img src="cid:qr-code-badge" alt="QR Code for Check-in" style="max-width: 220px; margin-top: 20px; border: 5px solid white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 25px; margin-bottom: 8px; font-size: 24px; font-weight: 700; color: #333;">${delegateName}</h3>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Delegate Type:</strong> ${delegate.delegateType}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Event Year:</strong> ${delegate.eventYear}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.configService.get<string>('API_URL')}/delegates/${delegate._id.toString()}/badge" download style="background-color: #004a99; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transition: background-color 0.3s ease;">Download for Print</a>
          </div>

          <p style="font-size: 16px; margin-top: 30px;">Please present this QR code at the registration desk for a quick and seamless check-in process. You can either print this email or show it on your mobile device.</p>
          <p style="font-size: 16px;">We look forward to welcoming you to the event!</p>
          <p style="font-size: 16px; margin-top: 30px;">Best regards,<br><strong>The Event Team</strong></p>
        </div>
        <div style="background-color: #f8f9fa; color: #888; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;
  }

  private createCheckInConfirmationEmailTemplate(
    delegate: DelegateDocument,
  ): string {
    const delegateName = `${delegate.title} ${delegate.firstName} ${delegate.lastName}`;
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; max-width: 680px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to the Event!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 18px;">Dear ${delegateName},</p>
          <p style="font-size: 16px;">This email confirms that you have been successfully checked in at <strong>${delegate.checkInLocation}</strong>. We are thrilled to have you with us!</p>
          <p style="font-size: 16px;">We hope you have an inspiring and productive time at the event. If you need any assistance, please do not hesitate to contact our staff.</p>
          <p style="font-size: 16px; margin-top: 30px;">Enjoy the event!</p>
          <p style="font-size: 16px; margin-top: 30px;">Best regards,<br><strong>The Event Team</strong></p>
        </div>
        <div style="background-color: #f8f9fa; color: #888; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;
  }

  private createRegistrationReceivedEmailTemplate(
    delegate: DelegateDocument,
  ): string {
    const delegateName = `${delegate.title} ${delegate.firstName} ${delegate.lastName}`;
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; max-width: 680px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Registration Received</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 18px;">Dear ${delegateName},</p>
          <p style="font-size: 16px;">Thank you for registering for the upcoming event. We have successfully received your information, and it is now under review by our team.</p>
          <p style="font-size: 16px;">You will receive another email notification once your registration has been approved. Please keep an eye on your inbox.</p>
          <p style="font-size: 16px; margin-top: 30px;">We appreciate your patience.</p>
          <p style="font-size: 16px; margin-top: 30px;">Best regards,<br><strong>The Event Team</strong></p>
        </div>
        <div style="background-color: #f8f9fa; color: #888; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;
  }

  async create(createDelegateDto: CreateDelegateDto): Promise<Delegate> {
    try {
      this.logger.log(`Creating delegate: ${createDelegateDto.email}`);
      const currentYearEventExists = await this.eventModel
        .findOne({
          eventYear: createDelegateDto.eventYear,
        })
        .exec();

      if (!currentYearEventExists) {
        throw new NotFoundException(
          `Event for year ${createDelegateDto.eventYear} not found`,
        );
      }
      // Check if delegate with same email already exists
      const existingDelegate = await this.delegateModel
        .findOne({
          email: createDelegateDto.email,
          eventYear: createDelegateDto.eventYear,
        })
        .exec();

      if (existingDelegate) {
        throw new ConflictException(
          `Delegate with email ${createDelegateDto.email} and event year ${createDelegateDto.eventYear} already exists`,
        );
      }

      // Validate eventId format
      if (!Types.ObjectId.isValid(createDelegateDto.eventId)) {
        throw new BadRequestException('Invalid event ID format');
      }

      // Hash the password before saving
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(
        createDelegateDto.password,
        salt,
      );

      // Create the delegate
      const createdDelegate = new this.delegateModel({
        ...createDelegateDto,
        password: hashedPassword,
      });
      const savedDelegate = await createdDelegate.save();

      // --- Send Registration Confirmation Email ---
      const emailSubject = 'Shelter Afrique - Registration Confirmation';
      const emailBody =
        this.createRegistrationReceivedEmailTemplate(savedDelegate);

      this.notificationService
        .sendEmail(savedDelegate.email, emailSubject, emailBody)
        .then(() => {
          this.logger.log(
            `Sent registration confirmation email to: ${savedDelegate.email}`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `Failed to send registration email to ${savedDelegate.email}: ${err.message}`,
            err.stack,
          );
        });
      // --- End of Email Notification ---

      // --- Schedule Push Notification via BullMQ ---
      const pushTitle = 'Registration Under Review';
      const pushBody = `Hi ${savedDelegate.title} ${savedDelegate.firstName} ${savedDelegate.lastName}, thank you for registering. We are currently reviewing your details and will notify you upon approval.`;
      const jobData = {
        delegateId: savedDelegate._id.toString(),
        title: pushTitle,
        body: pushBody,
      };

      await this.notificationQueue.add('send-push-notification', jobData, {
        delay: 5 * 60 * 1000, // 5 minutes delay
        removeOnComplete: true,
        removeOnFail: true,
      });

      this.logger.log(
        `Scheduled push notification job for delegate ID: ${savedDelegate._id}`,
      );
      // --- End of Push Notification Scheduling ---

      this.logger.log(
        `Successfully created delegate with ID: ${savedDelegate._id}`,
      );
      return savedDelegate.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to create delegate: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${validationErrors.join(', ')}`,
        );
      }

      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(
          `Delegate with this ${duplicateField} already exists`,
        );
      }

      throw new InternalServerErrorException('Failed to create delegate');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    eventId?: string,
    delegateType?: string,
    attendanceMode?: string,
  ): Promise<{
    delegates: Delegate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.log(`Fetching delegates - Page: ${page}, Limit: ${limit}`);

      const skip = (page - 1) * limit;
      const filter: any = {};

      // Build filter object
      if (eventId) {
        if (!Types.ObjectId.isValid(eventId)) {
          throw new BadRequestException('Invalid event ID format');
        }
        filter.eventId = eventId;
      }

      if (delegateType) {
        filter.delegateType = delegateType;
      }

      if (attendanceMode) {
        filter.attendanceMode = attendanceMode;
      }

      // Execute queries in parallel
      const [delegates, total] = await Promise.all([
        this.delegateModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
        this.delegateModel.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Successfully fetched ${delegates.length} delegates`);

      return {
        delegates: delegates.map((delegate) => delegate.toObject()),
        total,
        page,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch delegates: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch delegates');
    }
  }

  async findOne(id: string): Promise<Delegate> {
    try {
      this.logger.log(`Fetching delegate with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid delegate ID format');
      }

      const delegate = await this.delegateModel.findById(id).exec();

      if (!delegate) {
        throw new NotFoundException(`Delegate with ID ${id} not found`);
      }

      this.logger.log(`Successfully fetched delegate: ${delegate.email}`);
      return delegate.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to fetch delegate: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch delegate');
    }
  }

  async findByEmail(email: string): Promise<Delegate> {
    try {
      this.logger.log(`Fetching delegate with email: ${email}`);

      if (!email || !email.includes('@')) {
        throw new BadRequestException('Invalid email format');
      }

      const delegate = await this.delegateModel.findOne({ email }).exec();

      if (!delegate) {
        throw new NotFoundException(`Delegate with email ${email} not found`);
      }

      this.logger.log(`Successfully fetched delegate: ${delegate.email}`);
      return delegate.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to fetch delegate by email: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch delegate');
    }
  }

  async update(
    id: string,
    updateDelegateDto: UpdateDelegateDto,
  ): Promise<Delegate> {
    try {
      this.logger.log(`Updating delegate with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid delegate ID format');
      }

      // If email is being updated, check for conflicts
      if (updateDelegateDto.email) {
        const existingDelegate = await this.delegateModel
          .findOne({ email: updateDelegateDto.email, _id: { $ne: id } })
          .exec();

        if (existingDelegate) {
          throw new ConflictException(
            `Another delegate with email ${updateDelegateDto.email} already exists`,
          );
        }
      }

      // Validate eventId if provided
      if (
        updateDelegateDto.eventId &&
        !Types.ObjectId.isValid(updateDelegateDto.eventId)
      ) {
        throw new BadRequestException('Invalid event ID format');
      }

      const updatedDelegate = await this.delegateModel
        .findByIdAndUpdate(id, updateDelegateDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedDelegate) {
        throw new NotFoundException(`Delegate with ID ${id} not found`);
      }

      this.logger.log(
        `Successfully updated delegate: ${updatedDelegate.email}`,
      );
      return updatedDelegate.toObject();
    } catch (error) {
      this.logger.error(
        `Failed to update delegate: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${validationErrors.join(', ')}`,
        );
      }

      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new ConflictException(
          `Delegate with this ${duplicateField} already exists`,
        );
      }

      throw new InternalServerErrorException('Failed to update delegate');
    }
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    try {
      this.logger.log(`Deleting delegate with ID: ${id}`);

      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid delegate ID format');
      }

      const deletedDelegate = await this.delegateModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedDelegate) {
        throw new NotFoundException(`Delegate with ID ${id} not found`);
      }

      this.logger.log(
        `Successfully deleted delegate: ${deletedDelegate.email}`,
      );
      return {
        message: 'Delegate successfully deleted',
        deletedId: id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete delegate: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete delegate');
    }
  }

  async getStatistics(eventId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byAttendanceMode: Record<string, number>;
    byNationality: Record<string, number>;
  }> {
    try {
      this.logger.log(`Generating delegate statistics`);

      const filter: any = {};
      if (eventId) {
        if (!Types.ObjectId.isValid(eventId)) {
          throw new BadRequestException('Invalid event ID format');
        }
        filter.eventId = eventId;
      }

      const [total, byType, byAttendanceMode, byNationality] =
        await Promise.all([
          this.delegateModel.countDocuments(filter).exec(),
          this.delegateModel
            .aggregate([
              { $match: filter },
              { $group: { _id: '$delegateType', count: { $sum: 1 } } },
            ])
            .exec(),
          this.delegateModel
            .aggregate([
              { $match: filter },
              { $group: { _id: '$attendanceMode', count: { $sum: 1 } } },
            ])
            .exec(),
          this.delegateModel
            .aggregate([
              { $match: filter },
              { $group: { _id: '$nationality', count: { $sum: 1 } } },
            ])
            .exec(),
        ]);

      const statistics = {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byAttendanceMode: byAttendanceMode.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byNationality: byNationality.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      this.logger.log(`Successfully generated delegate statistics`);
      return statistics;
    } catch (error) {
      this.logger.error(
        `Failed to generate statistics: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to generate delegate statistics',
      );
    }
  }
  // ===========================================================================
  // AUTH ACTIONS
  // ===========================================================================

  private async findDelegateForAuth(
    email: string,
  ): Promise<DelegateDocument | null> {
    return this.delegateModel
      .findOne({ email })
      .select('+password +resetPasswordPin +resetPasswordExpires')
      .exec();
  }

  async login(
    loginUserDto: LoginUserDto,
    req?: Request,
  ): Promise<AuthResponse> {
    try {
      const user = await this.findDelegateForAuth(loginUserDto.email);

      if (!user) {
        await this.systemLogsService.createLog(
          'ShafDb Login Failed',
          `User not found with email: ${loginUserDto.email}`,
          LogSeverity.WARNING,
          undefined,
          req,
        );
        throw new UnauthorizedException(
          'ShafDb: Invalid credentials or user not found.',
        );
      }

      if (user.status !== DelegateStatus.APPROVED) {
        await this.systemLogsService.createLog(
          'Inactive Account Login',
          `Login attempt on inactive account: ${user.firstName} ${user.lastName}`,
          LogSeverity.WARNING,
          user.phoneNumber.toString(),
          req,
        );
        throw new UnauthorizedException(
          'Delegate Account has not been approved!',
        );
      }

      if (!user.password) {
        await this.systemLogsService.createLog(
          'ShafDb Login Error',
          `Password field not loaded for user: ${user.email}`,
          LogSeverity.ERROR,
          user.phoneNumber?.toString(),
          req,
        );
        throw new UnauthorizedException(
          'ShafDb: Authentication process error.',
        );
      }
      const isValidPassword = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );
      if (!isValidPassword) {
        await this.systemLogsService.createLog(
          'ShafDb Invalid Password',
          `Invalid password for user: ${user.firstName} ${user.lastName} (${user.email})`,
          LogSeverity.WARNING,
          user.phoneNumber?.toString(),
          req,
        );
        throw new UnauthorizedException(
          'ShafDb: Invalid credentials or Delegate not found.',
        );
      }

      const token = await this.generateToken(user);

      await this.systemLogsService.createLog(
        'ShafDb User Login',
        `User ${user.firstName} ${user.lastName} (${user.email}) logged in successfully for ShafDb.`,
        LogSeverity.INFO,
        user.phoneNumber?.toString(),
        req,
      );

      return {
        user: this.sanitizeUser(user),
        token: token.token,
      };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        await this.systemLogsService.createLog(
          'Login Error',
          `Unexpected error during login: ${error.message}`,
          LogSeverity.ERROR,
          undefined,
          req,
        );
      }
      throw error;
    }
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
    req?: Request,
  ): Promise<{ message: string }> {
    try {
      const user = await this.findDelegateForAuth(
        requestPasswordResetDto.email,
      );
      if (!user) {
        await this.systemLogsService.createLog(
          'ShafDb Password Reset Request Failed',
          `Password reset attempt for non-existent email: ${requestPasswordResetDto.email}`,
          LogSeverity.WARNING,
          undefined,
          req,
        );
        return {
          message:
            'ShafDb: If your email is registered, you will receive a password reset PIN.',
        };
      }

      const resetPin = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // PIN expires in 10 minutes

      user.resetPasswordPin = resetPin;
      user.resetPasswordExpires = expiryDate;
      await (user as DelegateDocument).save();

      const resetMessage = `Your ShafDb password reset PIN is: ${resetPin}. This PIN will expire in 10 minutes. Please keep this PIN secure and do not share it with anyone.`;
      await this.notificationService.sendRegistrationPassword(
        user.email,
        resetMessage,
      );

      await this.systemLogsService.createLog(
        'ShafDb Password Reset Requested',
        `Password reset PIN generated for user: ${user.firstName} ${user.lastName} (${user.email})`,
        LogSeverity.INFO,
        user.phoneNumber?.toString(),
        req,
      );

      return {
        message:
          'ShafDb: If your email is registered, you will receive a password reset PIN.',
      };
    } catch (error) {
      await this.systemLogsService.createLog(
        'ShafDb Password Reset Request Error',
        `Error during password reset request for ${requestPasswordResetDto.email}: ${error.message}`,
        LogSeverity.ERROR,
        undefined,
        req,
      );
      throw new BadRequestException(
        'ShafDb: Could not process password reset request. Please try again later.',
      );
    }
  }

  async confirmPasswordReset(
    confirmPasswordResetDto: ConfirmPasswordResetDto,
    req?: Request,
  ): Promise<{ message: string }> {
    try {
      const user = await this.findDelegateForAuth(
        confirmPasswordResetDto.email,
      );

      if (!user || !user.resetPasswordPin || !user.resetPasswordExpires) {
        throw new BadRequestException(
          'ShafDb: Invalid or expired password reset PIN.',
        );
      }

      if (user.resetPasswordExpires < new Date()) {
        await this.systemLogsService.createLog(
          'ShafDb Password Reset PIN Expired',
          `Expired PIN used for ${user.email}`,
          LogSeverity.WARNING,
          user.phoneNumber?.toString(),
          req,
        );
        throw new BadRequestException(
          'ShafDb: Password reset PIN has expired.',
        );
      }

      if (user.resetPasswordPin !== confirmPasswordResetDto.resetToken) {
        throw new BadRequestException('ShafDb: Invalid password reset PIN.');
      }

      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(
        confirmPasswordResetDto.newPassword,
        salt,
      );
      user.resetPasswordPin = undefined;
      user.resetPasswordExpires = undefined;
      await (user as DelegateDocument).save();

      await this.systemLogsService.createLog(
        'ShafDb Password Reset Confirmed',
        `Password successfully reset for user: ${user.firstName} ${user.lastName} (${user.email})`,
        LogSeverity.INFO,
        user.phoneNumber?.toString(),
        req,
      );

      return { message: 'ShafDb: Your password has been successfully reset.' };
    } catch (error) {
      await this.systemLogsService.createLog(
        'ShafDb Password Reset Confirmation Failed',
        `Error confirming password reset for ${confirmPasswordResetDto.email}: ${error.message}`,
        LogSeverity.ERROR,
        undefined,
        req,
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'ShafDb: Could not reset password. Please try again.',
      );
    }
  }

  private async generateToken(user: Delegate): Promise<TokenPayload> {
    const payload: JwtPayload = {
      sub: (user as DelegateDocument)._id.toString(),
      email: user.email,
      roles: [],
    };

    // For 1 year: 365 days * 24 hours * 60 minutes * 60 seconds
    const token = this.jwtService.sign(payload, {
      expiresIn: 365 * 24 * 60 * 60,
    });

    return {
      token,
      expiresIn: 365 * 24 * 60 * 60,
    };
  }

  async findById(id: string): Promise<Delegate | null> {
    const user = await this.delegateModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('delegate not found');
    }
    return user;
  }

  // Remove sensitive information from user object
  sanitizeUser(user: Delegate | DelegateDocument): Partial<Delegate> {
    const userObj = 'toObject' in user ? user.toObject() : user;
    // Ensure all sensitive fields are excluded
    const {
      password,
      pin,
      resetPasswordPin,
      resetPasswordExpires,
      ...sanitizedUser
    } = userObj as any;
    return sanitizedUser;
  }
}
