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
import { User, UserDocument } from '../../auth/schemas/user.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
    phoneNumber: string,
    email: string,
    message: string,
  ): Promise<boolean> {
    try {
      if (phoneNumber) {
        await this.sendSMS(phoneNumber, message);
      }
      if (email) {
        await this.sendEmail(email, 'Ofgen: Password Reset', message);
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
    message: string,
  ): Promise<boolean> {
    try {
      await this.transporter.verify();

      const mailOptions = {
        from: {
          name: 'Ofgen',
          address: this.configService.get<string>('SMTP_USER'),
        },
        to,
        subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2c3e50;">Ofgen Notification</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `,
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

  async sendEmailWithAttachments(
    to: string,
    subject: string,
    message: string,
    attachments: Array<{
      filename: string;
      content: Buffer | string;
    }>,
  ): Promise<boolean> {
    try {
      await this.transporter.verify();

      const mailOptions = {
        from: {
          name: 'Ofgen',
          address: this.configService.get<string>('SMTP_USER'),
        },
        to,
        subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2c3e50;">Ofgen Notification</h2>
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email with attachments sent successfully to ${to} - MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending email with attachments to ${to}: ${error.message}`,
      );
      if (error.code === 'ECONNECTION' || error.code === 'EAUTH') {
        this.logger.error(
          'SMTP connection or authentication error. Please check your SMTP settings.',
        );
      }
      return false;
    }
  }

  async sendTransactionNotification(
    senderPhone: string,
    recipientPhone: string,
    amount: number,
    transactionType: string,
    senderBalance: number,
    recipientBalance: number,
    senderName: string,
    recipientName: string,
    senderEmail?: string,
    recipientEmail?: string,
  ): Promise<void> {
    // Format amount to 2 decimal places
    const formattedAmount = amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Format balances
    const formattedSenderBalance = senderBalance.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedRecipientBalance = recipientBalance.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const getCurrentTime = () => {
      return new Date().toLocaleString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Nairobi',
      });
    };

    const getCurrentDate = () => {
      return new Date().toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Africa/Nairobi',
      });
    };

    // Create HTML message for sender
    const senderHtmlMessage = `
      <div style="padding: 20px 0;">
        <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #0891b2;">Transaction Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Transaction Type</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${transactionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Amount</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">KES ${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Recipient</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${recipientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">New Balance</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">KES ${formattedSenderBalance}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Date</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${getCurrentDate()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Time</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${getCurrentTime()}</td>
            </tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 14px;">For any queries, please contact our support team.</p>
      </div>
    `;

    // Create HTML message for recipient
    const recipientHtmlMessage = `
      <div style="padding: 20px 0;">
        <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; color: #0891b2;">Transaction Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Transaction Type</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${transactionType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Amount Received</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">KES ${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">From</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">New Balance</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">KES ${formattedRecipientBalance}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Date</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${getCurrentDate()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Time</td>
              <td style="padding: 8px 0; color: #1e293b; text-align: right;">${getCurrentTime()}</td>
            </tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 14px;">For any queries, please contact our support team.</p>
      </div>
    `;

    // Send SMS notifications
    if (senderPhone) {
      await this.sendSMS(
        senderPhone,
        `Your ${transactionType} transaction of KES ${formattedAmount} to ${recipientName} has been processed successfully. New wallet balance: KES ${formattedSenderBalance}`,
      );
    }

    if (recipientPhone) {
      await this.sendSMS(
        recipientPhone,
        `You have received KES ${formattedAmount} from ${senderName} via Ofgen ${transactionType}. New wallet balance: KES ${formattedRecipientBalance}`,
      );
    }

    // Send email notifications with HTML template
    if (senderEmail) {
      await this.sendEmail(
        senderEmail,
        `${transactionType} Transaction Confirmation`,
        senderHtmlMessage,
      );
    }

    if (recipientEmail) {
      await this.sendEmail(
        recipientEmail,
        `${transactionType} Transaction Notification`,
        recipientHtmlMessage,
      );
    }
  }

  // --- EXPO PUSH NOTIFICATION METHODS ---

  async saveUserPushToken(
    userId: string,
    token: string,
  ): Promise<UserDocument | null> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.error(`Push token ${token} is not a valid Expo push token`);
      return null;
    }

    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        this.logger.warn(
          `User with ID ${userId} not found for saving push token.`,
        );
        return null;
      }

      if (!user.expoPushTokens.includes(token)) {
        user.expoPushTokens.push(token);
        await user.save();
        this.logger.log(`Saved push token for user ${userId}`);
      } else {
        this.logger.log(`Push token already exists for user ${userId}`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error saving push token for user ${userId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>, // Changed 'object' to 'Record<string, unknown>'
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
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The Expo docs describe this more fully.
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

    // Later, after the Expo push notification service has delivered the
    // notifications to Apple or Google (usually quickly, but allow the service
    // up to 30 minutes when under load), a "receipt" for each notification is
    // created. The receipts will be available for at least 24 hours from the time
    // of sending and returned by the getPushNotificationReceiptsAsync method.
    //
    // The receipts may contain error codes to help you handle notifications
    // that are not delivered successfully. For example, if you try to send a
    // notification to a device that has uninstalled your app, you will receive a
    // "DeviceNotRegistered" error. You should stop sending notifications to that
    // device.
    // TODO: Implement receipt handling if needed for robust error management
    // const receiptIds: ExpoPushReceiptId[] = [];
    // for (const ticket of tickets) {
    //   // NOTE: Not all tickets have IDs; for example, tickets for notifications
    //   // that could not be sent due to errors will not have an ID.
    //   if (ticket.id) {
    //     receiptIds.push(ticket.id);
    //   }
    // }
    // let receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    // // Like sending notifications, there are different strategies you could use
    // // to retrieve batches of receipts from the Expo service.
    // for (let chunk of receiptIdChunks) {
    //   try {
    //     let receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
    //     console.log(receipts);
    //     // The receipts specify whether Apple or Google successfully received the
    //     // notification and information about an error, if one occurred.
    //     for (let receiptId in receipts) {
    //       let { status, message, details } = receipts[receiptId];
    //       if (status === 'ok') {
    //         continue;
    //       }
    //       if (status === 'error') {
    //         this.logger.error(
    //           `There was an error sending a notification: ${message}`
    //         );
    //         if (details && details.error) {
    //           // The error codes are listed in the Expo documentation:
    //           // https://docs.expo.dev/push-notifications/sending-notifications/#individual-errors
    //           // You must handle the errors appropriately.
    //           this.logger.error(`The error code is ${details.error}`);
    //           if (details.error === 'DeviceNotRegistered') {
    //             // Remove the token from your database
    //           }
    //         }
    //       }
    //     }
    //   } catch (error) {
    //     this.logger.error(error);
    //   }
    // }
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('+expoPushTokens')
        .exec();
      if (!user) {
        this.logger.warn(
          `User with ID ${userId} not found for sending push notification.`,
        );
        return;
      }
      if (!user.expoPushTokens || user.expoPushTokens.length === 0) {
        this.logger.log(`User ${userId} has no registered push tokens.`);
        return;
      }
      await this.sendPushNotification(user.expoPushTokens, title, body, data);
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
      const usersWithTokens = await this.userModel
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
      await this.userModel.updateMany(
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
