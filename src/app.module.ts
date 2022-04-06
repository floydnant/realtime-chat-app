import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat.gateway';
import { ExampleGateway } from './example.gateway';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(
                __dirname,
                '../../client/dist/realtime-chat-app-client',
            ),
            // rootPath: join(__dirname, '../static'),
        }),
    ],
    controllers: [AppController],
    providers: [AppService, ChatGateway, ExampleGateway],
})
export class AppModule {}
