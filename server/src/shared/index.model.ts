export enum MessageTypes {
    CHAT_MESSAGE = 'text',
    USER_EVENT = 'event',
}

export interface UserPreview {
    id: string;
    username: string;
}
export interface UserSearchResult extends UserPreview {
    bio: string;
    friendshipId?: string;
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

export type ReceivedFriendshipInvitation = Omit<FriendshipInvitation, 'invitee'>;
export type SentFriendshipInvitation = Omit<FriendshipInvitation, 'inviter'>;
export interface FriendshipInvitation {
    id: string;
    status: InvitationStatus;
    inviter: UserPreview;
    invitee: UserPreview;
    invitedAt: string;
}
export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
}
export enum InvitationResponse {
    ACCEPT = 'accept',
    DECLINE = 'decline',
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
export interface FriendshipData {
    friend: UserPreview;
}
export interface FriendshipDetails {
    friendsSince: string;
}
export type FriendshipFull = FriendshipData & FriendshipDetails & { id: string };

export interface UserDetails {
    friendshipId: string | undefined; // to indicate wether the user is a friend or not
    bio?: string;
    // lastOnline?: string;
    imageUrl?: string;
}

export interface ChatGroupPreview {
    id: string;
    title: string;
}
