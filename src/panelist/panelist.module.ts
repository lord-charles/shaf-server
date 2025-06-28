import { Module } from '@nestjs/common';
import { PanelistService } from './panelist.service';
import { PanelistController } from './panelist.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Panelist, PanelistSchema } from './panelist.schema';
import { CloudinaryModule } from '../modules/cloudinary/cloudinary.module';

@Module({
  controllers: [PanelistController],
  providers: [PanelistService],
  imports: [
    MongooseModule.forFeature([
      { name: Panelist.name, schema: PanelistSchema },
    ]),
    CloudinaryModule,
  ],
  exports: [PanelistService],
})
export class PanelistModule {}

