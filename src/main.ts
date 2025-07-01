import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  News,
  Author,
  MediaAttachment,
  Translation,
} from './modules/news/schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS
  app.enableCors();

  // Use global validation pipe
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     whitelist: true,
  //     // forbidNonWhitelisted: true, // Reject requests with properties not defined in DTO
  //     // skipMissingProperties: false, // Ensure all properties are validated, even if missing
  //   }),
  // );

  // Set global prefix for all routes
  app.setGlobalPrefix('shaf/api');

  // Get the configuration service
  const configService = app.get(ConfigService);

  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle('Shaf API')
    .setDescription('The Shaf API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [News, Author, MediaAttachment, Translation],
  });

  // Setup Swagger under the global prefix path
  SwaggerModule.setup('shaf/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Shaf API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = configService.get<number>('PORT', 8000);
  await app.listen(port);

  // Log the URLs
  const logger = new Logger('Bootstrap');
  logger.log(`Server is running on: http://localhost:${port}`);
  logger.log(
    `API Documentation available at: http://localhost:${port}/shaf/api/docs`,
  );
  logger.log(`API Base URL: http://localhost:${port}/shaf/api`);
}
bootstrap();
