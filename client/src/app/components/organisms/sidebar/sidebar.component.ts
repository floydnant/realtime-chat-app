import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatService } from 'src/app/services/chat.service';
import { chatsActions } from 'src/app/store/chats/chats.actions';
import { chatsSelectors } from 'src/app/store/chats/chats.selector';
import { AppState } from 'src/app/store/app.reducer';
import { userActions } from 'src/app/store/user/user.actions';
import { ChatType, InvitationResponse, InvitationStatus, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
    constructor(private store: Store<AppState>, private chatService: ChatService) {}

    async ngOnInit() {
        this.store.dispatch(chatsActions.loadChatPreviews());
        this.loadReceivedInvitations()
    }

    ChatType = ChatType;
    InvitationStatus = InvitationStatus
    InvitationResponse = InvitationResponse

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    activeChatId$ = this.store.select(state => state.chats.activeChatId);

    chatPreviews$ = this.store.select(chatsSelectors.selectChatPreviews);
    loadingChatPreviews$ = this.store.select(state => state.chats.loadingChatPreviews);
    
    receivedInvitations$ = this.store.select(state => state.chats.receivedInvitations);
    receivedInvitationsFilter: InvitationStatus = InvitationStatus.PENDING
    loadReceivedInvitations(filter?: InvitationStatus) {
        if (filter) this.receivedInvitationsFilter = filter
        this.store.dispatch(chatsActions.loadReceivedInvitations({ statusFilter: this.receivedInvitationsFilter }));
    }
    respondToInvitation(invitationId: string, response: InvitationResponse) {
        this.store.dispatch(chatsActions.respondToInvitation({ invitationId, response }));
    }

    sendInvitation(userId: string) {
        this.store.dispatch(chatsActions.sendInvitation({ userId }))
    }
    sentInvitations$ = this.store.select(state => state.chats.sentInvitations)
    loadSentInvitations() {
        this.store.dispatch(chatsActions.loadSentInvitations())
    }
    deleteInvitation(invitationId: string) {
        this.store.dispatch(chatsActions.deleteInvitation({ invitationId }))
    }

    userSearchResult?: UserSearchResult[]
    loadingSearchResults = false
    async searchUsers(query: string) {
        this.loadingSearchResults = true
        this.userSearchResult = await this.chatService.searchUsers(query)
        this.loadingSearchResults = false
    }

    setChatActive(chatId: string) {
        this.store.dispatch(chatsActions.setActiveChat({ chatId }));
    }

    createChat() {
        const title = prompt('Type in the new chat title.')?.trim();
        if (!title) return;
        this.store.dispatch(chatsActions.createChat({ title }));
    }

    joinGlobalChat() {
        this.chatService.joinGlobalChat();
    }

    logout() {
        this.store.dispatch(userActions.logout());
    }
}
