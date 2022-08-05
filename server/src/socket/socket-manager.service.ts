import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { IS_PROD } from 'src/constants';
import { SocketEventPayloadMap } from 'src/shared/event-payload-map.model';
import { UserPreview } from 'src/shared/index.model';
import { UsersService } from 'src/users/users.service';
import { TypedSocket } from './socket.gateway';

export interface AuthenticatedUser {
    username: string;
    userId: string;
    client: TypedSocket;
}

interface SocketQueue {
    eventName: keyof SocketEventPayloadMap;
    payload: SocketEventPayloadMap[keyof SocketEventPayloadMap];
    clientId?: string;
}

@Injectable()
export class SocketManagerService {
    constructor(private usersService: UsersService /* , private chatService: ChatService */) {}

    private logger = new Logger('SocketManagerService');

    private socketQueue = new Subject<SocketQueue>();
    getSocketQueue() {
        return this.socketQueue.asObservable();
    }
    addToSocketQueue<E extends keyof SocketEventPayloadMap>({
        userId,
        ...event
    }: {
        eventName: E;
        payload: SocketEventPayloadMap[E];
        userId?: string;
    }) {
        const user = this.getUserOnline(userId, 'userId');
        this.socketQueue.next({ ...event, clientId: user?.client?.id });
    }

    private usersOnline: AuthenticatedUser[] = [];
    private usersOnlineByChat: {
        [chatId: string]: AuthenticatedUser[];
    } = {};
    private filterOnlineUsers(cb: (user: AuthenticatedUser) => boolean) {
        Object.keys(this.usersOnlineByChat).forEach(chatId => {
            this.usersOnlineByChat[chatId] = this.usersOnlineByChat[chatId].filter(cb);
        });
        this.usersOnline = this.usersOnline.filter(cb);
    }
    private filterOutDisconnectedClients(connectedClientIds: Set<string>) {
        this.filterOnlineUsers(user => connectedClientIds.has(user.client.id));
    }
    setUserOffline(clientId: string) {
        this.filterOnlineUsers(u => u.client.id != clientId);
    }
    setUserOnline(user: AuthenticatedUser, chatIds: string[]) {
        chatIds.forEach(chatId => this.addUserOnlineToChat(user, chatId, true));
        this.usersOnline.push(user);
    }
    /* private */ addUserOnlineToChat(user: AuthenticatedUser, chatId: string, alreadyOnline = false) {
        this.logger.verbose(`${user.username} was added to ${chatId}`);
        user.client.join(chatId);
        this.usersOnlineByChat[chatId] = [...(this.usersOnlineByChat[chatId] || []), user];
        if (!alreadyOnline) this.usersOnline.push(user);
    }
    /* private */ removeUserOnlineFromChat(userId: string, chatId: string) {
        this.usersOnlineByChat[chatId] = this.usersOnlineByChat[chatId].filter(u => u.userId != userId);
    }
    removeChatsWithoutUsersOnline() {
        const newUsersOnlineByChat = {};
        Object.entries(this.usersOnlineByChat).forEach(([chatId, users]) => {
            if (users.length) newUsersOnlineByChat[chatId] = users;
        });
        this.usersOnlineByChat = newUsersOnlineByChat;
    }
    getUsersOnlineForChat(chatId: string) {
        return this.usersOnlineByChat[chatId] || [];
    }
    getUserOnline(id: string, property?: keyof AuthenticatedUser): AuthenticatedUser | null {
        property ||= 'client';
        // const user = Object.values(this.usersOnlineByChat).reduce((prev: AuthenticatedUser | null, curr) => {
        //     if (prev) return prev;
        //     return curr.find(user => (property == 'client' ? user.client.id : user[property]) == id);
        // }, null);
        const user = this.usersOnline.find(user => (property == 'client' ? user.client.id : user[property]) == id);
        if (!user) this.logger.warn(`Could not find user with ${property} '${id}'`);

        return user;
    }
    getChatsWithUser(clientId: string) {
        return Object.entries(this.usersOnlineByChat)
            .filter(([, users]) => users.some(u => u.client.id == clientId))
            .map(([chatId]) => chatId);
    }
    async logUsersOnline() {
        if (IS_PROD) return;
        const usersOnlinePerChat = await Promise.all(
            Object.entries(this.usersOnlineByChat).map(async ([chatId, users]) => ({
                // ...(await this.chatService.getChatName(chatId)),
                title: 'no title',
                chatId,
                users: users.map(u => u.username),
            })),
        );
        const usersOnlineMap = {};
        usersOnlinePerChat.forEach(({ chatId, title, users }) => {
            // usersOnlineMap[`${title} -- ${chatId}`] = users;
            usersOnlineMap[chatId] = { title, users };
        });
        // console.log('users online per chat:', usersOnlineMap, '\n');
        console.table(usersOnlineMap);
    }

    onClientConnected(connectedClientIds: Set<string>) {
        this.filterOutDisconnectedClients(connectedClientIds);
    }

    onClientLogout(clientId: string): { loggedOutUser: UserPreview | null; chatIds: string[] } | undefined {
        const loggedOutUser = this.getUserOnline(clientId);
        if (!loggedOutUser) return;

        const chatIds = this.getChatsWithUser(clientId);
        this.setUserOffline(clientId);

        this.removeChatsWithoutUsersOnline();
        this.logUsersOnline();

        const { userId: id, username } = loggedOutUser;
        return {
            loggedOutUser: { username, id },
            chatIds,
        };
    }

    async authenticateSocket(clientId: string, accessToken: string) {
        const { authenticated, id, username, chatIds } = await this.usersService.authenticateFromToken(accessToken);

        return {
            authenticated,
            user: { username, id } as UserPreview,
            chatIds,
        };
    }
}
