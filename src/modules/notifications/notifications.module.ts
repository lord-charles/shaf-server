import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './notifications.controller';
import Expo from 'expo-server-sdk';
import { Delegate, DelegateSchema } from '../delegates/delegates.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Delegate.name, schema: DelegateSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, { provide: Expo, useValue: new Expo() }],
  exports: [NotificationService],
})
export class NotificationsModule {}
