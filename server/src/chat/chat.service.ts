import { ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MembershipRole, User } from '@prisma/client';
import { IS_PROD } from 'src/constants';
import {
    SELECT_chat_preview,
    WHERE_member,
    SELECT_all_chat_data,
    SELECT_message,
    SELECT_user_preview,
} from 'src/query-helpers';
import { PrismaService } from 'src/services/prisma.service';
import { ChatRoomPreview, UserPreview } from 'src/shared/index.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { UsersService } from 'src/users/users.service';
import { TypedSocket } from './chat.gateway';

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
        const chatGroup = await this.prisma.chatGroup.create({
            data: {
                title,
                createdBy: {
                    connect: { id: userId },
                },
                owner: {
                    connect: { id: userId },
                },
                members: {
                    create: {
                        role: MembershipRole.admin,
                        user: {
                            connect: { id: userId },
                        },
                    },
                },
            },
            ...SELECT_chat_preview,
        });

        const onlineUser = this.getUserOnline(userId, 'userId');
        if (onlineUser) this.addUserOnlineToChat(onlineUser, chatGroup.id, true);
        this.logUsersOnline();
        return chatGroup;
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

        const globalChatGroup = await this.prisma.chatGroup.findFirst({
            where: {
                createdBy: { id: adminUserId },
                title: globalChatTitle,
            },
            ...SELECT_chat_preview,
        });

        if (globalChatGroup) return globalChatGroup;
        return await this.createChat(adminUserId, globalChatTitle);
    }

    getChatName(chatId: string) {
        return this.prisma.chatGroup.findFirst({
            where: { id: chatId },
            select: { title: true },
        });
    }
    async getChat(user: User, chatId: string) {
        const chatGroup = await this.prisma.chatGroup.findFirst({
            where: { id: chatId, ...WHERE_member(user.id) },
            ...SELECT_all_chat_data,
        });

        if (!chatGroup) throw new UnauthorizedException();
        return chatGroup;
    }
    async getChatMessages(user: User, chatId: string) {
        const chatGroup = await this.prisma.chatGroup.findFirst({
            where: { id: chatId, ...WHERE_member(user.id) },
            select: { messages: SELECT_message },
        });

        if (!chatGroup) throw new UnauthorizedException();
        return chatGroup.messages;
    }

    // @TODO: outsource notifying other chat members, that someone new joined -> gateway / gateway state helper
    async joinChat(user: User, chatId: string) {
        try {
            let chatGroup = await this.prisma.chatGroup.findFirst({
                where: { id: chatId, ...WHERE_member(user.id) },
                ...SELECT_chat_preview,
            });
            if (chatGroup) return { chatRoom: chatGroup, successMessage: 'You already joined the chat' };

            chatGroup = await this.prisma.chatGroup.update({
                where: { id: chatId },
                data: {
                    members: { create: { user: { connect: { id: user.id } } } },
                },
                ...SELECT_chat_preview,
            });
            if (!chatGroup) throw new NotFoundException();

            const onlineUser = this.getUserOnline(user.id, 'userId');
            if (onlineUser) {
                this.addUserOnlineToChat(onlineUser, chatId, true);
                onlineUser.client.broadcast.to(chatId).emit(SocketEvents.SERVER__USER_JOINED_CHAT, {
                    chatId,
                    user: { id: user.id, username: user.username },
                });
            }

            return {
                chatRoom: chatGroup,
                successMessage: `Successfully joined chat '${chatGroup.title || chatGroup.id}'`,
            };
        } catch (err) {
            throw new NotFoundException();
        }
    }
    async leaveChat(user: User, chatId: string) {
        const chatGroup = await this.prisma.chatGroup.findFirst({
            where: {
                id: chatId,
                members: { some: { userId: user.id } },
            },
            select: {
                id: true,
                title: true,
                ownerId: true,
                members: { where: { userId: user.id } },
            },
        });
        if (!chatGroup) return { successMessage: 'You are not part of this group.' };

        if (chatGroup.ownerId == user.id)
            throw new ConflictException(
                'You cannot leave a group that you are the owner of. Transfer ownership first.',
            );

        await this.prisma.membership.delete({
            where: { id: chatGroup.members[0].id },
        });

        this.removeUserOnlineFromChat(user.id, chatId);

        return {
            successMessage: `Successfully left chat '${chatGroup.title || chatGroup.id}'`,
        };
    }

    async isUserChatMember(chatId: string, userId: string) {
        const membership = await this.prisma.membership.findFirst({
            where: { chatGroupId: chatId, userId },
            select: { id: true },
        });

        return !!membership;
    }

    async getJoinedChats(userId: string): Promise<ChatRoomPreview[]> {
        return await this.prisma.chatGroup.findMany({
            where: { ...WHERE_member(userId) },
            ...SELECT_chat_preview,
        });
    }

    async persistMessageInChat(messageText: string, chatId: string, userId: string) {
        try {
            const persistedMessage = await this.prisma.message.create({
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
