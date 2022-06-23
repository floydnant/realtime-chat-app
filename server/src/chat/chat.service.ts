import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChatRoom, User } from '@prisma/client';
import { PrismaService } from 'src/services/prisma.service';
import { ChatRoomPreview, UserPreview } from 'src/shared/index.model';
import { UsersService } from 'src/users/users.service';

const SELECT_user = { select: { id: true, username: true } };
const SELECT_message = {
    select: {
        id: true,
        text: true,
        timestamp: true,
        messageType: true,
        user: SELECT_user,
    },
};
const SELECT_all_chat_data = {
    select: {
        id: true,
        title: true,
        createdAt: true,
        createdBy: SELECT_user,

        users: SELECT_user,
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
    clientId: string;
}
@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService, private usersService: UsersService) {
        this.getOrCreateGlobalChat();
    }

    private logger = new Logger('ChatService');

    private authenticatedUsersPerChat: {
        chatId: string;
        usersOnline: AuthenticatedUser[];
    }[] = [];
    private filterAuthenticatedUsers(cb: (user: AuthenticatedUser) => boolean) {
        this.authenticatedUsersPerChat = this.authenticatedUsersPerChat.map(({ chatId, usersOnline }) => ({
            chatId,
            usersOnline: usersOnline.filter(cb),
        }));
    }
    private filterOutDisconnectedClients(connectedClientIds: Set<string>) {
        this.filterAuthenticatedUsers(user => connectedClientIds.has(user.clientId));
    }
    private filterOutSingleClient(clientId: string) {
        this.filterAuthenticatedUsers(user => user.clientId != clientId);
    }
    private pushOnlineUserToChats(user: AuthenticatedUser, chatIds: string[]) {
        chatIds.forEach(chatId => {
            if (this.authenticatedUsersPerChat.some(chat => chat.chatId == chatId))
                this.authenticatedUsersPerChat.find(chat => chat.chatId == chatId).usersOnline.push(user);
            else this.authenticatedUsersPerChat.push({ chatId, usersOnline: [user] });
        });
    }
    getOnlineUsersByChatId(chatId: string) {
        const chat = this.authenticatedUsersPerChat.find(chat => chat.chatId == chatId);
        return (
            chat || {
                chatId,
                usersOnline: [],
            }
        );
    }
    private logAuthenticatedUsers() {
        console.log(
            'authenticated users:',
            this.authenticatedUsersPerChat.map(({ usersOnline, ...chat }) => ({
                ...chat,
                usersOnline: usersOnline.map(u => u.username),
            })),
            '\n',
        );
    }

    onClientConnected(connectedClientIds: Set<string>) {
        this.filterOutDisconnectedClients(connectedClientIds);
    }

    onClientDisconnected(clientId: string): { disconnectedUser: UserPreview | null; chatIds: string[] } {
        const { userId: id, username } = this.getUserFromClientId(clientId);
        const chatIds = this.getChatsWithUser(clientId);
        this.filterOutSingleClient(clientId);

        return {
            disconnectedUser: { username, id },
            chatIds,
        };
    }

    getUserFromClientId(clientId: string): AuthenticatedUser | null {
        return this.authenticatedUsersPerChat.reduce((prev: AuthenticatedUser | null, curr) => {
            if (prev) return prev;
            return curr.usersOnline.find(user => user.clientId == clientId);
        }, null);
        // return this.authenticatedUsersPerChat.find(user => user.clientId == clientId);
    }
    getChatsWithUser(clientId: string) {
        return this.authenticatedUsersPerChat
            .filter(c => c.usersOnline.some(user => user.clientId == clientId))
            .map(c => c.chatId);
    }

    async authenticateSocket(clientId: string, accessToken: string) {
        const { authenticated, id, username, chatIds } = await this.usersService.authenticateFromToken(accessToken);

        if (authenticated) {
            this.pushOnlineUserToChats({ userId: id, username, clientId }, chatIds);
            // this.authenticatedUsersPerChat.push({ userId: id, username, clientId });
            this.logAuthenticatedUsers();
        }

        return {
            authenticated,
            user: { username, id } as UserPreview,
            chatIds,
        };
    }

    ///////////////////////// CRUD stuff //////////////////////////
    async createChat(userId: string, title: string): Promise<ChatRoomPreview> {
        return await this.prisma.chatRoom.create({
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

    async joinChat(user: User, chatId: string) {
        try {
            let chatRoom = await this.prisma.chatRoom.findFirst({
                where: { id: chatId, ...WHERE_user_id(user.id) },
                // include: {
                //     users: SELECT_user,
                //     createdBy: SELECT_user,
                // },
                ...SELECT_chat_preview,
            });
            if (chatRoom) return { chatRoom, successMessage: 'You already joined the chat' };

            chatRoom = await this.prisma.chatRoom.update({
                where: { id: chatId },
                data: { users: { connect: { id: user.id } } },
                // include: {
                //     users: SELECT_user,
                //     createdBy: SELECT_user,
                // },
                ...SELECT_chat_preview,
            });
            if (!chatRoom) throw new NotFoundException();

            return {
                chatRoom,
                successMessage: `Successfully joined chat '${chatRoom.title || chatRoom.id}'`,
            };
        } catch (err) {
            throw new NotFoundException();
        }
    }
    async leaveChat(user: User, chatRoomId: string) {
        try {
            let chatRoom = await this.prisma.chatRoom.findFirst({
                where: { id: chatRoomId, ...WHERE_user_id(user.id) },
            });
            if (!chatRoom) return { successMessage: 'You already left the chat' };

            chatRoom = await this.prisma.chatRoom.update({
                where: { id: chatRoomId },
                data: { users: { disconnect: { id: user.id } } },
            });
            if (!chatRoom) throw new NotFoundException();

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

    async getAllJoinedChats(user: User): Promise<ChatRoomPreview[]> {
        return await this.prisma.chatRoom.findMany({
            where: { ...WHERE_user_id(user.id) },
            select: {
                id: true,
                title: true,
            },
        });
    }

    async persistMessageInChat(messageText: string, chatId: string, userId: string) {
        try {
            // const chatRoom = await this.prisma.chatRoom.update({
            //     where: { id: chatId },
            //     data: {
            //         messages: {
            //             create: {
            //                 text: messageText,
            //                 user: {
            //                     connect: { id: userId },
            //                 },
            //             },
            //         },
            //     },
            // });
            // if (!chatRoom) throw new NotFoundException();

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
                    user: SELECT_user,
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
