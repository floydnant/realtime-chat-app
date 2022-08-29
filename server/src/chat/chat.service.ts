import {
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { MembershipRole, User } from '@prisma/client';
import {
    SELECT_chat_preview,
    WHERE_member,
    SELECT_all_chat_data,
    SELECT_message,
    SELECT_user_preview,
    SELECT_member_user_preview,
} from 'src/prisma-abstractions/query-helpers';
import { PrismaService } from 'src/prisma-abstractions/prisma.service';
import { ChatGroup, ChatRoomPreview } from 'src/shared/index.model';
import { SocketManagerService } from 'src/socket/socket-manager.service';
import { UsersService } from 'src/users/users.service';

const globalChatTitle = 'Global Group Chat';
@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
        private socketManager: SocketManagerService,
    ) {
        this.getOrCreateGlobalChat();
    }

    private logger = new Logger('ChatService');

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

        this.socketManager.joinRoom(userId, chatGroup.id);

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
    async getChatData(user: User, chatId: string): Promise<ChatGroup> {
        const chatGroup = await this.prisma.chatGroup.findFirst({
            where: { id: chatId, ...WHERE_member(user.id) },
            select: { members: SELECT_member_user_preview },
        });

        if (!chatGroup) throw new UnauthorizedException();
        return {
            members: chatGroup.members.map(m => m.user),
            imageUrl: null,
        };
    }

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

            this.socketManager.joinRoom(user.id, chatId);

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

        this.socketManager.leaveRoom(user.id, chatId);

        return {
            successMessage: `Successfully left chat '${chatGroup.title || chatGroup.id}'`,
        };
    }

    async addNewMemberToGroup(userId: string, newMemberId: string, chatGroupId: string) {
        const chatGroup = await this.getGroupWithAdminAndMember(chatGroupId, userId, newMemberId);
        if (chatGroup.members.length != 0)
            throw new ConflictException(`${chatGroup.members[0].user.username} is already a member of this group.`);

        const membership = await this.prisma.membership.create({
            data: {
                chatGroup: { connect: { id: chatGroupId } },
                role: MembershipRole.member,
                user: { connect: { id: newMemberId } },
            },
            select: { user: { select: { username: true } } },
        });
        if (membership) return { successMessage: `You added ${membership.user.username} to '${chatGroup.title}'.` };

        throw new InternalServerErrorException(`Could not add your friend to '${chatGroup.title}'.`);
    }
    async removeMemberFromGroup(userId: string, memberId: string, chatGroupId: string) {
        if (userId == memberId) throw new ConflictException('You cannot kick yourself from a group.');

        const chatGroup = await this.getGroupWithAdminAndMember(chatGroupId, userId, memberId);
        if (chatGroup.members.length == 0) throw new ForbiddenException(`This user is not a member of this group.`);

        const membership = await this.prisma.membership.findFirst({
            where: { userId: memberId },
            select: {
                id: true,
                role: true,
                user: { select: { username: true } },
            },
        });
        console.log(membership);
        if (membership.role == MembershipRole.admin && chatGroup.ownerId != userId)
            throw new UnauthorizedException(`You don't have owner permissions for this group.`);

        const deletedMembership = await this.prisma.membership.delete({
            where: { id: membership.id },
        });
        console.log(deletedMembership);
        if (deletedMembership)
            return { successMessage: `You kicked ${membership.user.username} from '${chatGroup.title}'.` };

        throw new InternalServerErrorException(`Could not kick ${membership.user.username} from '${chatGroup.title}'.`);
    }

    /** @returns the members contain a maximum of one user (the user with the memberId) */
    private async getGroupWithAdminAndMember(chatGroupId: string, adminId: string, memberId: string) {
        const chatGroup = await this.prisma.chatGroup.findFirst({
            where: {
                id: chatGroupId,
                members: { some: { userId: adminId, role: MembershipRole.admin } },
            },
            select: {
                title: true,
                ownerId: true,
                members: {
                    where: { userId: memberId },
                    select: { user: { select: { username: true } } },
                },
            },
        });
        if (!chatGroup) throw new UnauthorizedException("You don't have admin permissions for this group.");
        return chatGroup;
    }

    async isUserChatMember(chatId: string, userId: string) {
        // @TODO: this is not ideal, lets look out for a better solution
        const membership = await this.prisma.membership.findFirst({
            where: { chatGroupId: chatId, userId },
            select: { id: true },
        });
        if (membership) return true;

        const friendship = await this.prisma.friendship.findFirst({
            where: { id: chatId, users: { some: { id: userId } } },
            select: { id: true },
        });
        return !!friendship;
    }

    async getJoinedChats(userId: string): Promise<ChatRoomPreview[]> {
        return await this.prisma.chatGroup.findMany({
            where: { ...WHERE_member(userId) },
            ...SELECT_chat_preview,
        });
    }

    async persistMessageInChat(messageText: string, chatId: string, userId: string) {
        try {
            // @TODO: this is not ideal, lets look out for a better solution
            const chatGroup = await this.prisma.chatGroup.findUnique({ where: { id: chatId } });
            const persistedMessage = await this.prisma.message.create({
                data: {
                    text: messageText,
                    user: { connect: { id: userId } },
                    [chatGroup ? 'chat' : 'friendShip']: { connect: { id: chatId } },
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
