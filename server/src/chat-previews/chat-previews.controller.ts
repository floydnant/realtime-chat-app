import { Controller, Get, Logger, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from 'src/decorators/get-user.decorator';
import { ChatPreviewsService } from './chat-previews.service';

@UseGuards(AuthGuard())
@Controller('chat-previews')
export class ChatPreviewsController {
    constructor(private chatService: ChatPreviewsService) {}
    private logger = new Logger('ChatPreviewsController');

    @Get()
    async getChatPreviews(@GetUser() user: User) {
        this.logger.verbose(`${user.username} retrieves chat previews`);
        return this.chatService.getChatPreviews(user.id);
    }
    @Get('/:id')
    async getChatPreviewById(
        @GetUser() user: User,
        @Param('id') id: string,
        @Query('type') type: 'group' | 'friendship',
    ) {
        this.logger.verbose(`${user.username} retrieves chat preview ${id}`);
        return this.chatService.getChatPreview(user.id, id, type);
    }
}
