import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './notifications.controller';
import { User, UserSchema } from '../auth/schemas/user.schema';
import Expo from 'expo-server-sdk';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, { provide: Expo, useValue: new Expo() }],
  exports: [NotificationService],
})
export class NotificationsModule {}
