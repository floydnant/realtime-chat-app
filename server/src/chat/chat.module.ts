import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SocketModule } from 'src/socket/socket.module';
import { PrismaModule } from 'src/prisma-abstractions/prisma.module';

@Module({
    imports: [UsersModule, SocketModule, PrismaModule],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
})
export class ChatModule {}
