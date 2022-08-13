import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { InvitationResponse, InvitationStatus } from 'src/shared/index.model';

@Component({
    selector: 'app-received',
    templateUrl: './received.component.html',
    styleUrls: ['./received.component.scss'],
})
export class ReceivedComponent implements OnInit {
    constructor(private store: Store<AppState>) {}

    async ngOnInit() {
        this.loadReceivedInvitations();
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

    deleteInvitation(invitationId: string) {
        this.store.dispatch(chatActions.deleteInvitation({ invitationId }));
    }
}
