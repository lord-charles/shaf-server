import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NOTIFICATION_QUEUE } from './constants';
import { NotificationProcessor } from './notification.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    NotificationsModule,
  ],
  providers: [NotificationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
