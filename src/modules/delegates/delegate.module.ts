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
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Event, EventSchema } from '../events/events.schema';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: Delegate.name, schema: DelegateSchema },
    ]),
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
    ]),
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
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
  providers: [
    SystemLogsService,
    DelegatesService,
    JwtStrategy,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
  ],
})
export class DelegatesModule {}
