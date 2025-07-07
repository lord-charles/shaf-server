import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './notifications.controller';
import Expo from 'expo-server-sdk';
import { Delegate, DelegateSchema } from '../delegates/delegates.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Delegate.name, schema: DelegateSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, { provide: Expo, useValue: new Expo() }],
  exports: [NotificationService],
})
export class NotificationsModule {}
