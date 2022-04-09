import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ExampleGateway } from './example.gateway';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '../../frontend/dist/realtime-chat-app-client'),
            // rootPath: join(__dirname, '../static'),
        }),
        ChatModule,
    ],
    controllers: [AppController],
    providers: [AppService, ExampleGateway],
})
export class AppModule {}
