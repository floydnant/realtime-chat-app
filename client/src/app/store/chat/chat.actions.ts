import { createAction, props } from '@ngrx/store';
import {
    ChatGroupPreview,
    ChatType,
    ReceivedFriendshipInvitation,
    InvitationStatus,
    SentFriendshipInvitation,
    InvitationResponse,
} from 'src/shared/index.model';
import { ChatPreview, SendFriendshipInvitationResponse, StoredMessage } from './chat.model';

export const chatActions = {
    newMessage: createAction('[ CHATS ] new message', props<{ chatId: string; message: StoredMessage }>()),

    loadChatPreviews: createAction('[ CHATS ] get joined chat previews'),
    loadChatPreviewsSuccess: createAction(
        '[ CHATS ] get joined chat previews success',
        props<{ chatPreviews: ChatPreview[] }>(),
    ),

    setActiveChat: createAction('[ CHATS ] set active', props<{ chatId: string }>()),
    setActiveChatSuccess: createAction('[ CHATS ] set active success', props<{ chatId: string }>()),

    loadActiveChatMessages: createAction(
        '[ CHATS ] load active messages',
        props<{ chatId: string; chatType: ChatType }>(),
    ),
    loadActiveChatMessagesSuccess: createAction(
        '[ CHATS ] load active messages success',
        props<{
            chatId: string;
            messages: StoredMessage[];
            alreadyStored?: boolean;
        }>(),
    ),
    loadChatMessagesSuccess: createAction(
        '[ CHATS ] load messages success',
        props<{ chatId: string; chatType: ChatType; messages: StoredMessage[] }>(),
    ),

    createChat: createAction('[ CHATS ] create chat', props<{ title: string }>()),
    createChatSuccess: createAction('[ CHATS ] create chat success', props<{ createdChat: ChatGroupPreview }>()),

    joinChatSuccess: createAction('[ CHATS ] join chat success', props<{ chat: ChatGroupPreview }>()),

    // @TODO: friendship + invitation CRUD

    loadReceivedInvitations: createAction(
        '[ FRIENDSHIPS ] load received invitations',
        props<{ statusFilter: InvitationStatus }>(),
    ),
    loadReceivedInvitationsSuccess: createAction(
        '[ FRIENDSHIPS ] load received invitations success',
        props<{ invitations: ReceivedFriendshipInvitation[]; statusFilter: InvitationStatus }>(),
    ),
    loadReceivedInvitationsError: createAction('[ FRIENDSHIPS ] load invitations error'),
    respondToInvitation: createAction(
        '[ FRIENDSHIPS ] respond to invitation',
        props<{ invitationId: string; response: InvitationResponse }>(),
    ),
    respondToInvitationSuccess: createAction(
        '[ FRIENDSHIPS ] respond to invitation success',
        props<{
            chatPreview?: ChatPreview;
            invitationId: string;
            invitationResponse: InvitationResponse;
        }>(),
    ),

    loadSentInvitations: createAction('[ FRIENDSHIPS ] load sent invitations'),
    loadSentInvitationsSuccess: createAction(
        '[ FRIENDSHIPS ] load sent invitations success',
        props<{ invitations: SentFriendshipInvitation[] }>(),
    ),
    loadSentInvitationsError: createAction('[ FRIENDSHIPS ] load sent invitations error'),

    sendInvitation: createAction('[ FRIENDSHIPS ] send invitation', props<{ userId: string }>()),
    sendInvitationSuccess: createAction(
        '[ FRIENDSHIPS ] send invitation success',
        props<SendFriendshipInvitationResponse>(),
    ),

    deleteInvitation: createAction('[ FRIENDSHIPS ] delete invitation', props<{ invitationId: string }>()),
    deleteInvitationSuccess: createAction(
        '[ FRIENDSHIPS ] delete invitation success',
        props<{ invitationId: string }>(),
    ),
};
