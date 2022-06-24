import { createReducer, on } from '@ngrx/store';
import { getCopyOf } from 'src/app/utils';
import { chatsActions } from './chats.actions';
import { ChatRoomDetails, ChatRoomApiResponse, ChatRoomPreview, ChatsState, StoredChatMessage } from './chats.model';

export const initialState = new ChatsState();

const loadChatMessagesSuccess = (
    state: ChatsState,
    { messages, chatId }: { chatId: string; messages: StoredChatMessage[] },
) => {
    return {
        ...state,
        messagesByChat: {
            ...state.messagesByChat,
            [chatId]: messages,
        },
    };
};

export const chatsReducer = createReducer(
    initialState,

    // set active chat
    on(chatsActions.setActiveChat, (state, { chatId }) => {
        return { ...state, activeChatId: chatId };
    }),
    // new incoming message
    on(chatsActions.newMessage, (state, { chatId, message }) => {
        return {
            ...state,
            messagesByChat: {
                ...state.messagesByChat,
                [chatId]: [...(state.messagesByChat[chatId] || []), message],
            },
        };
    }),

    // loaded messages for active chat
    on(chatsActions.loadActiveChatMessagesSuccess, (state, action) => {
        if (action.alreadyStored) return state;
        return loadChatMessagesSuccess(state, action);
    }),
    // loaded messages
    on(chatsActions.loadChatMessagesSuccess, loadChatMessagesSuccess),

    // loaded chat previews
    on(chatsActions.loadChatPreviewsSuccess, (state, { chatPreviews }) => {
        return {
            ...state,
            chatPreviews: chatPreviews,
        };
    }),

    // created a chat
    on(chatsActions.createChatSuccess, (state, { createdChat }) => {
        return {
            ...state,
            chatPreviews: [...state.chatPreviews, createdChat],
        };
    }),

    // joined a chat
    // FIXME: some things dont work around here (not a useful note, but just a reminder)
    on(chatsActions.joinChatSuccess, (state, { chat }) => {
        return {
            ...state,
            chatPreviews: [...state.chatPreviews, chat],
        };
    }),
);
