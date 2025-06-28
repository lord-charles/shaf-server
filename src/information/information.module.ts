import { Module } from '@nestjs/common';
import { InformationService } from './information.service';
import { InformationController } from './information.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Information, InformationSchema } from './entities/information.entity';

@Module({
  controllers: [InformationController],
  imports: [
    MongooseModule.forFeature([
      { name: Information.name, schema: InformationSchema },
    ]),
  ],
  providers: [InformationService],
})
export class InformationModule {}
