import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DelegatesModule } from './modules/delegates/delegate.module';
import { QueuesModule } from './modules/queues/queues.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './modules/events/event.module';
import { NewsModule } from './modules/news/news.module';
import { VideoModule } from './video/video.module';
import { PanelistModule } from './panelist/panelist.module';
import { InformationModule } from './information/information.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    DatabaseModule,
    SystemLogsModule,
    NotificationsModule,
    DelegatesModule,
    QueuesModule,
    EventsModule,
    NewsModule,
    VideoModule,
    PanelistModule,
    InformationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
