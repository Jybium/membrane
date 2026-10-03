// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();





import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import compression from 'compression';
import * as bodyParser from 'body-parser';

dotenv.config();
const port = process.env.PORT || 3000;
const environment = process.env.NODE_ENV;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bodyParser: false});

  app.use(bodyParser.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;  // keep as Buffer
    }
  }));


  app.use(compression());

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.setGlobalPrefix('v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableCors({
    origin: '*',
    credentials: false,
  });

  const mainOptions = new DocumentBuilder()
    .setTitle('Membrane API')
    .setDescription('Official API documentation for Membrane')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const mainDocument = SwaggerModule.createDocument(app, mainOptions);
  SwaggerModule.setup('api-docs', app, mainDocument);

  await app.listen(port);

  console.log(`Environment: ${environment}`);
  console.log(`Server running on port ${port}`);
  console.log(`API docs:   http://localhost:${port}/api-docs`);

}

bootstrap();
