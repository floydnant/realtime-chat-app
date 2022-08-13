import { MessageTypes, UserPreview } from './index.model';

interface ServerChatMessage {
    id: string;
    timestamp: string;
    text: string;
    chatId: string;
    userId: string;
    messageType: MessageTypes.CHAT_MESSAGE;
}

export interface Client_AuthenticateEventPayload {
    accessToken: string;
}
export interface Server_AuthenticateEventPayload {
    authenticated: boolean;
}

export interface Server_UserJoinedChatPayload {
    user: UserPreview;
    chatId: string;
}

export interface Server_NewFriendInvite {
    invitationId: string;
}
export interface Server_AcceptFriendInvite {
    friendshipId: string;
}
export interface Server_DeleteFriendInvite {
    invitationId: string;
}

export interface Client_TypingEventPayload {
    chatId: string;
    isTyping: boolean;
}
export interface Server_TypingEventPayload {
    username: string;
    isTyping: boolean;
    chatId: string;
}

export interface Client_ChatMessagePayload {
    chatId: string;
    messageText: string;
    sendingId: string;
}
export interface Server_ChatMessagePayload {
    chatId: string;
    message: ServerChatMessage & {
        user: UserPreview;
    };
    sendingId: string;
}

export interface Server_UserOnlineStatusEventPayload {
    // text: string;
    user: UserPreview;
    online: boolean;
    chatIds: string[];
}

export interface Server_UsersOnlinePayload {
    chatId: string;
    usersOnline: string[];
}
