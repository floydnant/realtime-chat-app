import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Main');
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3000;
    // app.enableCors({ origin: 'http://localhost:4200', credentials: true });
    await app.listen(port, () => logger.log(`listening on port ${port}: http://localhost:${port}`));
}
bootstrap();
