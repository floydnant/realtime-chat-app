import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { configValidationSchema } from './config.schema';
import { FriendshipsModule } from './friendships/friendships.module';
import { PrismaModule } from './prisma-abstractions/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatPreviewsModule } from './chat-previews/chat-previews.module';
import { SocketModule } from './socket/socket.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [`.env`, `.env.${process.env.STAGE}`],
            validationSchema: configValidationSchema,
        }),
        ChatModule,
        UsersModule,
        FriendshipsModule,
        PrismaModule,
        ChatPreviewsModule,
        SocketModule,
    ],
    controllers: [AppController],
    providers: [],
    exports: [ConfigModule],
})
export class AppModule {}
