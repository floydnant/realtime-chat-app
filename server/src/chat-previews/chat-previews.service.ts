import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma-abstractions/prisma.service';
import { SELECT_user_preview_WHERE_NOT, TAKE_LAST_message_preview } from 'src/prisma-abstractions/query-helpers';
import { ChatType } from 'src/shared/index.model';
import { ChatPreview } from 'src/models/index.model';

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
            ...friendships.map<ChatPreview>(({ id, users, messages }) => ({
                friendshipOrChatGroupId: id,
                title: users[0].username,
                chatType: ChatType.PRIVATE,
                lastMessage: messages[0],
            })),
            ...chatGroups.map<ChatPreview>(({ id, title, messages }) => ({
                friendshipOrChatGroupId: id,
                title,
                chatType: ChatType.GROUP,
                lastMessage: messages[0],
            })),
        ];
        return chats;
    }
}
