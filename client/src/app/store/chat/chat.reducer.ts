import { createReducer, on } from '@ngrx/store';
import { ChatType } from 'src/shared/index.model';
import { userActions } from '../user/user.actions';
import { chatActions } from './chat.actions';
import { ChatsState, StoredMessage } from './chat.model';

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

    on(userActions.logout, () => initialState),

    // new incoming message
    on(chatActions.newMessage, (state, { chatId, message }) => {
        return {
            ...state,
            messagesByChat: {
                ...state.messagesByChat,
                [chatId]: [...(state.messagesByChat[chatId] || []), message],
            },
        };
    }),

    // set active chat
    on(chatActions.setActiveChatSuccess, (state, { chatId }) => {
        return { ...state, activeChatId: chatId };
    }),
    // load messages for active chat
    on(chatActions.loadActiveChatMessages, state => ({
        ...state,
        loadingActiveChatMessages: true,
    })),

    // successfully loaded messages for active chat
    on(chatActions.loadActiveChatMessagesSuccess, (state, action) => {
        if (action.alreadyStored) return { ...state, loadingActiveChatMessages: false };
        return loadChatMessagesSuccess(state, action, true);
    }),
    // successfully loaded messages
    on(chatActions.loadChatMessagesSuccess, loadChatMessagesSuccess),

    // loading chat previews
    on(chatActions.loadChatPreviews, state => {
        return {
            ...state,
            loadingChatPreviews: true,
        };
    }),
    // successfully loaded chat previews
    on(chatActions.loadChatPreviewsSuccess, (state, { chatPreviews }) => {
        return {
            ...state,
            loadingChatPreviews: false,
            chatPreviews: chatPreviews,
        };
    }),

    // successfully created a chat
    on(chatActions.createChatSuccess, (state, { createdChat: { id, ...createdChat } }) => {
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
    on(chatActions.joinChatSuccess, (state, { chat: { id, ...chat } }) => {
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
    on(chatActions.newInvitationReceived, (state, { invitation }) => {
        return {
            ...state,
            receivedInvitations: {
                ...state.receivedInvitations,
                pending: [invitation, ...(state.receivedInvitations.pending || [])],
            },
        };
    }),
    on(chatActions.loadReceivedInvitations, state => {
        return {
            ...state,
            receivedInvitations: {
                ...state.receivedInvitations,
                loading: true,
            },
        };
    }),
    on(chatActions.loadReceivedInvitationsSuccess, (state, { invitations, statusFilter }) => {
        return {
            ...state,
            receivedInvitations: {
                ...state.receivedInvitations,
                [statusFilter]: invitations,
                loading: false,
            },
        };
    }),
    // responded to invitation successfully
    on(chatActions.respondToInvitationSuccess, (state, { chatPreview, invitationId, invitationResponse }) => {
        const invitation = state.receivedInvitations.pending?.find(({ id }) => id == invitationId)!;
        const invitationsKey = invitationResponse == 'accept' ? 'accepted' : 'declined';
        return {
            ...state,
            chatPreviews: chatPreview
                ? [...state.chatPreviews, chatPreview]
                : state.chatPreviews, // prettier-ignore

            receivedInvitations: {
                ...state.receivedInvitations,
                pending: state.receivedInvitations.pending?.filter(invitation => invitation.id != invitationId),
                [invitationsKey]: [...(state.receivedInvitations[invitationsKey] || []), invitation],
            },
        };
    }),
    // friend accepted invitation
    on(chatActions.friendAcceptedInvitation, (state, { chatPreview }) => {
        return {
            ...state,
            chatPreviews: [...state.chatPreviews, chatPreview],
        };
    }),

    // load sent invitations
    on(chatActions.loadSentInvitations, state => {
        return {
            ...state,
            sentInvitations: {
                ...state.sentInvitations,
                loading: true,
            },
        };
    }),
    // loaded sent invitations successfully
    on(chatActions.loadSentInvitationsSuccess, (state, { invitations }) => {
        return {
            ...state,
            sentInvitations: {
                ...state.sentInvitations,
                all: invitations,
                loading: false,
            },
        };
    }),

    // sent invitation successfully
    on(chatActions.sendInvitationSuccess, (state, { invitation, alreadyInvited }) => {
        return {
            ...state,
            sentInvitations: {
                ...state.sentInvitations,
                all: alreadyInvited ? state.sentInvitations.all : [...(state.sentInvitations.all || []), invitation],
            },
        };
    }),

    // deleted invitation successfully
    on(chatActions.deleteInvitationSuccess, (state, { invitationId }) => {
        return {
            ...state,
            sentInvitations: {
                ...state.sentInvitations,
                all: state.sentInvitations.all?.filter(({ id }) => id != invitationId),
            },
            receivedInvitations: {
                ...state.receivedInvitations,
                pending: state.receivedInvitations.pending?.filter(({ id }) => id != invitationId),
                accepted: state.receivedInvitations.accepted?.filter(({ id }) => id != invitationId),
                declined: state.receivedInvitations.declined?.filter(({ id }) => id != invitationId),
            },
        };
    }),
);
