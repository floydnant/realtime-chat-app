import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatService } from 'src/app/services/chat.service';
import { chatsActions } from 'src/app/store/chats/chats.actions';
import { chatsSelectors } from 'src/app/store/chats/chats.selector';
import { AppState } from 'src/app/store/app.reducer';
import { userActions } from 'src/app/store/user/user.actions';
import { ChatType, InvitationStatus, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
    constructor(private store: Store<AppState>, private chatService: ChatService) {}

    ChatType = ChatType;

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    activeChatId$ = this.store.select(state => state.chats.activeChatId);

    chatPreviews$ = this.store.select(chatsSelectors.selectChatPreviews);
    loadingChatPreviews$ = this.store.select(state => state.chats.loadingChatPreviews);
    
    invitations$ = this.store.select(state => state.chats.invitationsReceived);
    loadingInvitations$ = this.store.select(state => state.chats.loadingInvitationsReceived);
    invitationsFilter: InvitationStatus = InvitationStatus.PENDING
    InvitationStatus = InvitationStatus

    userSearchResult?:  UserSearchResult[]
    async searchUsers(query: string) {
        this.userSearchResult = await this.chatService.searchUsers(query)
    }

    sendFriendInvitation(userId: string) {
        this.chatService.sendFriendshipInvitation(userId)
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

    loadInvitations(filter?: InvitationStatus) {
        if (filter) this.invitationsFilter = filter
        this.store.dispatch(chatsActions.loadFriendshipInvitations({ statusFilter: this.invitationsFilter }));
    }
    respondToInvitation(invitationId: string, response: 'accept' | 'decline') {
        this.store.dispatch(chatsActions.respondToInvitation({ invitationId, response }));
    }

    async ngOnInit() {
        this.store.dispatch(chatsActions.loadChatPreviews());
        this.loadInvitations()
    }
}
