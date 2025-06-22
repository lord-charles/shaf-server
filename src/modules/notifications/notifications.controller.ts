import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { DelegateDocument } from '../delegates/delegates.schema';
import { Public } from '../auth/decorators/public.decorator';

class SendNotificationDto {
  @ApiProperty({ description: 'Title of the notification' })
  title: string;

  @ApiProperty({ description: 'Body of the notification' })
  body: string;

  @ApiProperty({ description: 'Optional data payload (JSON)', required: false })
  data?: Record<string, unknown>;
}

class SendEmailDto {
  @ApiProperty({ description: 'Title of the email' })
  title: string;

  @ApiProperty({ description: 'HTML body of the email' })
  body: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationService: NotificationService) {}

  // --- Push Notifications ---
  @Post('push/delegate/:delegateId')
  @ApiOperation({ summary: 'Send push notification to a specific delegate' })
  @ApiParam({ name: 'delegateId', description: 'ID of the delegate to notify' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendPushToDelegate(
    @Param('delegateId') delegateId: string,
    @Body() payload: SendNotificationDto,
  ) {
    await this.notificationService.sendNotificationToDelegate(
      delegateId,
      payload.title,
      payload.body,
      payload.data,
    );
    return { message: 'Push notification queued for delegate.' };
  }

  @Post('push/all')
  @ApiOperation({ summary: 'Send push notification to all delegates' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendPushToAll(@Body() payload: SendNotificationDto) {
    await this.notificationService.sendNotificationToAllDelegates(
      payload.title,
      payload.body,
      payload.data,
    );
    return { message: 'Push notifications queued for all delegates.' };
  }

  // --- Email Notifications ---
  @Post('email/delegate/:delegateId')
  @ApiOperation({ summary: 'Send an email to a specific delegate' })
  @ApiParam({ name: 'delegateId', description: 'ID of the delegate to email' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendEmailToDelegate(
    @Param('delegateId') delegateId: string,
    @Body() payload: SendEmailDto,
  ) {
    await this.notificationService.sendEmailToDelegate(
      delegateId,
      payload.title,
      payload.body,
    );
    return { message: 'Email queued for delegate.' };
  }

  @Post('email/all')
  @ApiOperation({ summary: 'Send an email to all delegates' })
  @HttpCode(HttpStatus.ACCEPTED)
  async sendEmailToAll(@Body() payload: SendEmailDto) {
    await this.notificationService.sendEmailToAllDelegates(
      payload.title,
      payload.body,
    );
    return { message: 'Emails queued for all delegates.' };
  }

  // --- User-specific Notification Management ---
  @Get('my-notifications/:delegateId')
  @Public()
  @ApiOperation({
    summary: 'Get all notifications for the authenticated delegate',
  })
  async getMyNotifications(@Param('delegateId') delegateId: string) {
    return this.notificationService.getNotificationsForDelegate(delegateId);
  }

  @Patch('read/all/:delegateId')
  @Public()
  @ApiOperation({
    summary: 'Mark all notifications as read for the authenticated delegate',
  })
  @ApiParam({ name: 'delegateId', description: 'ID of the delegate' })
  async markAllAsRead(@Param('delegateId') delegateId: string) {
    return this.notificationService.markAllNotificationsAsRead(delegateId);
  }

  @Patch('read/:delegateId/:notificationId')
  @Public()
  @ApiOperation({
    summary: 'Mark a notification as read for the authenticated delegate',
  })
  @ApiParam({ name: 'delegateId', description: 'ID of the delegate' })
  @ApiParam({
    name: 'notificationId',
    description: 'ID of the notification to mark as read',
  })
  async markAsRead(
    @Param('delegateId') delegateId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(
      delegateId,
      notificationId,
    );
  }
}
