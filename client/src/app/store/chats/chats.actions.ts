import { createAction, props } from '@ngrx/store';
import { ChatGroupPreview, ChatType, FriendshipInvitation, InvitationStatus } from 'src/shared/index.model';
import {
    ChatPreview,
    StoredMessage,
} from './chats.model';

export const chatsActions = {
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

    loadFriendshipInvitations: createAction(
        '[ FRIENDSHIPS ] load invitations',
        props<{ statusFilter: InvitationStatus }>(),
    ),
    loadFriendshipInvitationsSuccess: createAction(
        '[ FRIENDSHIPS ] load invitations success',
        props<{ invitations: FriendshipInvitation[] }>(),
    ),
    respondToInvitation: createAction(
        '[ FRIENDSHIPS ] respond to invitation',
        props<{ invitationId: string; response: 'accept' | 'decline' }>(),
    ),
    respondToInvitationSuccess: createAction(
        '[ FRIENDSHIPS ] respond to invitation success',
        props<{ chatPreview?: ChatPreview, invitationId: string }>(),
    ),
};
