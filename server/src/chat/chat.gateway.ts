import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
    Client_ChatMessagePayload,
    Client_TypingEventPayload,
    Server_ChatMessagePayload,
} from 'src/shared/chat-event-payloads.model';
import { SocketEventPayloadAsFnMap } from 'src/shared/event-payload-map.model';
import { SocketManagerService } from 'src/socket/socket-manager.service';
import { TypedSocket } from 'src/socket/socket.gateway';
import { SocketEvents } from '../shared/socket-events.model';
import { ChatService } from './chat.service';

export const GROUP_CHAT = 'global group chat';

@WebSocketGateway()
export class ChatGateway {
    constructor(private socketManager: SocketManagerService, private chatService: ChatService) {}

    private logger: Logger = new Logger('ChatGateway');
    @WebSocketServer() server: Server<SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap>;

    @SubscribeMessage(SocketEvents.CLIENT__CHAT_MESSAGE)
    async handleChatMessage(client: TypedSocket, { chatId, messageText, sendingId }: Client_ChatMessagePayload) {
        const user = this.socketManager.getUserOnline(client.id);
        if (!user) return;
        const isUserChatMember = await this.chatService.isUserChatMember(chatId, user.userId);
        if (!isUserChatMember) return;

        const persistedMessage = await this.chatService.persistMessageInChat(messageText, chatId, user.userId);
        this.logger.verbose(`${user.username} wrote '${messageText}' in chat '${chatId}'`);

        this.server.to(chatId).emit(SocketEvents.SERVER__CHAT_MESSAGE, {
            chatId,
            message: persistedMessage as unknown as Server_ChatMessagePayload['message'],
            sendingId,
        });
    }

    @SubscribeMessage(SocketEvents.CLIENT__TYPING_EVENT)
    async handleTypingEvents(client: TypedSocket, { chatId, isTyping }: Client_TypingEventPayload) {
        const user = this.socketManager.getUserOnline(client.id);
        if (!user) return;
        const isUserChatMember = await this.chatService.isUserChatMember(chatId, user.userId);
        if (!isUserChatMember) return;

        this.logger.verbose(`${user.username} ${isTyping ? 'started' : 'stopped'} typing in chat '${chatId}'`);
        client.broadcast
            .to(chatId)
            .emit(SocketEvents.SERVER__TYPING_EVENT, { username: user.username, isTyping, chatId });
    }
}
