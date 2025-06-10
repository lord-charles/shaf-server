import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemLogsService } from '../system-logs/services/system-logs.service';
import {
  SystemLog,
  SystemLogSchema,
} from '../system-logs/schemas/system-log.schema';
import { EventsService } from './event.service';
import { EventsController } from './event.controller';
import { PassportModule } from '@nestjs/passport';
import { EventSchema } from './events.schema';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
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
  ],
  controllers: [EventsController],
  providers: [SystemLogsService, EventsService],
})
export class EventsModule {}
