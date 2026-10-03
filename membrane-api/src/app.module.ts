import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as winston from 'winston';
import 'winston-daily-rotate-file'
import {TypeOrmModule} from '@nestjs/typeorm'
import {ConfigModule, ConfigService} from '@nestjs/config'
import { WinstonModule } from 'nest-winston';
import { ClinicalTrialsModule } from './modules/clinical-trials/clinical-trials.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // WinstonModule.forRoot({
    //   transports: [
    //     new winston.transports.Console({
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.colorize(),
    //         winston.format.simple(),
    //       ),
    //     }),
    //   ],
    // }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // timestamp format
            winston.format.colorize({ all: true }), // colorize level, message, and metadata
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              // visual anchor or bracket for the context/module name (defaulting to 'App')
              const ctx = context ? `[${context}] ` : '[Nest] ';
              
              // formatted log string structure
              let logStr = `${timestamp}  ${level} ${ctx}${message}`;

              // if there's extra metadata or an error stack, append it nicely styled below
              if (Object.keys(meta).length > 0) {
                logStr += ` \n${JSON.stringify(meta, null, 2)}`;
              }

              return logStr;
            }),
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
    ClinicalTrialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
