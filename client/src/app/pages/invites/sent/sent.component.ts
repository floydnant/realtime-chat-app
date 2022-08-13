import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { UserService } from 'src/app/services/user.service';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { InvitationStatus, InvitationResponse, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'app-sent',
    templateUrl: './sent.component.html',
    styleUrls: ['./sent.component.scss'],
})
export class SentComponent implements OnInit {
    constructor(private store: Store<AppState>, private userService: UserService) {}

    async ngOnInit() {
        this.loadSentInvitations();
    }

    InvitationStatus = InvitationStatus;
    InvitationResponse = InvitationResponse;

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
