import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io';
import { IS_PROD } from 'src/constants';
import { SocketEventPayloadMap } from 'src/shared/event-payload-map.model';
import { UserPreview } from 'src/shared/index.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { UsersService } from 'src/users/users.service';
import { TypedSocket } from './socket.gateway';

interface SocketQueue {
    eventName: keyof SocketEventPayloadMap;
    payload: SocketEventPayloadMap[keyof SocketEventPayloadMap];
    roomId?: string | string[];
}

@Injectable()
export class SocketManagerService {
    constructor(private usersService: UsersService) {}

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
        roomId?: string | string[];
    }) {
        if (!userId) {
            this.socketQueue.next(event);
            return;
        }

        const user = this.usersOnline.get(userId);
        if (!user) return; // if user is not online

        if (event.roomId) user.clients.values()[0].broadcast.to(event.roomId).emit(event.eventName, event.payload);
        else user.clients.forEach(client => (client as Socket).emit(event.eventName, event.payload));
    }

    async authenticateSocket(accessToken: string) {
        const { authenticated, id, username, chatIds } = await this.usersService.authenticateFromToken(accessToken);

        return {
            authenticated,
            user: { username, id } as UserPreview,
            chatIds,
        };
    }

    private chatUsersMap = new Map</* chat id  */ string, /* user ids */ Set<string>>();
    private usersOnline = new Map<string, { clients: Map<string, TypedSocket>; username: string }>();

    setUserOffline(clientId: string) {
        this.usersOnline.forEach(({ username, clients }, userId) => {
            const client = clients.get(clientId);
            if (!client) return;

            const chatIds = this.getUsersChatIds(userId);

            this.chatUsersMap.forEach((usersSet, chatId) => {
                if (!usersSet.has(userId)) return;

                client.leave(chatId);
                // if the user is connected with more than one device
                if (clients.size > 1) return;

                // if only one user is online in the chat
                if (usersSet.size == 1) {
                    this.chatUsersMap.delete(chatId); // remove the whole chat
                    return;
                }
                usersSet.delete(userId); // otherwise just remove the user

                // emit stop typing (in case user was typing)
                this.addToSocketQueue({
                    roomId: chatId,
                    eventName: SocketEvents.SERVER__TYPING_EVENT,
                    payload: {
                        username,
                        isTyping: false,
                        chatId,
                    },
                });
            });

            // if the user is connected with more than one device
            if (clients.size > 1) {
                clients.delete(clientId); // just remove the one
                return;
            }
            this.usersOnline.delete(userId); // otherwise remove the whole entry

            // and emit status offline
            this.addToSocketQueue({
                roomId: chatIds,
                eventName: SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT,
                payload: {
                    user: { id: userId, username },
                    chatIds: chatIds,
                    online: false,
                },
            });
        });
        this.logUsersOnline();
    }

    setUserOnline({
        userId,
        client,
        username,
        chatIds,
    }: {
        userId: string;
        client: TypedSocket;
        username: string;
        chatIds: string[];
    }) {
        const user = this.usersOnline.get(userId);
        if (user) {
            user.clients.set(client.id, client);
            this.logger.verbose(`'${user.username}' went online with another device.`);
        } else {
            this.logger.verbose(`'${username}' went online.`);
            const clientsMap = new Map<string, TypedSocket>();
            clientsMap.set(client.id, client);
            this.usersOnline.set(userId, { username, clients: clientsMap });
        }
        chatIds.forEach(chatId => this.addUserToRoom(userId, chatId, client));
        this.emitUserOnlineEvent(userId, client, chatIds);
        this.emitMembersOnline(...chatIds);
        this.logUsersOnline();
    }

    getUsersChatIds(userId: string) {
        return [...this.chatUsersMap.entries()]
            .filter(([, usersSet]) => usersSet.has(userId))
            .map(([chatId]) => chatId);
    }

    joinRoom(userId: string, chatId: string) {
        this.addUserToRoom(userId, chatId);
        this.emitJoinedEvent(userId, chatId);
        this.emitMembersOnline(chatId);
        this.logUsersOnline();
    }
    leaveRoom(userId: string, chatId: string) {
        this.removeUserFromRoom(userId, chatId);
        // @TODO: emit leave event here
        // this.addToSocketQueue({
        //     eventName: SocketEvents.{LEAVE_EVENT_HERE}
        //     roomId: chatId
        // })
        this.emitMembersOnline(chatId);
        this.logUsersOnline();
    }

    getUserOnline(id: string, propertyName: 'userId' | 'clientId' = 'clientId') {
        let userPreview: UserPreview | null = null;
        if (propertyName == 'clientId') {
            const user = [...this.usersOnline.entries()].find(([, { clients }]) => clients.has(id));
            if (user) {
                const [userId, { username }] = user;
                userPreview = { id: userId, username };
            }
        } else {
            const user = this.usersOnline.get(id);
            if (user) userPreview = { id, username: user.username };
        }

        if (!userPreview) this.logger.warn(`Could not find user with ${propertyName} '${id}'`);

        return userPreview;
    }

    private addUserToRoom(userId: string, chatId: string, client?: TypedSocket) {
        const user = this.usersOnline.get(userId);
        if (!user) return;
        this.logger.verbose(`'${user.username}' was added to ${chatId}`);

        if (client) client.join(chatId);
        else user.clients.forEach(client => client.join(chatId));

        const usersSet = this.chatUsersMap.get(chatId);
        if (usersSet) usersSet.add(userId);
        else this.chatUsersMap.set(chatId, new Set([userId]));
    }

    private async emitJoinedEvent(userId: string, chatId: string) {
        const username = await this.getUsername(userId);

        this.addToSocketQueue({
            roomId: chatId,
            eventName: SocketEvents.SERVER__USER_JOINED_CHAT,
            payload: { chatId, user: { id: userId, username } },
        });
    }
    private async getUsername(userId: string) {
        return (
            this.usersOnline.get(userId)?.username || (await this.usersService.getUsername(userId)) || '[unknown user]'
        );
    }
    private async emitUserOnlineEvent(userId: string, client: TypedSocket, chatIds: string[]) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const user = this.usersOnline.get(userId)!;
        if (user.clients.size == 1)
            client.broadcast.to(chatIds).emit(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT, {
                chatIds,
                online: true,
                user: { id: userId, username: user.username },
            });
    }

    private emitMembersOnline(...chatIds: string[]) {
        chatIds.forEach(chatId => {
            const usersSet = this.chatUsersMap.get(chatId);
            if (!usersSet) return;

            this.addToSocketQueue({
                // userId, // keep this outcommented until SERVER__USER_JOINED_CHAT sets users online on the client
                eventName: SocketEvents.SERVER__USERS_ONLINE,
                payload: { chatId, usersOnline: [...usersSet.values()] },
            });
        });
    }

    private removeUserFromRoom(userId: string, chatId: string, client?: TypedSocket) {
        if (client) client.leave(chatId);
        else this.usersOnline.get(userId)?.clients.forEach(client => client.leave(chatId));

        const usersSet = this.chatUsersMap.get(chatId);
        if (!usersSet) return;
        usersSet.delete(userId);
        // if no members of the chat are online anymore
        if (usersSet.size == 0) this.chatUsersMap.delete(chatId); // remove the whole chat
    }

    private async logUsersOnline() {
        if (IS_PROD) return;

        const data = [...this.chatUsersMap.entries()].map(([chatId, usersSet]) => {
            const users = [...usersSet.values()].map(id => this.usersOnline.get(id)?.username);
            return {
                chatId,
                users,
            };
        });
        console.table(data);
    }
}
