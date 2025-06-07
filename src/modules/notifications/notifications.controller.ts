import { Controller, Post, Body, Param, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { NotificationService } from './services/notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming admin/specific role guard might be needed
import { Roles } from '../auth/decorators/roles.decorator'; // If you have role-based access
import { RolesGuard } from '../auth/guards/roles.guard'; // If you have role-based access

// DTO for sending notifications
class SendNotificationDto {
  @ApiProperty({ description: 'Title of the notification', example: 'New Update Available' })
  title: string;

  @ApiProperty({ description: 'Body of the notification', example: 'Check out the latest features in version 2.0!' })
  body: string;

  @ApiProperty({ description: 'Optional data payload (JSON)', example: { screen: 'UpdatesScreen', itemId: '123' }, required: false })
  data?: Record<string, unknown>;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
// @UseGuards(JwtAuthGuard, RolesGuard) // Apply guards globally or per-route as needed
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post('send/user/:userId')
  @UseGuards(JwtAuthGuard) // Protect this endpoint
  // @Roles('admin') // Example: Only admins can send to specific users
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to a specific user' })
  @ApiParam({ name: 'userId', description: 'ID of the user to send notification to' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification sent successfully or queued.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async sendToUser(
    @Param('userId') userId: string,
    @Body() payload: SendNotificationDto,
  ) {
    this.logger.log(`Attempting to send notification to user: ${userId}`);
    await this.notificationService.sendNotificationToUser(
      userId,
      payload.title,
      payload.body,
      payload.data,
    );
    return { success: true, message: 'Notification queued for user.' };
  }

  @Post('send/all')
  @UseGuards(JwtAuthGuard) // Protect this endpoint
  // @Roles('admin') // Example: Only admins can send to all users
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to all users' })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully or queued to all users.' })
  async sendToAll(@Body() payload: SendNotificationDto) {
    this.logger.log('Attempting to send notification to all users');
    await this.notificationService.sendNotificationToAllUsers(
      payload.title,
      payload.body,
      payload.data,
    );
    return { success: true, message: 'Notifications queued for all users.' };
  }
}
