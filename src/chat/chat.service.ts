import { Injectable, Logger } from '@nestjs/common';

export interface ConnectedUser {
    username?: string;
    clientId: string;
}
export interface ChatMessage {
    message: string;
    username?: string;
}

@Injectable()
export class ChatService {
    private logger = new Logger('ChatService');
    connectedUsers: ConnectedUser[] = [];

    // onChatMessage(chatMessage) {}

    onClientConnected() {
        this.logConnectedUsers();
    }
    onClientDisconnected(clientId: string) {
        const disconnectedUser = this.getUserNameFromClientId(clientId);
        this.connectedUsers = this.connectedUsers.filter(user => user.clientId != clientId);
        return disconnectedUser;
    }
    onClientChooseUsername(clientId: string, username: string) {
        const isTaken = this.isUsernameTaken(username);
        let oldUsername: string;
        if (!isTaken) {
            const connectedUser = this.connectedUsers.find(c => c.clientId == clientId);
            oldUsername = connectedUser?.username;

            if (connectedUser) connectedUser.username = username;
            else this.connectedUsers.push({ username, clientId });
        }

        this.logConnectedUsers();

        return { isTaken, oldUsername };
    }

    private logConnectedUsers() {
        // this.logger.verbose(
        //     'signed up users: ' +
        //         (this.connectedUsers.length
        //             ? '\n' + this.connectedUsers.map(c => `${c.username} => ${c.clientId}`).join('\n')
        //             : 'NONE'),
        // );
        console.log('\nconnected users in group chat:', this.connectedUsers, '\n');
    }

    private isUsernameTaken(username: string) {
        return this.connectedUsers.some(client => client.username == username);
    }

    getUserNameFromClientId(clientId: string) {
        return this.connectedUsers.find(user => user.clientId == clientId)?.username || `ID:${clientId}`;
    }
}
