import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export default async function (req: any, res: any) {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.init();

  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
