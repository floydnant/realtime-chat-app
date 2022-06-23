import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExtendedIoAdapter } from './adapters/extended-io-adapter';
import { AppModule } from './app.module';
import { BASE_URL, PORT } from './constants';

async function bootstrap() {
    const logger = new Logger('Main');
    const app = await NestFactory.create(AppModule, { cors: true });

    const corsConfig = {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    };
    app.useWebSocketAdapter(new ExtendedIoAdapter(app, corsConfig));
    app.enableCors(corsConfig);

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(PORT, () => logger.log(`listening on ${BASE_URL}`));
}
bootstrap();
