import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { userActions } from 'src/app/store/user/user.actions';
import { InvitationStatus } from 'src/shared/index.model';
import { MenuItem, MenuItemType } from '../../atoms/menu-item/types';

@Component({
    selector: 'user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit {
    constructor(private store: Store<AppState>) {
        this.store
            .select(state => state.chats.receivedInvitations.pending?.length)
            .subscribe(count => {
                this.pendingInvitationsCount = count || 0;
                this.menuItems[0].badge = count;
            });
    }

    ngOnInit(): void {
        this.store.dispatch(chatActions.loadReceivedInvitations({ statusFilter: InvitationStatus.PENDING }));
    }

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    logout() {
        this.store.dispatch(userActions.logout());
    }

    pendingInvitationsCount: number = 0;

    menuItems: MenuItem[] = [
        {
            label: 'Invitations',
            route: '/invites',
            badge: 0,
        },
        {
            label: 'Chats',
            route: '/chat',
        },
        {
            label: 'Account',
            disabled: true,
        },
        {
            label: 'Settings',
            disabled: true,
        },
        {
            label: 'Request a Feature',
            disabled: true,
        },
        {
            label: 'Report a Bug',
            disabled: true,
        },
        {
            label: '',
            type: MenuItemType.SEPERATOR,
        },
        {
            label: 'Logout',
            action: () => this.logout(),
            type: MenuItemType.DANGER,
        },
    ];
}
