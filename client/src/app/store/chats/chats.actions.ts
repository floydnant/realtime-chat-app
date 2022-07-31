import { createAction, props } from '@ngrx/store';
import { StoredChatMessage, ChatGroupPreview, ChatPreview, ChatType } from './chats.model';

export const chatsActions = {
    newMessage: createAction('[ CHATS ] new message', props<{ chatId: string; message: StoredChatMessage }>()),

    loadChatPreviews: createAction('[ CHATS ] get joined chat previews'),
    loadChatPreviewsSuccess: createAction(
        '[ CHATS ] get joined chat previews success',
        props<{ chatPreviews: ChatPreview[] }>(),
    ),

    setActiveChat: createAction('[ CHATS ] set active', props<{ chatId: string }>()),
    setActiveChatSuccess: createAction('[ CHATS ] set active success', props<{ chatId: string }>()),

    loadActiveChatMessages: createAction('[ CHATS ] load active messages', props<{ chatId: string, chatType: ChatType }>()),
    loadActiveChatMessagesSuccess: createAction(
        '[ CHATS ] load active messages success',
        props<{
            chatId: string;
            messages: StoredChatMessage[];
            alreadyStored?: boolean;
        }>(),
    ),
    loadChatMessagesSuccess: createAction(
        '[ CHATS ] load messages success',
        props<{ chatId: string; chatType: ChatType, messages: StoredChatMessage[] }>(),
    ),

    createChat: createAction('[ CHATS ] create chat', props<{ title: string }>()),
    createChatSuccess: createAction('[ CHATS ] create chat success', props<{ createdChat: ChatGroupPreview }>()),

    joinChatSuccess: createAction('[ CHATS ] join chat success', props<{ chat: ChatGroupPreview }>()),

    // @TODO: friendship + invitation CRUD
};
