import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { SocketEvents } from '../shared/socket-events.model';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

const GROUP_CHAT = 'group chat';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private chatService: ChatService) {}

    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

    @SubscribeMessage(SocketEvents.CHAT_MESSAGE)
    handleChatMessage(client: Socket, message: string) {
        const username = this.chatService.getUserNameFromClientId(client.id);
        this.logger.verbose(`${username} wrote: ${message}`);

        if (client.rooms.has(GROUP_CHAT))
            client.broadcast.to(GROUP_CHAT).emit(SocketEvents.CHAT_MESSAGE, {
                text: message,
                username,
            });
    }

    @SubscribeMessage(SocketEvents.TYPING_EVENT)
    handleTypingEvents(client: Socket, isTyping: boolean) {
        const username = this.chatService.getUserNameFromClientId(client.id);
        this.logger.verbose(`${username} ${isTyping ? 'started' : 'stopped'} typing`);

        client.broadcast.to(GROUP_CHAT).emit(SocketEvents.TYPING_EVENT, { username, isTyping });
    }

    async handleConnection(client: Socket) {
        this.logger.verbose(`Client connected: ${client.id}`);
        console.log('connected Sockets:', await this.server.allSockets());
        this.chatService.onClientConnected();

        client.emit(SocketEvents.CHOOSE_USERNAME, SocketEvents.CHOOSE_USERNAME);
    }

    handleDisconnect(client: Socket) {
        const disconnectedUser = this.chatService.onClientDisconnected(client.id);
        this.logger.verbose(`${disconnectedUser} disconnected, id: ${client.id}`);

        if (disconnectedUser) {
            client.broadcast
                .to(GROUP_CHAT)
                .emit(SocketEvents.TYPING_EVENT, { username: disconnectedUser, isTyping: false });
            client.broadcast.to(GROUP_CHAT).emit(SocketEvents.USER_EVENT, `${disconnectedUser} went offline.`);
            this.emitAllOnlineUsers();
        }
    }

    @SubscribeMessage(SocketEvents.CHOOSE_USERNAME)
    handleUserSignup(client: Socket, username: string) {
        this.logger.verbose(`Client '${client.id}' chose username: ${username}`);
        const { isTaken, oldUsername } = this.chatService.onClientChooseUsername(client.id, username);

        if (isTaken) {
            client.emit(SocketEvents.CHOOSE_USERNAME, 'already taken');
            this.logger.verbose(`But username '${username}' was already taken.`);
        } else {
            client.join(GROUP_CHAT);
            client.emit(SocketEvents.CHOOSE_USERNAME, 'success');
            this.emitAllOnlineUsers();
            client.broadcast
                .to(GROUP_CHAT)
                .emit(
                    SocketEvents.USER_EVENT,
                    oldUsername ? `${oldUsername} changed username to '${username}'` : `${username} went online.`,
                );
        }
    }

    private emitAllOnlineUsers() {
        this.logger.debug('emitting all online users');
        this.server.to(GROUP_CHAT).emit(
            SocketEvents.USERS_ONLINE,
            this.chatService.connectedUsers.map(u => u.username),
        );
    }
}
