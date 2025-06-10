import { Module } from '@nestjs/common';
import { BadgeModule } from '../badge/badge.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemLogsService } from '../system-logs/services/system-logs.service';
import {
  SystemLog,
  SystemLogSchema,
} from '../system-logs/schemas/system-log.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { Delegate, DelegateSchema } from './delegates.schema';
import { DelegatesService } from './delegate.service';
import { DelegatesController } from './delegate.controller';
import { PassportModule } from '@nestjs/passport';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delegate.name, schema: DelegateSchema },
    ]),
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
    NotificationsModule,
    BadgeModule,
    QueuesModule,
  ],
  controllers: [DelegatesController],
  providers: [SystemLogsService, DelegatesService],
})
export class DelegatesModule {}
