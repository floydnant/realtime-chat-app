// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Prisma } from '@prisma/client';
// TYPES are ONLY for debugging and prototyping, because they break the query type inference

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SELECT<T> = { select: T };

export const SELECT_user_preview /* : SELECT<Prisma.UserSelect> */ = { select: { id: true, username: true } };
export const SELECT_member_user_preview /* : SELECT<Prisma.MembershipSelect> */ = {
    select: { user: SELECT_user_preview },
};
export const SELECT_message /* : SELECT<Prisma.MessageSelect> */ = {
    select: {
        id: true,
        text: true,
        timestamp: true,
        messageType: true,
        user: SELECT_user_preview,
    },
};

export const SELECT_all_chat_data /* : SELECT<Prisma.ChatGroupSelect> */ = {
    select: {
        id: true,
        title: true,
        info: true,
        createdAt: true,
        createdBy: SELECT_user_preview,
        owner: SELECT_user_preview,

        members: SELECT_member_user_preview,
        messages: SELECT_message,
    },
};
export const SELECT_chat_preview /* : SELECT<Prisma.ChatGroupSelect> */ = {
    select: {
        id: true,
        title: true,
    },
};

export const WHERE_user_id = (userId: string) => ({
    users: { some: { id: userId } },
});
export const WHERE_member = (userId: string) => ({
    members: { some: { userId } },
});
export const SELECT_user_preview_WHERE_NOT = (idToExclude: string) => ({
    where: { id: { not: idToExclude } },
    ...SELECT_user_preview,
});
