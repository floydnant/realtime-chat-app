import {
    Client_AuthenticateEventPayload,
    Client_ChatMessagePayload,
    Server_UserJoinedChatPayload,
    Client_TypingEventPayload,
    Server_AuthenticateEventPayload,
    Server_ChatMessagePayload,
    Server_TypingEventPayload,
    Server_UserOnlineStatusEventPayload,
    Server_UsersOnlinePayload,
    Server_NewFriendInvite,
    Server_DeleteFriendInvite,
    Server_AcceptFriendInvite,
} from './chat-event-payloads.model';
import { SocketEvents } from './socket-events.model';

export interface SocketEventPayloadMap {
    [SocketEvents.CLIENT__AUTHENTICATE]: Client_AuthenticateEventPayload;
    [SocketEvents.SERVER__AUTHENTICATE]: Server_AuthenticateEventPayload;
    [SocketEvents.SERVER__AUTHENTICATE_PROMPT]: undefined | null;
    [SocketEvents.CLIENT__LOGOUT]: undefined | null;

    [SocketEvents.SERVER__USER_JOINED_CHAT]: Server_UserJoinedChatPayload;

    [SocketEvents.SERVER__NEW_FRIEND_INVITE]: Server_NewFriendInvite;
    [SocketEvents.SERVER__ACCEPT_FRIEND_INVITE]: Server_AcceptFriendInvite;
    [SocketEvents.SERVER__DELETE_FRIEND_INVITE]: Server_DeleteFriendInvite;

    [SocketEvents.CLIENT__TYPING_EVENT]: Client_TypingEventPayload;
    [SocketEvents.SERVER__TYPING_EVENT]: Server_TypingEventPayload;

    [SocketEvents.CLIENT__CHAT_MESSAGE]: Client_ChatMessagePayload;
    [SocketEvents.SERVER__CHAT_MESSAGE]: Server_ChatMessagePayload;

    [SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT]: Server_UserOnlineStatusEventPayload;

    [SocketEvents.SERVER__USERS_ONLINE]: Server_UsersOnlinePayload;
}

export type SocketEventPayloadAsFnMap = {
    [event in EventName]: (payload: EventPayload<event>) => void;
};

export type EventName = keyof SocketEventPayloadMap;
export type EventPayload<K extends EventName> = SocketEventPayloadMap[K];
