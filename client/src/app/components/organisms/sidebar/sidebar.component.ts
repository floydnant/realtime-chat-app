import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatGroupService } from 'src/app/services/chat-group.service';
import { UserService } from 'src/app/services/user.service';
import { AppState } from 'src/app/store/app.reducer';
import { chatActions } from 'src/app/store/chat/chat.actions';
import { ChatPreview } from 'src/app/store/chat/chat.model';
import { chatsSelectors } from 'src/app/store/chat/chat.selector';
import { userActions } from 'src/app/store/user/user.actions';
import { ChatType, InvitationResponse, InvitationStatus, UserSearchResult } from 'src/shared/index.model';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
    constructor(private store: Store<AppState>, private chatGroupService: ChatGroupService) {}

    async ngOnInit() {
        this.store.dispatch(chatActions.loadChatPreviews());
    }

    ChatType = ChatType;

    loggedInUser$ = this.store.select(state => state.user.loggedInUser);
    activeChatId$ = this.store.select(state => state.chats.activeChatId);

    chatPreviews$ = this.store.select(chatsSelectors.selectChatPreviews);
    loadingChatPreviews$ = this.store.select(state => state.chats.loadingChatPreviews);

    isMemberOfGlobalGroup(chatPreviews: ChatPreview[] | null) {
        return chatPreviews?.some(c => c.title == 'Global Group Chat');
    }

    setChatActive(chatId: string) {
        this.store.dispatch(chatActions.setActiveChat({ chatId }));
    }

    // needs to be an arrow function to retain `this`
    createChat = () => {
        const title = prompt('Type in the new chat title.')?.trim();
        if (!title) return;
        this.store.dispatch(chatActions.createChat({ title }));
    };

    joinGlobalChat() {
        this.chatGroupService.joinGlobalChat();
    }
}
