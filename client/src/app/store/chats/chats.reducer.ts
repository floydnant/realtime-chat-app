import { createReducer, on } from '@ngrx/store';
import { ChatType } from 'src/shared/index.model';
import { chatsActions } from './chats.actions';
import { ChatsState, StoredMessage } from './chats.model';

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
    on(chatsActions.loadChatPreviews, state => {
        return {
            ...state,
            loadingChatPreviews: true,
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

    // load friendship invitations
    on(chatsActions.loadFriendshipInvitations, state => {
        return {
            ...state,
            loadingInvitationsReceived: true,
        };
    }),
    on(chatsActions.loadFriendshipInvitationsSuccess, (state, { invitations }) => {
        return {
            ...state,
            loadingInvitationsReceived: false,
            invitationsReceived: invitations,
        };
    }),
    // responded to invitaipn successfully
    on(chatsActions.respondToInvitationSuccess, (state, { chatPreview, invitationId }) => {
        return {
            ...state,
            chatPreviews: chatPreview
                ? [...state.chatPreviews, chatPreview]
                : state.chatPreviews, // prettier-ignore
            invitationsReceived: state.invitationsReceived.filter(invitation => invitation.id != invitationId),
        };
    }),
);
