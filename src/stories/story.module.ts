// story.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { StoryService } from './story.service'; // Corrected name
import { StoryController } from './story.controller'; // Corrected name
import { Story } from './story.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Story]), HttpModule,],
  controllers: [StoryController], // Corrected name
  providers: [StoryService], // Corrected name
  exports: [StoryService],
})
export class StoriesModule {}
