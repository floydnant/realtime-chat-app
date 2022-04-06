import { Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

interface ConnectedUser {
    username?: string;
    clientId: string;
}
interface ChatMessage {
    message: string;
    username?: string;
}

enum SocketEvents {
    CHAT_MESSAGE = 'chat message',
    USER = 'user',
    USERNAME_TAKEN = 'username taken',
    CHOOSE_USERNAME = 'choose username',
}

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');

    connectedUsers: ConnectedUser[] = [];

    @SubscribeMessage('chat message')
    handleMessage(client: Socket, message: string) {
        this.logger.log('chat message revieved: ' + message);

        client.broadcast.emit('chat message', {
            text: message,
            username: this.getUserNameFromClientId(client.id),
        });
    }

    handleDisconnect(client: Socket) {
        const disconnectedUser = this.getUserNameFromClientId(client.id);
        this.connectedUsers = this.connectedUsers.filter(
            user => user.clientId != client.id,
        );

        client.broadcast.emit('user', `${disconnectedUser} left the chat.`);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    private getUserNameFromClientId(clientId: string) {
        return (
            this.connectedUsers.find(user => user.clientId == clientId)
                ?.username || clientId
        );
    }

    async handleConnection(client: Socket) {
        console.log('all sockets:', await this.server.allSockets());
        console.log('all users: ', this.connectedUsers);

        this.logger.log(`Client connected: ${client.id}`);
    }

    @SubscribeMessage('choose username')
    signUpUser(client: Socket, username: string) {
        this.logger.log(`Client signed up: ${username}`);
        const isTaken = this.connectedUsers.some(
            client => client.username == username,
        );

        if (isTaken) client.emit('choose username', 'already taken');
        else {
            this.connectedUsers.push({ username, clientId: client.id });
            client.emit('choose username', 'success');

            client.broadcast.emit('user', `${username} joined the chat.`);
        }

        console.log('all users: ', this.connectedUsers);
    }

    // TODO:
    // [X] clients ask if username is taken
    // [X] clients can sign up with a username
    // [X] username is sent with every message

    // [ ] implement rooms
}
