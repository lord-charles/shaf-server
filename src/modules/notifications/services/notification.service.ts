import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import Expo, {
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushReceiptId,
} from 'expo-server-sdk';
import {
  Delegate,
  DelegateDocument,
} from 'src/modules/delegates/delegates.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Delegate.name)
    private readonly delegateModel: Model<DelegateDocument>,
    private readonly expo: Expo,
  ) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('SMTP_SERVICE'),
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(process.env.SMS_API_URL, {
        apikey: process.env.SMS_API_KEY,
        partnerID: process.env.SMS_PARTNER_ID,
        message: message,
        shortcode: process.env.SMS_SHORTCODE,
        mobile: phoneNumber,
      });

      if (response.status === 200) {
        this.logger.log(`SMS sent successfully to ${phoneNumber}`);
        return true;
      }

      this.logger.error(`Failed to send SMS to ${phoneNumber}`);
      return false;
    } catch (error) {
      this.logger.error(
        `Error sending SMS to ${phoneNumber}: ${error.message}`,
      );
      return false;
    }
  }

  async sendRegistrationPassword(
    email: string,
    message: string,
    phoneNumber?: string,
  ): Promise<boolean> {
    try {
      if (phoneNumber) {
        await this.sendSMS(phoneNumber, message);
      }
      if (email) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2c3e50;">Shelter Afrique Notification</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `;
        await this.sendEmail(
          email,
          'Shelter Afrique: Password Reset',
          emailHtml,
        );
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending registration password: ${error.message}`,
      );
      return false;
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: {
      filename: string;
      content: Buffer | string;
      cid: string;
    }[],
  ): Promise<boolean> {
    try {
      await this.transporter.verify();

      const mailOptions = {
        from: {
          name: 'Shelter Afrique',
          address: this.configService.get<string>('SMTP_USER'),
        },
        to,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${to} - MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`);
      if (error.code === 'ECONNECTION' || error.code === 'EAUTH') {
        this.logger.error(
          'SMTP connection or authentication error. Please check your SMTP settings.',
        );
      }
      return false;
    }
  }

  // --- EXPO PUSH NOTIFICATION METHODS ---

  async saveUserPushToken(
    userId: string,
    token: string,
  ): Promise<DelegateDocument | null> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.error(`Push token ${token} is not a valid Expo push token`);
      return null;
    }

    try {
      const delegate = await this.delegateModel
        .findById(userId)
        .select('+expoPushTokens');
      if (!delegate) {
        this.logger.warn(
          `Delegate with ID ${userId} not found for saving push token.`,
        );
        return null;
      }

      if (!delegate.expoPushTokens.includes(token)) {
        delegate.expoPushTokens.push(token);
        await delegate.save();
        this.logger.log(`Saved push token for delegate ${userId}`);
      } else {
        this.logger.log(`Push token already exists for delegate ${userId}`);
      }
      return delegate;
    } catch (error) {
      this.logger.error(
        `Error saving push token for delegate ${userId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const validTokens = tokens.filter((token) => {
      if (!Expo.isExpoPushToken(token)) {
        this.logger.warn(
          `Token ${token} is not a valid Expo push token and will be skipped.`,
        );
        return false;
      }
      return true;
    });

    if (validTokens.length === 0) {
      this.logger.log('No valid Expo push tokens provided.');
      return;
    }

    const messages: ExpoPushMessage[] = validTokens.map((pushToken) => ({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      // channelId: 'default', // Optional: if you have specific channels on Android
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    this.logger.log(
      `Sending ${messages.length} push notifications in ${chunks.length} chunk(s).`,
    );

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        ticketChunk.forEach((ticket) => {
          if (ticket.status === 'error') {
            this.logger.error(
              `Error sending push notification: ${ticket.message}`,
              ticket.details,
            );
            // Potentially remove invalid tokens from DB here based on error type
            if (
              ticket.details &&
              ticket.details.error === 'DeviceNotRegistered'
            ) {
              // Extract token from the error message, e.g., "The recipient \"ExponentPushToken[xxxxxxxxxxx]\" is not a registered device."
              const match = ticket.message.match(
                /ExponentPushToken\[[a-zA-Z0-9_-]+\]/,
              );
              if (match && match[0]) {
                const invalidToken = match[0];
                this.logger.warn(
                  `DeviceNotRegistered: Attempting to remove token: ${invalidToken}`,
                );
                this.removeInvalidPushToken(invalidToken);
              } else {
                this.logger.warn(
                  `DeviceNotRegistered: Could not parse token from message: ${ticket.message}`,
                );
              }
            }
          }
        });
      } catch (error) {
        this.logger.error(
          `Error sending push notification chunk: ${error.message}`,
          error.stack,
        );
      }
    }
    this.logger.log(
      'Push notifications sent, tickets received:',
      tickets.filter((t) => t.status === 'ok').length + ' ok',
    );
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const delegate = await this.delegateModel
        .findById(userId)
        .select('+expoPushTokens')
        .exec();
      if (!delegate) {
        this.logger.warn(
          `User with ID ${userId} not found for sending push notification.`,
        );
        return;
      }
      if (!delegate.expoPushTokens || delegate.expoPushTokens.length === 0) {
        this.logger.log(`User ${userId} has no registered push tokens.`);
        return;
      }
      await this.sendPushNotification(
        delegate.expoPushTokens,
        title,
        body,
        data,
      );
      this.logger.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error sending push notification to user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendNotificationToAllUsers(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const usersWithTokens = await this.delegateModel
        .find({ expoPushTokens: { $exists: true, $not: { $size: 0 } } })
        .select('expoPushTokens')
        .exec();

      if (!usersWithTokens || usersWithTokens.length === 0) {
        this.logger.log('No users with registered push tokens found.');
        return;
      }

      const allTokens: string[] = usersWithTokens.reduce((acc, user) => {
        if (user.expoPushTokens) {
          acc.push(...user.expoPushTokens);
        }
        return acc;
      }, [] as string[]);

      const uniqueTokens = [...new Set(allTokens)];

      if (uniqueTokens.length > 0) {
        await this.sendPushNotification(uniqueTokens, title, body, data);
        this.logger.log(
          `Push notification sent to ${uniqueTokens.length} tokens for all users.`,
        );
      } else {
        this.logger.log(
          'No unique push tokens found to send notifications to all users.',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending push notification to all users: ${error.message}`,
        error.stack,
      );
    }
  }

  private async removeInvalidPushToken(token: string): Promise<void> {
    try {
      await this.delegateModel.updateMany(
        { expoPushTokens: token },
        { $pull: { expoPushTokens: token } },
      );
      this.logger.log(`Removed invalid push token ${token} from all users.`);
    } catch (error) {
      this.logger.error(
        `Error removing invalid push token ${token}: ${error.message}`,
        error.stack,
      );
    }
  }
}
