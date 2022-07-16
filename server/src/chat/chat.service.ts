import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { IS_PROD } from 'src/constants';
import { PrismaService } from 'src/services/prisma.service';
import { ChatRoomPreview, UserPreview } from 'src/shared/index.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { UsersService } from 'src/users/users.service';
import { TypedSocket } from './chat.gateway';

const SELECT_user_preview = { select: { id: true, username: true } };
const SELECT_message = {
    select: {
        id: true,
        text: true,
        timestamp: true,
        messageType: true,
        user: SELECT_user_preview,
    },
};
const SELECT_all_chat_data = {
    select: {
        id: true,
        title: true,
        createdAt: true,
        createdBy: SELECT_user_preview,

        users: SELECT_user_preview,
        messages: SELECT_message,
    },
};
const SELECT_chat_preview = {
    select: {
        id: true,
        title: true,
    },
};

function WHERE_user_id(userId: string) {
    return { users: { some: { id: userId } } };
}

const globalChatTitle = 'Global Group Chat';

export interface AuthenticatedUser {
    username: string;
    userId: string;
    client: TypedSocket;
}
@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService, private usersService: UsersService) {
        this.getOrCreateGlobalChat();
    }

    private logger = new Logger('ChatService');

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
    private addUserOnlineToChat(user: AuthenticatedUser, chatId: string, alreadyOnline = false) {
        this.logger.verbose(`${user.username} was added to ${chatId}`);
        user.client.join(chatId);
        this.usersOnlineByChat[chatId] = [...(this.usersOnlineByChat[chatId] || []), user];
        if (!alreadyOnline) this.usersOnline.push(user);
    }
    private removeUserOnlineFromChat(userId: string, chatId: string) {
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
                ...(await this.getChatName(chatId)),
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

    ///////////////////////// CRUD stuff //////////////////////////

    async createChat(userId: string, title: string): Promise<ChatRoomPreview> {
        const chatRoom = await this.prisma.chatRoom.create({
            data: {
                title,
                createdBy: {
                    connect: { id: userId },
                },
                users: {
                    connect: { id: userId },
                },
            },
            ...SELECT_chat_preview,
        });
        const onlineUser = this.getUserOnline(userId, 'userId');
        if (onlineUser) this.addUserOnlineToChat(onlineUser, chatRoom.id, true);
        this.logUsersOnline();
        return chatRoom;
    }

    globalChatRoom: ChatRoomPreview;
    async getGlobalChat(): Promise<ChatRoomPreview> {
        if (this.globalChatRoom) return this.globalChatRoom;
        else {
            const chatRoom = await this.getOrCreateGlobalChat();
            this.globalChatRoom = chatRoom;
            return chatRoom;
        }
    }
    private async getOrCreateGlobalChat() {
        const adminUserId = await this.usersService.getOrCreateAdminUser();

        const globalChatRoom = await this.prisma.chatRoom.findFirst({
            where: {
                createdBy: { id: adminUserId },
                title: globalChatTitle,
            },
            ...SELECT_chat_preview,
        });

        if (globalChatRoom) return globalChatRoom;
        return await this.createChat(adminUserId, globalChatTitle);
    }

    getChatName(chatId: string) {
        return this.prisma.chatRoom.findFirst({ where: { id: chatId }, select: { title: true } });
    }
    async getChat(user: User, chatId: string) {
        const chatRoom = await this.prisma.chatRoom.findFirst({
            where: { id: chatId, ...WHERE_user_id(user.id) },
            ...SELECT_all_chat_data,
        });

        if (!chatRoom) throw new UnauthorizedException();
        return chatRoom;
    }
    async getChatMessages(user: User, chatId: string) {
        const chatRoom = await this.prisma.chatRoom.findFirst({
            where: { id: chatId, ...WHERE_user_id(user.id) },
            select: { messages: SELECT_message },
        });

        if (!chatRoom) throw new UnauthorizedException();
        return chatRoom.messages;
    }

    // @TODO: outsource notifying other chat members, that someone new joined -> gateway / gateway state helper
    async joinChat(user: User, chatId: string) {
        try {
            let chatRoom = await this.prisma.chatRoom.findFirst({
                where: { id: chatId, ...WHERE_user_id(user.id) },
                ...SELECT_chat_preview,
            });
            if (chatRoom) return { chatRoom, successMessage: 'You already joined the chat' };

            chatRoom = await this.prisma.chatRoom.update({
                where: { id: chatId },
                data: { users: { connect: { id: user.id } } },
                ...SELECT_chat_preview,
            });
            if (!chatRoom) throw new NotFoundException();

            const onlineUser = this.getUserOnline(user.id, 'userId');
            if (onlineUser) {
                this.addUserOnlineToChat(onlineUser, chatId, true);
                onlineUser.client.broadcast.to(chatId).emit(SocketEvents.SERVER__USER_JOINED_CHAT, {
                    chatId,
                    user: { id: user.id, username: user.username },
                });
            }

            return {
                chatRoom,
                successMessage: `Successfully joined chat '${chatRoom.title || chatRoom.id}'`,
            };
        } catch (err) {
            throw new NotFoundException();
        }
    }
    async leaveChat(user: User, chatId: string) {
        try {
            let chatRoom = await this.prisma.chatRoom.findFirst({
                where: { id: chatId, ...WHERE_user_id(user.id) },
            });
            if (!chatRoom) return { successMessage: 'You already left the chat' };

            chatRoom = await this.prisma.chatRoom.update({
                where: { id: chatId },
                data: { users: { disconnect: { id: user.id } } },
            });
            if (!chatRoom) throw new NotFoundException();

            this.removeUserOnlineFromChat(user.id, chatId);

            return {
                successMessage: `Successfully left chat '${chatRoom.title || chatRoom.id}'`,
            };
        } catch (err) {
            throw new NotFoundException();
        }
    }

    async isUserChatMember(chatId: string, userId: string) {
        const chat = await this.prisma.chatRoom.findFirst({
            where: {
                id: chatId,
                ...WHERE_user_id(userId),
            },
        });

        return !!chat;
    }

    async getJoinedChats(userId: string): Promise<ChatRoomPreview[]> {
        return await this.prisma.chatRoom.findMany({
            where: { ...WHERE_user_id(userId) },
            select: {
                id: true,
                title: true,
            },
        });
    }

    async persistMessageInChat(messageText: string, chatId: string, userId: string) {
        try {
            const persistedMessage = await this.prisma.chatMessage.create({
                data: {
                    text: messageText,
                    user: {
                        connect: { id: userId },
                    },
                    chat: {
                        connect: { id: chatId },
                    },
                },
                include: {
                    user: SELECT_user_preview,
                },
            });

            if (!persistedMessage) throw new NotFoundException();
            this.logger.verbose(`successfully persisted message '${messageText}'`);

            return persistedMessage;
        } catch (err) {
            console.log({ err });
            throw new NotFoundException();
        }
    }
}
