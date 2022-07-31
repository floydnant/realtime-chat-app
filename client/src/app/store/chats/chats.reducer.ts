import { createReducer, on } from '@ngrx/store';
import { chatsActions } from './chats.actions';
import {
    ChatsState,
    StoredMessage,
    ChatType,
} from './chats.model';

export const initialState = new ChatsState();

const loadChatMessagesSuccess = (
    state: ChatsState,
    { messages, chatId }: { chatId: string; messages: StoredMessage[] },
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
    on(chatsActions.setActiveChatSuccess, (state, { chatId }) => {
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

    // loading chat previews
    on(chatsActions.loadChatPreviews, (state) => {
        return {
            ...state,
            loadingChatPreviews: true
        };
    }),
    // successfully loaded chat previews
    on(chatsActions.loadChatPreviewsSuccess, (state, { chatPreviews }) => {
        return {
            ...state,
            loadingChatPreviews: false,
            chatPreviews: chatPreviews,
        };
    }),

    // successfully created a chat
    on(chatsActions.createChatSuccess, (state, { createdChat: { id, ...createdChat } }) => {
        return {
            ...state,
            chatPreviews: [
                ...state.chatPreviews,
                {
                    chatType: ChatType.GROUP,
                    friendshipOrChatGroupId: id,
                    ...createdChat,
                },
            ],
        };
    }),

    // successfully joined a chat
    on(chatsActions.joinChatSuccess, (state, { chat: { id, ...chat } }) => {
        return {
            ...state,
            chatPreviews: [
                ...state.chatPreviews,
                {
                    chatType: ChatType.GROUP,
                    friendshipOrChatGroupId: id,
                    ...chat,
                },
            ],
        };
    }),
);
