import {
    ChatPreview_,
    StoredMessage_,
    MessagePreview_,
    FriendshipInvitation,
    ChatGroup,
    ChatGroupDetails,
    Friendship,
    FriendshipDetails,
    UserDetails,
} from 'src/shared/index.model';

export type MessagePreview = MessagePreview_<'client'>;
export type StoredMessage = StoredMessage_<'client'>;
export type ChatPreview = ChatPreview_<'client'>;

export class ChatsState {
    activeChatId: string | null = null;

    chatPreviews: ChatPreview[] = [];
    loadingChatPreviews: boolean = false;

    chatGroups: Record<string, ChatGroup> = {};
    chatGroupsDetails: Record<string, ChatGroupDetails> = {};
    friendships: Record<string, Friendship> = {};
    friendshipsDetails: Record<string, FriendshipDetails> = {};
    loadingDetails: boolean = false;

    messagesByChat: Record<string, StoredMessage[]> = {};
    loadingActiveChatMessages = false;

    users: Record<string, UserDetails>;

    invitationsReceived: FriendshipInvitation[] = [];
    loadingInvitationsReceived = false;
}

// export class ChatRoomDetails {
//     id: string;
//     createdAt: string;
//     createdBy: UserPreview;
//     title: string;
//     users: UserPreview[];
// }
// export class ChatRoomApiResponse extends ChatRoomDetails {
//     messages: StoredMessage[];
// }
