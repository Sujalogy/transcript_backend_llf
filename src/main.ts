import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:3000',
      /\.ngrok-free\.app$/,  // Allow ngrok domains
      'https://your-frontend-domain.com',
      'https://3531-2401-4900-8811-2b29-fd03-22f-bde0-9c88.ngrok-free.app',
      'https://aa67-2401-4900-8811-2b29-e84f-9537-10e-e2dc.ngrok-free.app' 
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Accept', 
      'Authorization',
      'ngrok-skip-browser-warning'  // Add ngrok header
    ],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(cookieParser());
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();