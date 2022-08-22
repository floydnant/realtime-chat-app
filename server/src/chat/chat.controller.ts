import { Body, Controller, Delete, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
// import { BypassAuth } from 'src/decorators/bypass-auth.decorator';
import { GetUser } from 'src/decorators/get-user.decorator';
import { AuthGuardExtended } from 'src/guards/auth.guard';
import { ChatService } from './chat.service';

@UseGuards(AuthGuardExtended)
@Controller('chats')
export class ChatController {
    constructor(private chatService: ChatService) {}

    private logger = new Logger('ChatController');

    @Get('/globalChat')
    getGlobalChat() {
        return this.chatService.getGlobalChat();
    }
    // @BypassAuth()
    @Post('/globalChat/join')
    async joinGlobalChat(@GetUser() user: User) {
        this.logger.verbose(`${user.username} joins global chat`);
        const globalChatId = (await this.chatService.getGlobalChat()).id;
        return await this.chatService.joinChat(user, globalChatId);
    }

    @Get('/chat/:chatId')
    getChat(@Param('chatId') chatId: string, @GetUser() user: User) {
        this.logger.verbose(`${user.username} loads chat '${chatId}'`);
        return this.chatService.getChat(user, chatId);
    }
    @Get('/chat/:chatId/messages')
    getChatMessages(@Param('chatId') chatId: string, @GetUser() user: User) {
        this.logger.verbose(`${user.username} loads messages for chat '${chatId}'`);
        return this.chatService.getChatMessages(user, chatId);
    }
    @Get('/chat/:chatId/data')
    getChatData(@Param('chatId') chatId: string, @GetUser() user: User) {
        this.logger.verbose(`${user.username} loads chat data'${chatId}'`);
        return this.chatService.getChatData(user, chatId);
    }

    @Post('chat')
    createChat(@Body() { title }: { title: string }, @GetUser() user: User) {
        this.logger.verbose(`${user.username} creates chat '${title}'`);
        return this.chatService.createChat(user.id, title);
    }
    @Post('chat/:chatId/add/:newMemberId')
    addNewMember(@GetUser() user: User, @Param('chatId') chatId: string, @Param('newMemberId') newMemberId: string) {
        this.logger.verbose(`${user.username} adds a new user`);
        return this.chatService.addNewMemberToGroup(user.id, newMemberId, chatId);
    }
    @Delete('chat/:chatId/kick/:memberId')
    removeMember(@GetUser() user: User, @Param('chatId') chatId: string, @Param('memberId') memberId: string) {
        this.logger.verbose(`${user.username} kicks a member`);
        return this.chatService.removeMemberFromGroup(user.id, memberId, chatId);
    }

    @Get('/joined')
    getAllJoinedChats(@GetUser() user: User) {
        this.logger.verbose(`${user.username} loads all joined chats`);
        return this.chatService.getJoinedChats(user.id);
    }

    @Post('/join/:chatId')
    joinChatRoom(@Param('chatId') chatId: string, @GetUser() user: User) {
        this.logger.verbose(`${user.username} joins chat ${chatId}`);
        return this.chatService.joinChat(user, chatId);
    }
    @Post('/leave/:chatId')
    leaveChatRoom(@Param('chatId') chatId: string, @GetUser() user: User) {
        this.logger.verbose(`${user.username} leaves chat ${chatId}`);
        return this.chatService.leaveChat(user, chatId);
    }
}

// type UnPromisify<T> = T extends Promise<infer U> ? U : T;
// type messages = UnPromisify<ReturnType<ChatController['getChatMessages']>>;
// type messagesParams = Parameters<ChatController['getChatMessages']>;

// function m(...args: messagesParams) {
//     return;
// }
