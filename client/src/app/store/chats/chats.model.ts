import { UserPreview, MessageTypes } from 'src/shared/index.model';

export class ChatsState_ {
    activeChatId: string | null = null;

    chatPreviews: ChatGroupPreview[] = [];
    chatsDetails: ChatRoomDetails[] = [];
    messagesByChat: { [chatId: string]: StoredMessage[] } = {};
    loadingActiveChatMessages = false;
}

interface MessagePreview {
    timestamp: string;
    text: string;
    user: UserPreview;
}
export interface StoredMessage extends MessagePreview {
    id: string;
    messageType: MessageTypes.CHAT_MESSAGE;
    repliedToMessageId?: string;
}

export interface ChatGroupPreview {
    id: string;
    title: string;
}
export class ChatRoomDetails {
    id: string;
    createdAt: string;
    createdBy: UserPreview;
    title: string;
    users: UserPreview[];
}
export class ChatRoomApiResponse extends ChatRoomDetails {
    messages: StoredMessage[];
}

// new state
export class ChatsState {
    activeChatId: string | null = null;

    chatPreviews: ChatPreview[] = [];
    loadingChatPreviews: boolean = false;

    chatGroups: Record<string, ChatGroup> = {};
    friendships: Record<string, Friendship> = {};
    chatGroupsDetails: Record<string, ChatGroupDetails> = {};
    friendshipsDetails: Record<string, FriendshipDetails> = {};
    loadingDetails: boolean = false;

    messagesByChat: Record<string, StoredMessage[]> = {};
    loadingActiveChatMessages = false;

    users: Record<string, UserDetails>;

    invitations: FriendshipInvitation[] = [];
}
export enum ChatType {
    GROUP = 'group',
    PRIVATE = 'private',
}


export interface ChatPreview {
    friendshipOrChatGroupId: string;
    title: string; // <= groupTitle or friendName
    chatType: ChatType;
    lastMessage?: MessagePreview;
}
// type ChatFull =
//     | (ChatPreview & { chatType: 'group' } & ChatGroup & ChatGroupDetails)
//     | (ChatPreview & { chatType: 'private' } & Friendship & FriendshipDetails);

interface ChatGroup {
    members: UserPreview[];
    imageUrl?: string;
}
interface ChatGroupDetails {
    info?: string;
    createdAt: string;
    createdBy: UserPreview;
    owner: UserPreview;
}
interface Friendship {
    friend: UserPreview;
}
interface FriendshipDetails {
    friendsSince: string;
}

interface UserDetails {
    friendshipId?: string; // to indicate wether the user is a friend or not
    bio?: string;
    isOnline: boolean;
    lastOnline?: string;
    imageUrl?: string;
}

interface FriendshipInvitation {
    id: string;
    status: string;
    inviter: UserPreview;
    invitedAt: string;
}
