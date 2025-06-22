import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
  NotificationType,
} from '../schemas/notification.schema';
import { Delegate, DelegateDocument } from '../../delegates/delegates.schema';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Delegate.name)
    private readonly delegateModel: Model<DelegateDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly expo: Expo,
  ) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('SMTP_SERVICE'),
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private async _saveNotification(
    notificationDetails: Partial<Notification>,
  ): Promise<void> {
    try {
      await this.notificationModel.create(notificationDetails);
    } catch (error) {
      this.logger.error(
        `Failed to save notification: ${error.message}`,
        error.stack,
      );
    }
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
    bcc?: string[],
  ): Promise<boolean> {
    try {
      await this.transporter.verify();
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Shelter Afrique" <${this.configService.get<string>('SMTP_USER')}>`,
        to,
        subject,
        html,
      };

      if (bcc && bcc.length > 0) {
        mailOptions.bcc = bcc;
      }

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${to}` +
          (bcc ? ` and ${bcc.length} other(s) in BCC` : ''),
      );
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`);
      return false;
    }
  }
  async sendEmailWithAttachments(
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

  async sendEmailToDelegate(
    delegateId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const delegate = await this.delegateModel
      .findById(delegateId)
      .select('+expoPushTokens')
      .exec();

    if (!delegate || !delegate.email) {
      throw new NotFoundException(
        `Delegate with ID ${delegateId} not found or has no email.`,
      );
    }
    const success = await this.sendEmail(delegate.email, title, body);
    if (success) {
      await this._saveNotification({
        recipient: delegate._id as Types.ObjectId,
        title,
        body,
        type: NotificationType.EMAIL,
        data,
      });

      if (delegate.expoPushTokens && delegate.expoPushTokens.length > 0) {
        await this._sendPushNotification(
          delegate.expoPushTokens,
          title,
          body,
          data,
        );
      }
    }
  }

  async sendEmailToAllDelegates(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const delegates = await this.delegateModel
      .find({ email: { $exists: true, $ne: null } })
      .select('+expoPushTokens')
      .exec();

    if (delegates.length === 0) {
      this.logger.log('No delegates with emails found to send to.');
      return;
    }

    this.logger.log(
      `Queueing a single email for ${delegates.length} delegates.`,
    );

    const emails = delegates.map((d) => d.email);
    const [to, ...bcc] = emails;

    const success = await this.sendEmail(to, title, body, bcc);

    if (success) {
      this.logger.log(
        `Email sent to all delegates. Saving notifications and sending pushes.`,
      );

      const allTokens = delegates.flatMap(
        (delegate) => delegate.expoPushTokens || [],
      );
      const uniqueTokens = [...new Set(allTokens)];

      if (uniqueTokens.length > 0) {
        await this._sendPushNotification(uniqueTokens, title, body, data);
      }

      for (const delegate of delegates) {
        await this._saveNotification({
          recipient: delegate._id as Types.ObjectId,
          title,
          body,
          type: NotificationType.EMAIL,
          data,
        });
      }
    } else {
      this.logger.error(
        `Failed to send mass email to delegates. No notifications will be saved.`,
      );
    }
  }

  async saveDelegatePushToken(
    delegateId: string,
    token: string,
  ): Promise<DelegateDocument> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.error(`Push token ${token} is not a valid Expo push token`);
      throw new Error('Invalid Expo push token');
    }
    const delegate = await this.delegateModel.findByIdAndUpdate(
      delegateId,
      { $addToSet: { expoPushTokens: token } },
      { new: true },
    );
    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found.`);
    }
    this.logger.log(`Saved push token for delegate ${delegateId}`);
    return delegate;
  }

  private async _sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map((pushToken) => ({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error('Error sending push notification chunk', error);
      }
    }
  }

  async sendNotificationToDelegate(
    delegateId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const delegate = await this.delegateModel
      .findById(delegateId)
      .select('+expoPushTokens')
      .exec();
    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found.`);
    }
    if (!delegate.expoPushTokens || delegate.expoPushTokens.length === 0) {
      this.logger.log(`Delegate ${delegateId} has no registered push tokens.`);
      return;
    }
    await this._sendPushNotification(
      delegate.expoPushTokens,
      title,
      body,
      data,
    );
    await this._saveNotification({
      recipient: delegate._id as Types.ObjectId,
      title,
      body,
      data,
      type: NotificationType.PUSH,
    });
  }

  async sendNotificationToAllDelegates(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const delegates = await this.delegateModel
      .find({ expoPushTokens: { $exists: true, $ne: [] } })
      .select('+expoPushTokens')
      .exec();
    if (delegates.length === 0) {
      this.logger.log('No delegates with registered push tokens found.');
      return;
    }
    const allTokens = delegates.flatMap((delegate) => delegate.expoPushTokens);
    const uniqueTokens = [...new Set(allTokens)];

    await this._sendPushNotification(uniqueTokens, title, body, data);

    for (const delegate of delegates) {
      await this._saveNotification({
        recipient: delegate._id as Types.ObjectId,
        title,
        body,
        data,
        type: NotificationType.PUSH,
      });
    }
  }

  async getNotificationsForDelegate(
    delegateId: string,
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(delegateId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markNotificationAsRead(
    delegateId: string,
    notificationId: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        recipient: new Types.ObjectId(delegateId),
      },
      { status: NotificationStatus.READ },
      { new: true },
    );
    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found for delegate ${delegateId}.`,
      );
    }
    return notification;
  }

  async markAllNotificationsAsRead(
    delegateId: string,
  ): Promise<{ acknowledged: boolean; modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      {
        recipient: new Types.ObjectId(delegateId),
        status: NotificationStatus.UNREAD,
      },
      { status: NotificationStatus.READ },
    );
    return {
      acknowledged: result.acknowledged,
      modifiedCount: result.modifiedCount,
    };
  }
}
