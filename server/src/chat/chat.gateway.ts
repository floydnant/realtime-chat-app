import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
    Client_AuthenticateEventPayload,
    Client_ChatMessagePayload,
    Client_TypingEventPayload,
    Server_ChatMessagePayload,
} from 'src/shared/chat-event-payloads.model';
import { SocketEventPayloadAsFnMap } from 'src/shared/event-payload-map.model';
import { SocketEvents } from '../shared/socket-events.model';
import { ChatService } from './chat.service';

export const GROUP_CHAT = 'global group chat';

type TypedSocket = Socket<SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap>;

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private chatService: ChatService) {}

    private logger: Logger = new Logger('ChatGateway');
    @WebSocketServer() server: Server<SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap>;

    async handleConnection(client: TypedSocket) {
        this.logger.verbose(`Client connected: ${client.id}`);

        const allSockets = await this.server.allSockets();
        this.chatService.onClientConnected(allSockets);

        client.emit(SocketEvents.SERVER__AUTHENTICATE_PROMPT, null);
    }
    async handleDisconnect(client: TypedSocket) {
        const user = this.onCLientLogout(client);
        this.logger.verbose(`${user} disconnected`);
    }

    @SubscribeMessage(SocketEvents.CLIENT__AUTHENTICATE)
    async handleAuth(client: TypedSocket, { accessToken }: Client_AuthenticateEventPayload) {
        if (!accessToken) {
            client.emit(SocketEvents.SERVER__AUTHENTICATE, { authenticated: false });
            return;
        }

        const { authenticated, user, chatIds } = await this.chatService.authenticateSocket(client.id, accessToken);

        client.emit(SocketEvents.SERVER__AUTHENTICATE, { authenticated });

        if (!authenticated) this.logger.verbose(`'${user.username || '[some user]'}' could not authenticate`);
        else {
            this.logger.verbose(`'${user.username}' authenticated successfully`);

            console.log(user.username + "'s chat ids:", chatIds);

            chatIds.forEach(chatId => {
                client.join(chatId);
                this.emitAllOnlineUsers(chatId);
                client.broadcast.to(chatId).emit(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT, {
                    user,
                    online: true,
                    // text: `${user.username} went online.`,
                    chatIds,
                });
            });
        }
    }
    @SubscribeMessage(SocketEvents.CLIENT__LOGOUT)
    handleLogout(client: TypedSocket) {
        const user = this.onCLientLogout(client);
        this.logger.verbose(`${user} logged out`);
    }

    onCLientLogout(client: TypedSocket) {
        const data = this.chatService.onClientLogout(client.id);
        if (!data) return '[a not authenticated user]';
        const { loggedOutUser, chatIds } = data;

        chatIds.forEach(chatId => {
            client.broadcast.to(chatId).emit(SocketEvents.SERVER__TYPING_EVENT, {
                username: loggedOutUser.username,
                isTyping: false,
                chatId,
            });
            client.broadcast.to(chatId).emit(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT, {
                user: loggedOutUser,
                online: false,
                chatIds,
            });
            client.leave(chatId);

            this.emitAllOnlineUsers(chatId);
        });

        return loggedOutUser.username;
    }

    private emitAllOnlineUsers(chatId: string) {
        this.server.to(chatId).emit(SocketEvents.SERVER__USERS_ONLINE, {
            chatId,
            usersOnline: this.chatService.getOnlineUsersByChatId(chatId).usersOnline.map(u => u.username),
        });
    }

    @SubscribeMessage(SocketEvents.CLIENT__CHAT_MESSAGE)
    async handleChatMessage(client: TypedSocket, { chatId, messageText }: Client_ChatMessagePayload) {
        const user = this.chatService.getUserFromClientId(client.id);
        if (!user) return;
        const isUserChatMember = await this.chatService.isUserChatMember(chatId, user.userId);
        if (!isUserChatMember) return;

        const persistedMessage = await this.chatService.persistMessageInChat(messageText, chatId, user.userId);
        this.logger.verbose(`${user.username} wrote '${messageText}' in chat '${chatId}'`);

        // if (client.rooms.has(chatId))
        this.server.to(chatId).emit(SocketEvents.SERVER__CHAT_MESSAGE, {
            chatId,
            message: persistedMessage as unknown as Server_ChatMessagePayload['message'],
        });
    }

    @SubscribeMessage(SocketEvents.CLIENT__TYPING_EVENT)
    async handleTypingEvents(client: TypedSocket, { chatId, isTyping }: Client_TypingEventPayload) {
        const user = this.chatService.getUserFromClientId(client.id);
        if (!user) return;
        const isUserChatMember = await this.chatService.isUserChatMember(chatId, user.userId);
        if (!isUserChatMember) return;

        this.logger.verbose(`${user.username} ${isTyping ? 'started' : 'stopped'} typing in chat '${chatId}'`);
        client.broadcast
            .to(chatId)
            .emit(SocketEvents.SERVER__TYPING_EVENT, { username: user.username, isTyping, chatId });
    }
}
