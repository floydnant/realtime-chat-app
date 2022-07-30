import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { SELECT_user_preview_WHERE_NOT } from 'src/query-helpers';

@Injectable()
export class ChatPreviewsService {
    constructor(private prisma: PrismaService) {}

    async getChatPreviews(userId: string) {
        const [friendships, chatGroups] = await Promise.all([
            this.prisma.friendship.findMany({
                where: { users: { some: { id: userId } } },
                select: {
                    id: true,
                    users: SELECT_user_preview_WHERE_NOT(userId),
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                        select: { timestamp: true, text: true, userId: true },
                    },
                },
            }),
            this.prisma.chatGroup.findMany({
                where: { members: { some: { userId } } },
                select: {
                    id: true,
                    title: true,
                    messages: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                        select: { timestamp: true, text: true, userId: true },
                    },
                },
            }),
        ]);
        // @TODO: sort chats by last message
        const chats = [
            ...friendships.map(({ id, users, messages }) => ({
                friendshipOrChatGroupId: id,
                title: users[0].username,
                chatType: 'private',
                lastMessage: messages[0],
            })),
            ...chatGroups.map(({ id, title, messages }) => ({
                friendshipOrChatGroupId: id,
                title,
                chatType: 'group',
                lastMessage: messages[0],
            })),
        ];
        return chats;
    }
}
