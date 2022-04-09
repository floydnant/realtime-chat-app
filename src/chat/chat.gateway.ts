import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';

export enum SocketEvents {
    CHAT_MESSAGE = 'chat message',
    USER = 'user',
    USERNAME_TAKEN = 'username taken',
    CHOOSE_USERNAME = 'choose username',
    TYPING = 'typing',
    USERS_ONLINE = 'users online',
}

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

    @SubscribeMessage(SocketEvents.TYPING)
    handleTypingEvents(client: Socket, isTyping: boolean) {
        const username = this.chatService.getUserNameFromClientId(client.id);
        this.logger.verbose(`${username} ${isTyping ? 'started' : 'stopped'} typing`);

        client.broadcast.to(GROUP_CHAT).emit(SocketEvents.TYPING, { username, isTyping });
    }

    handleDisconnect(client: Socket) {
        const disconnectedUser = this.chatService.onClientDisconnected(client.id);
        this.logger.verbose(`${disconnectedUser} disconnected, id: ${client.id}`);

        if (disconnectedUser) {
            client.broadcast.to(GROUP_CHAT).emit(SocketEvents.USER, `${disconnectedUser} left the chat.`);
            client.broadcast.to(GROUP_CHAT).emit(
                SocketEvents.USERS_ONLINE,
                this.chatService.connectedUsers.map(u => u.username),
            );
        }
    }

    async handleConnection(client: Socket) {
        this.logger.verbose(`Client connected: ${client.id}`);
        console.log('all sockets:', await this.server.allSockets());
        this.chatService.onClientConnected();

        client.emit(SocketEvents.CHOOSE_USERNAME, SocketEvents.CHOOSE_USERNAME);
    }

    @SubscribeMessage(SocketEvents.CHOOSE_USERNAME)
    handleUserSignup(client: Socket, username: string) {
        this.logger.verbose(`Client signed up: ${username}`);
        const { isTaken, oldUsername } = this.chatService.onClientChooseUsername(client.id, username);

        if (isTaken) client.emit(SocketEvents.CHOOSE_USERNAME, 'already taken');
        else {
            client.join(GROUP_CHAT);
            client.emit(SocketEvents.CHOOSE_USERNAME, 'success');
            this.server.to(GROUP_CHAT).emit(
                SocketEvents.USERS_ONLINE,
                this.chatService.connectedUsers.map(u => u.username),
            );
            client.broadcast
                .to(GROUP_CHAT)
                .emit(
                    SocketEvents.USER,
                    oldUsername ? `${oldUsername} changed username to '${username}'` : `${username} joined the chat.`,
                );
        }
    }

    // TODO:
    // [X] clients ask if username is taken
    // [X] clients can sign up with a username
    // [X] username is sent with every message
    // [X] implement rooms
    // [X] implement 'XXX is typing functionality'
    // [X] implement whos online functionality'
}
