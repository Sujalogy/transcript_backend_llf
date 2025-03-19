import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Story } from './story.entity';
import * as fs from 'fs';
import * as path from 'path';

// Using the inline DTO structure you provided
interface CreateStoryDto {
  title: string;
  text: string;
  settings: {
    rate: string;
    language: string;
  };
  cover_image?: string;
  category?: string;
}
interface CoverImage {
  id: string;
  url: string;
}
interface CoverImagesData {
  images: CoverImage[];
}

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);
  private coverImages: CoverImagesData;

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly httpService: HttpService,
  ) {
    this.loadCoverImages();
  }

  /**
   * Load cover images from JSON file
   */
  private loadCoverImages(): void {
    try {
      const filePath = path.join(
        process.cwd(),
        'src/resources/cover-images.json',
      );
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.coverImages = JSON.parse(fileContent);
      this.logger.log(`Loaded ${this.coverImages.images.length} cover images`);
    } catch (error) {
      this.logger.error(`Failed to load cover images: ${error.message}`);
      this.coverImages = { images: [] };
    }
  }

  /**
   * Get a random cover image URL
   */
  private getRandomCoverImage(): string {
    const images = this.coverImages.images;

    // If no images available, return empty string
    if (images.length === 0) {
      return '';
    }

    // Select random image
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex].url;
  }

  private validateStoryInput(createStoryDto: CreateStoryDto): void {
    if (!createStoryDto.title || createStoryDto.title.trim() === '') {
      throw new BadRequestException('Story title is required');
    }

    if (!createStoryDto.text || createStoryDto.text.trim() === '') {
      throw new BadRequestException('Story text is required');
    }

    if (!createStoryDto.settings || !createStoryDto.settings.language) {
      throw new BadRequestException('Language setting is required');
    }
  }

  private async callLambdaFunction(payload: any) {
    try {
      return await lastValueFrom(
        this.httpService.post(process.env.LAMBDA_API_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }),
      );
    } catch (error) {
      this.logger.error(
        `Lambda function call failed: ${error.message}`,
        error.stack,
      );

      // Provide more detailed error messages based on the error type
      if (error.response) {
        throw new HttpException(
          `Lambda API error: ${error.response.data?.message || 'Unknown error'}`,
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Lambda function timed out',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        'Failed to call AWS Lambda function',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchStoryById(id: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      select: [
        'id',
        'code',
        'title',
        'display_html',
        'original_text',
        'audio_file',
        'language',
        'cover_image',
        'category',
      ],
    });

    if (!story) {
      throw new NotFoundException(
        `Story with ID ${id} was created but could not be retrieved`,
      );
    }

    return story;
  }

  private handleCreateStoryError(error: any): never {
    this.logger.error(`Story creation failed: ${error.message}`, error.stack);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'Failed to create story due to an internal error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // APIs
  async findAll(): Promise<Story[]> {
    return this.storyRepository.find({
      select: [
        'id',
        'code',
        'title',
        'display_html',
        'original_text',
        'audio_file',
        'language',
        'cover_image',
        'category',
      ],
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      select: [
        'id',
        'code',
        'title',
        'display_html',
        'original_text',
        'audio_file',
        'language',
        'cover_image',
        'category',
      ],
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return story;
  }

  private async processLambdaResponse(response: any) {
    const id = response.data?.storyId;
    if (!id) {
      throw new HttpException(
        'Invalid response from Lambda: missing storyId',
        HttpStatus.BAD_GATEWAY,
      );
    }
    return id;
  }
  private async updateStorydata(
    id: string,
    coverImage: string,
    category?: string,
  ) {
    const updateResult = await this.storyRepository.update(id, {
      cover_image: coverImage,
      category: category,
    });

    if (updateResult.affected === 0) {
      throw new HttpException(
        `Failed to update story metadata for ID: ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async createStory(createStoryDto: CreateStoryDto) {
    try {
      // Step 1: Validate input
      this.validateStoryInput(createStoryDto);

      // Step 2: Prepare Lambda payload
      const lambdaPayload = {
        title: createStoryDto.title,
        text: createStoryDto.text,
        settings: {
          rate: createStoryDto.settings.rate,
          language: createStoryDto.settings.language,
          voice: 'Kajal',
          engine: 'neural',
          textType: 'ssml',
        },
      };

      // Step 3: Call Lambda and process response
      const lambdaResponse = await this.callLambdaFunction(lambdaPayload);
      const storyId = await this.processLambdaResponse(lambdaResponse);

      // Step 4: Update story metadata
      const coverImage =
        createStoryDto.cover_image || this.getRandomCoverImage();
      await this.updateStorydata(
        storyId,
        coverImage,
        createStoryDto.category,
      );

      // Step 5: Fetch and return the complete story
      const story = await this.fetchStoryById(storyId);

      return {
        message: 'Story created successfully',
        lambdaResponse: lambdaResponse.data,
        story,
      };
    } catch (error) {
      this.logger.error(
        `Story creation process failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Story creation failed due to an internal error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
