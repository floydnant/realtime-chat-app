import {
    ChatPreview_,
    StoredMessage_,
    MessagePreview_,
    ReceivedFriendshipInvitation,
    ChatGroup,
    ChatGroupDetails,
    Friendship,
    FriendshipDetails,
    UserDetails,
    SentFriendshipInvitation,
} from 'src/shared/index.model';
import { HttpSuccessResponse } from '../app.model';

export type MessagePreview = MessagePreview_<'client'>;
export type StoredMessage = StoredMessage_<'client'>;
export type ChatPreview = ChatPreview_<'client'>;

export class ChatsState {
    activeChatId: string | null = null;

    chatPreviews: ChatPreview[] = [];
    loadingChatPreviews: boolean = false;

    // @TODO: implement details view
    // chatGroups: Record<string, ChatGroup> = {};
    // chatGroupsDetails: Record<string, ChatGroupDetails> = {};
    // friendships: Record<string, Friendship> = {};
    // friendshipsDetails: Record<string, FriendshipDetails> = {};
    // loadingDetails: boolean = false;

    messagesByChat: Record<string, StoredMessage[]> = {};
    loadingActiveChatMessages = false;

    users: Record<string, UserDetails>;

    receivedInvitations: {
        pending?: ReceivedFriendshipInvitation[];
        accepted?: ReceivedFriendshipInvitation[];
        declined?: ReceivedFriendshipInvitation[];
        loading: boolean;
    } = {
        // @TODO: maybe let them default to null
        pending: undefined,
        accepted: undefined,
        declined: undefined,
        loading: false,
    };

    sentInvitations: {
        all?: SentFriendshipInvitation[];
        loading: boolean;
    } = {
        loading: false,
    };
}

export type SendFriendshipInvitationResponse = HttpSuccessResponse<{
    invitation: SentFriendshipInvitation;
    alreadyInvited: false
} | {
    invitation: undefined;
    alreadyInvited: true
}>;

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
