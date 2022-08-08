import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { userActions } from 'src/app/store/user/user.actions';
import { InvitationStatus } from 'src/shared/index.model';

@Component({
    selector: 'user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit {
    constructor(private store: Store<AppState>) {}

    ngOnInit(): void {
        this.store.dispatch(chatActions.loadReceivedInvitations({ statusFilter: InvitationStatus.PENDING }));
    }

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    logout() {
        this.store.dispatch(userActions.logout());
    }

    pendingInvitationsCount$ = this.store.select(state => state.chats.receivedInvitations.pending?.length);
}
