import { Logger, OnModuleInit } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client_AuthenticateEventPayload } from 'src/shared/chat-event-payloads.model';
import { SocketEventPayloadAsFnMap } from 'src/shared/event-payload-map.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { SocketManagerService } from './socket-manager.service';

export type TypedSocket = Socket<SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap>;

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    constructor(private socketManager: SocketManagerService) {}

    private logger: Logger = new Logger('SocketGateway');
    @WebSocketServer() server: Server<SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap, SocketEventPayloadAsFnMap>;

    onModuleInit() {
        this.socketManager.getSocketQueue().subscribe(async ({ eventName, payload, clientId }) => {
            const client = (await this.server.fetchSockets()).find(({ id }) => id == clientId);
            this.logger.verbose('Emitting event from socket queue:', eventName);

            if (client) client.emit(eventName, payload);
            else this.server.emit(eventName, payload);
        });
    }

    async handleConnection(client: TypedSocket) {
        this.logger.verbose(`Client connected: ${client.id}`);

        const allSockets = await this.server.allSockets();
        this.socketManager.onClientConnected(allSockets);

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

        const { authenticated, user, chatIds } = await this.socketManager.authenticateSocket(client.id, accessToken);

        client.emit(SocketEvents.SERVER__AUTHENTICATE, { authenticated });

        if (!authenticated) {
            this.logger.verbose(`'${user.username || '[some user]'}' could not authenticate`);
            return;
        }

        this.logger.verbose(`'${user.username}' authenticated successfully`);
        this.socketManager.setUserOnline({ userId: user.id, username: user.username, client }, chatIds);
        this.socketManager.logUsersOnline();

        chatIds.forEach(chatId => {
            this.emitAllOnlineUsers(chatId);
            client.broadcast.to(chatId).emit(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT, {
                user,
                online: true,
                chatIds,
            });
        });
    }
    @SubscribeMessage(SocketEvents.CLIENT__LOGOUT)
    handleLogout(client: TypedSocket) {
        const user = this.onCLientLogout(client);
        this.logger.verbose(`${user} logged out`);
    }

    onCLientLogout(client: TypedSocket) {
        const data = this.socketManager.onClientLogout(client.id);
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
            usersOnline: this.socketManager.getUsersOnlineForChat(chatId).map(u => u.username),
        });
    }
}
