import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExtendedIoAdapter } from './adapters/extended-io-adapter';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Main');
    const app = await NestFactory.create(AppModule, { cors: true });

    const corsConfig = {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true,
    };
    app.useWebSocketAdapter(new ExtendedIoAdapter(app, corsConfig));
    app.enableCors(corsConfig);

    const port = process.env.PORT || 3000;
    await app.listen(port, () => logger.log(`listening on port ${port}: http://localhost:${port}`));
}
bootstrap();
