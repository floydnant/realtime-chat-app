import { createAction, props } from '@ngrx/store';
import {
    ChatGroupPreview,
    ChatType,
    ReceivedFriendshipInvitation,
    InvitationStatus,
    SentFriendshipInvitation,
    InvitationResponse,
    FriendshipInvitation,
    UserDetails,
    FriendshipData,
    ChatGroup,
    UserPreview,
} from 'src/shared/index.model';
import { ChatPreview, SendFriendshipInvitationResponse, StoredMessage } from './chat.model';

export const chatActions = {
    newMessage: createAction('[ CHAT ] new message', props<{ chatId: string; message: StoredMessage }>()),

    loadChatPreviews: createAction('[ CHAT ] get joined chat previews'),
    loadChatPreviewsSuccess: createAction(
        '[ CHAT ] get joined chat previews success',
        props<{ chatPreviews: ChatPreview[] }>(),
    ),
    loadChatPreview: createAction('[ CHAT ] load chat preview by id', props<{ chatId: string }>()),
    loadChatPreviewSuccess: createAction(
        '[ CHAT ] load chat preview by id succes',
        props<{ chatPreview: ChatPreview }>(),
    ),

    setActiveChat: createAction('[ CHAT ] set active', props<{ chatId: string }>()),
    setActiveChatSuccess: createAction('[ CHAT ] set active success', props<{ chatId: string }>()),

    loadActiveChatMessages: createAction(
        '[ CHAT ] load active messages',
        props<{ chatId: string; chatType: ChatType }>(),
    ),
    loadActiveChatMessagesSuccess: createAction(
        '[ CHAT ] load active messages success',
        props<{
            chatId: string;
            messages: StoredMessage[];
            alreadyStored?: boolean;
        }>(),
    ),
    loadChatMessagesSuccess: createAction(
        '[ CHAT ] load messages success',
        props<{ chatId: string; chatType: ChatType; messages: StoredMessage[] }>(),
    ),

    loadChatData: createAction('[ CHAT ] load chat data', props<{ chatId: string; chatType: ChatType }>()),
    loadChatDataSuccess: createAction(
        '[ CHAT ] load chat data succcess',
        props<{ chatId: string; data: ChatGroup | FriendshipData }>(),
    ),
    addMemberToGroup: createAction('[ CHAT GROUP ] add member', props<{ chatId: string; newMember: UserPreview }>()),

    createChat: createAction('[ CHAT GROUP ] create chat', props<{ title: string }>()),
    createChatSuccess: createAction('[ CHAT GROUP ] create chat success', props<{ createdChat: ChatGroupPreview }>()),

    joinChatSuccess: createAction('[ CHAT GROUP ] join chat success', props<{ chat: ChatGroupPreview }>()),

    // friendship + invitation CRUD

    newInvitationReceived: createAction(
        '[ FRIENDSHIP ] new invitation received',
        props<{ invitation: FriendshipInvitation }>(),
    ),
    loadReceivedInvitations: createAction(
        '[ FRIENDSHIP ] load received invitations',
        props<{ statusFilter: InvitationStatus }>(),
    ),
    loadReceivedInvitation: createAction(
        '[ FRIENDSHIP ] load received invitation from id',
        props<{ invitationId: string }>(),
    ),
    loadReceivedInvitationsSuccess: createAction(
        '[ FRIENDSHIP ] load received invitations success',
        props<{ invitations: ReceivedFriendshipInvitation[]; statusFilter: InvitationStatus }>(),
    ),
    loadReceivedInvitationsError: createAction('[ FRIENDSHIP ] load invitations error'),
    respondToInvitation: createAction(
        '[ FRIENDSHIP ] respond to invitation',
        props<{ invitationId: string; response: InvitationResponse }>(),
    ),
    respondToInvitationSuccess: createAction(
        '[ FRIENDSHIP ] respond to invitation success',
        props<{
            chatPreview?: ChatPreview;
            invitationId: string;
            invitationResponse: InvitationResponse;
        }>(),
    ),

    loadSentInvitations: createAction('[ FRIENDSHIP ] load sent invitations'),
    loadSentInvitationsSuccess: createAction(
        '[ FRIENDSHIP ] load sent invitations success',
        props<{ invitations: SentFriendshipInvitation[] }>(),
    ),
    loadSentInvitationsError: createAction('[ FRIENDSHIP ] load sent invitations error'),

    sendInvitation: createAction('[ FRIENDSHIP ] send invitation', props<{ userId: string }>()),
    sendInvitationSuccess: createAction(
        '[ FRIENDSHIP ] send invitation success',
        props<SendFriendshipInvitationResponse>(),
    ),

    deleteInvitation: createAction('[ FRIENDSHIP ] delete invitation', props<{ invitationId: string }>()),
    deleteInvitationSuccess: createAction(
        '[ FRIENDSHIP ] delete invitation success',
        props<{ invitationId: string }>(),
    ),

    setUserOnlineStatus: createAction(
        '[ OTHER USERS ] set online status',
        props<{ userId: string; isOnline: boolean }>(),
    ),

    // loadUserDetails: createAction('[ OTHER USERS ] load details', props<{ userId: string }>()),
    // loadUserDetailsSuccess: createAction(
    //     '[ OTHER USERS ] load details success',
    //     props<{ userId: string; userDetails: UserDetails }>(),
    // ),
};
