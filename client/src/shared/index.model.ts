export enum MessageTypes {
    CHAT_MESSAGE = 'text',
    USER_EVENT = 'event',
}

export interface UserPreview {
    id: string;
    username: string;
}

export interface ChatRoomPreview {
    id: string;
    title: string;
}

type ModelVersion = 'client' | 'server';

export interface ChatPreview_<T extends ModelVersion> {
    friendshipOrChatGroupId: string;
    title: string; // <= groupTitle or friendName
    chatType: ChatType;
    lastMessage?: MessagePreview_<T>;
}
export enum ChatType {
    GROUP = 'group',
    PRIVATE = 'private',
}

export interface MessagePreview_<T extends ModelVersion> {
    timestamp: T extends 'server' ? Date : string;
    text: string;
    user: UserPreview;
}

export interface StoredMessage_<T extends ModelVersion> extends MessagePreview_<T> {
    id: string;
    messageType: MessageTypes.CHAT_MESSAGE;
    repliedToMessageId?: string;
}

export interface FriendshipInvitation {
    id: string;
    status: InvitationStatus;
    inviter: UserPreview;
    invitedAt: string;
}
export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
}

// type ChatFull =
//     | (ChatPreview & { chatType: 'group' } & ChatGroup & ChatGroupDetails)
//     | (ChatPreview & { chatType: 'private' } & Friendship & FriendshipDetails);

export interface ChatGroup {
    members: UserPreview[];
    imageUrl?: string;
}
export interface ChatGroupDetails {
    info?: string;
    createdAt: string;
    createdBy: UserPreview;
    owner: UserPreview;
}
export interface Friendship {
    friend: UserPreview;
}
export interface FriendshipDetails {
    friendsSince: string;
}
export type FriendshipFull = Friendship & FriendshipDetails & { id: string };

export interface UserDetails {
    friendshipId?: string; // to indicate wether the user is a friend or not
    bio?: string;
    isOnline: boolean;
    lastOnline?: string;
    imageUrl?: string;
}

export interface ChatGroupPreview {
    id: string;
    title: string;
}
