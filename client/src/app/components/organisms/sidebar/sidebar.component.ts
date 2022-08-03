import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { UserService } from 'src/app/services/user.service';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { chatsSelectors } from 'src/app/store/chat/chat.selector';
import { userActions } from 'src/app/store/user/user.actions';
import { ChatType, InvitationResponse, InvitationStatus, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
    constructor(
        private store: Store<AppState>,
        private chatGroupService: ChatGroupService,
        private userService: UserService,
    ) {}

    async ngOnInit() {
        this.store.dispatch(chatActions.loadChatPreviews());
        this.loadReceivedInvitations();
    }

    ChatType = ChatType;
    InvitationStatus = InvitationStatus;
    InvitationResponse = InvitationResponse;

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    activeChatId$ = this.store.select(state => state.chats.activeChatId);

    chatPreviews$ = this.store.select(chatsSelectors.selectChatPreviews);
    loadingChatPreviews$ = this.store.select(state => state.chats.loadingChatPreviews);

    receivedInvitations$ = this.store.select(state => state.chats.receivedInvitations);
    receivedInvitationsFilter: InvitationStatus = InvitationStatus.PENDING;
    loadReceivedInvitations(filter?: InvitationStatus) {
        if (filter) this.receivedInvitationsFilter = filter;
        this.store.dispatch(chatActions.loadReceivedInvitations({ statusFilter: this.receivedInvitationsFilter }));
    }
    respondToInvitation(invitationId: string, response: InvitationResponse) {
        this.store.dispatch(chatActions.respondToInvitation({ invitationId, response }));
    }

    sendInvitation(userId: string) {
        this.store.dispatch(chatActions.sendInvitation({ userId }));
    }
    sentInvitations$ = this.store.select(state => state.chats.sentInvitations);
    loadSentInvitations() {
        this.store.dispatch(chatActions.loadSentInvitations());
    }
    deleteInvitation(invitationId: string) {
        this.store.dispatch(chatActions.deleteInvitation({ invitationId }));
    }

    userSearchResult?: UserSearchResult[];
    loadingSearchResults = false;
    async searchUsers(query: string) {
        this.loadingSearchResults = true;
        this.userSearchResult = await this.userService.searchUsers(query);
        this.loadingSearchResults = false;
    }

    setChatActive(chatId: string) {
        this.store.dispatch(chatActions.setActiveChat({ chatId }));
    }

    createChat() {
        const title = prompt('Type in the new chat title.')?.trim();
        if (!title) return;
        this.store.dispatch(chatActions.createChat({ title }));
    }

    joinGlobalChat() {
        this.chatGroupService.joinGlobalChat();
    }

    logout() {
        this.store.dispatch(userActions.logout());
    }
}
