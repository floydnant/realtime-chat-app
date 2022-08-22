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
        this.socketManager.getSocketQueue().subscribe(({ eventName, payload, roomId }) => {
            this.logger.verbose('Emitting event from socket queue:', eventName);

            if (roomId) this.server.to(roomId).emit(eventName, payload);
            else this.server.emit(eventName, payload);
        });
    }

    handleConnection(client: TypedSocket) {
        this.logger.verbose(`Client connected: ${client.id}`);

        client.emit(SocketEvents.SERVER__AUTHENTICATE_PROMPT, null);
    }
    handleDisconnect(client: TypedSocket) {
        this.socketManager.setUserOffline(client.id);

        this.logger.verbose(`{user} disconnected`);
    }

    @SubscribeMessage(SocketEvents.CLIENT__AUTHENTICATE)
    async handleAuth(client: TypedSocket, { accessToken }: Client_AuthenticateEventPayload) {
        if (!accessToken) {
            client.emit(SocketEvents.SERVER__AUTHENTICATE, { authenticated: false });
            return;
        }
        const { authenticated, user, chatIds } = await this.socketManager.authenticateSocket(accessToken);
        client.emit(SocketEvents.SERVER__AUTHENTICATE, { authenticated });

        if (!authenticated) {
            this.logger.verbose(`'${user.username || '[some user]'}' could not authenticate`);
            return;
        }
        this.logger.verbose(`'${user.username}' authenticated successfully`);

        this.socketManager.setUserOnline({
            userId: user.id,
            username: user.username,
            client,
            chatIds,
        });
    }
    @SubscribeMessage(SocketEvents.CLIENT__LOGOUT)
    handleLogout(client: TypedSocket) {
        this.socketManager.setUserOffline(client.id);

        // this.logger.verbose(`${username} logged out`);
    }
}
