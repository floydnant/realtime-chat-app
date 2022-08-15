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
            iconClass: 'fas fa-envelope',
            keybinding: 'I',
        },
        {
            label: 'Chats',
            route: '/chat',
            iconClass: 'fas fa-comments-alt',
            keybinding: 'C',
        },
        {
            label: 'Account',
            disabled: true,
            iconClass: 'fas fa-user',
            keybinding: 'A',
        },
        {
            label: 'Settings',
            disabled: true,
            iconClass: 'fas fa-cog',
            keybinding: 'S',
        },
        {
            label: 'Request a Feature',
            disabled: true,
            iconClass: 'fas fa-rocket-launch',
        },
        {
            label: 'Report a Bug',
            disabled: true,
            iconClass: 'fas fa-bug',
        },
        {
            label: '',
            type: MenuItemType.SEPERATOR,
            iconClass: '',
        },
        {
            label: 'Logout',
            action: () => this.logout(),
            type: MenuItemType.DANGER,
            iconClass: 'fas fa-sign-out-alt',
        },
    ];
}
