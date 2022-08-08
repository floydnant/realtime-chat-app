import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { UserService } from 'src/app/services/user.service';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { chatsSelectors } from 'src/app/store/chat/chat.selector';
import { ChatType, InvitationStatus, InvitationResponse, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'app-invites',
    templateUrl: './invites.component.html',
    styleUrls: ['./invites.component.scss'],
})
export class InvitesComponent implements OnInit {
    constructor(private store: Store<AppState>, private userService: UserService) {}

    async ngOnInit() {
        this.loadReceivedInvitations();
        this.loadSentInvitations();
    }

    InvitationStatus = InvitationStatus;
    InvitationResponse = InvitationResponse;

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
}
