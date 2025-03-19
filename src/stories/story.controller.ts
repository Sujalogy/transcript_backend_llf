// story.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StoryService } from './story.service';
import { Story } from './story.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  async getAllStories(): Promise<Story[]> {
    return this.storyService.findAll();
  }

  @Get(':id')  // ✅ Create an API to fetch one story by id
  async getOneStory(@Param('id') id: string): Promise<Story> {
    return this.storyService.findOne(id);
  }
  

  @Post() // ✅ Create a new story and call AWS Lambda
  @UseGuards(JwtAuthGuard)
  async createStory(@Body() data: { title: string; text: string; settings: { rate: string; language: string } }) {
    return this.storyService.createStory(data);
  }
}
