import { Module } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
    imports: [UsersModule],
    providers: [ChatGateway, ChatService, PrismaService, UsersService],
    controllers: [ChatController],
})
export class ChatModule {}
