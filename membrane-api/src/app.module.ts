import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as winston from 'winston';
import 'winston-daily-rotate-file'
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule, ConfigService} from '@nestjs/config'
import { WinstonModule } from 'nest-winston';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
      type: 'postgres',
      url: config.get<string>('NODE_ENV') == 'remote' ? config.get<string>('REMOTE_DATABASE_URL') : config.get<string>('LOCAL_DATABASE_URL'), 
      entities: [__dirname + '/**/*.entity.{js,ts}'],
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
      ssl: config.get('NODE_ENV') === 'remote' ? { rejectUnauthorized: false} : false,
    //   ssl: {
    //   rejectUnauthorized: false, // Bypasses local certificate pinning issues
    // },
      })
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
