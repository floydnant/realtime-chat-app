import { createReducer, on } from '@ngrx/store';
import { getCopyOf } from 'src/app/utils';
import { chatsActions } from './chats.actions';
import { ChatRoomDetails, ChatRoomApiResponse, ChatRoomPreview, ChatsState, StoredChatMessage } from './chats.model';

export const initialState = new ChatsState();

const loadChatMessagesSuccess = (
    state: ChatsState,
    { messages, chatId }: { chatId: string; messages: StoredChatMessage[] },
    isActiveChat = false,
): ChatsState => {
    return {
        ...state,
        messagesByChat: {
            ...state.messagesByChat,
            [chatId]: messages,
        },
        loadingActiveChatMessages: isActiveChat ? false : state.loadingActiveChatMessages,
    };
};

export const chatsReducer = createReducer(
    initialState,

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

    // set active chat
    on(chatsActions.setActiveChat, (state, { chatId }) => {
        return { ...state, activeChatId: chatId };
    }),
    // load messages for active chat
    on(chatsActions.loadActiveChatMessages, state => ({
        ...state,
        loadingActiveChatMessages: true,
    })),

    // successfully loaded messages for active chat
    on(chatsActions.loadActiveChatMessagesSuccess, (state, action) => {
        if (action.alreadyStored) return { ...state, loadingActiveChatMessages: false };
        return loadChatMessagesSuccess(state, action, true);
    }),
    // successfully loaded messages
    on(chatsActions.loadChatMessagesSuccess, loadChatMessagesSuccess),

    // successfully loaded chat previews
    on(chatsActions.loadChatPreviewsSuccess, (state, { chatPreviews }) => {
        return {
            ...state,
            chatPreviews: chatPreviews,
        };
    }),

    // successfully created a chat
    on(chatsActions.createChatSuccess, (state, { createdChat }) => {
        return {
            ...state,
            chatPreviews: [...state.chatPreviews, createdChat],
        };
    }),

    // successfully joined a chat
    on(chatsActions.joinChatSuccess, (state, { chat }) => {
        return {
            ...state,
            chatPreviews: [...state.chatPreviews, chat],
        };
    }),
);
