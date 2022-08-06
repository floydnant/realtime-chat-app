import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma-abstractions/prisma.service';
import { SELECT_user_preview_WHERE_NOT, TAKE_LAST_message_preview } from 'src/prisma-abstractions/query-helpers';
import { ChatType, UserPreview } from 'src/shared/index.model';
import { ChatPreview, MessagePreview } from 'src/models/index.model';

const convertFriendshipToChatPreview = ({
    id,
    users,
    messages,
}: {
    id: string;
    users: UserPreview[];
    messages: MessagePreview[];
}) => ({
    friendshipOrChatGroupId: id,
    title: users[0].username,
    chatType: ChatType.PRIVATE,
    lastMessage: messages[0],
});

const convertChatGroupToChatPreview = ({
    id,
    title,
    messages,
}: {
    id: string;
    messages: MessagePreview[];
    title: string;
}) => ({
    friendshipOrChatGroupId: id,
    title,
    chatType: ChatType.GROUP,
    lastMessage: messages[0],
});

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
                    messages: TAKE_LAST_message_preview,
                },
            }),
            this.prisma.chatGroup.findMany({
                where: { members: { some: { userId } } },
                select: {
                    id: true,
                    title: true,
                    messages: TAKE_LAST_message_preview,
                },
            }),
        ]);

        const chats = [
            ...friendships.map<ChatPreview>(convertFriendshipToChatPreview),
            ...chatGroups.map<ChatPreview>(convertChatGroupToChatPreview),
        ];
        return chats;
    }

    async getChatPreview(userId: string, chatId: string, type: 'group' | 'friendship') {
        if (type == 'group') {
            const chatGroup = await this.prisma.chatGroup.findFirst({
                where: {
                    id: chatId,
                    members: { some: { userId } },
                },
                select: {
                    id: true,
                    title: true,
                    messages: TAKE_LAST_message_preview,
                },
            });

            return convertChatGroupToChatPreview(chatGroup);
        }

        const friendship = await this.prisma.friendship.findFirst({
            where: {
                id: chatId,
                users: { some: { id: userId } },
            },
            select: {
                id: true,
                users: SELECT_user_preview_WHERE_NOT(userId),
                messages: TAKE_LAST_message_preview,
            },
        });

        return convertFriendshipToChatPreview(friendship);
    }
}
