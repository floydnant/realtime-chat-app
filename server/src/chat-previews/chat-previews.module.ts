import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma-abstractions/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { ChatPreviewsController } from './chat-previews.controller';
import { ChatPreviewsService } from './chat-previews.service';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [ChatPreviewsController],
    providers: [ChatPreviewsService],
})
export class ChatPreviewsModule {}
