import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ChatService } from 'src/app/services/chat.service';
import { chatsActions } from 'src/app/store/chats/chats.actions';
import { ChatRoomPreview } from 'src/app/store/chats/chats.model';
import { AppState } from 'src/app/store/index.reducer';
import { chatsSelectors } from 'src/app/store/chats/chats.selector';

@Component({
    selector: 'sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
    constructor(private store: Store<AppState>, private chatService: ChatService) {}

    activeChatId$ = this.store.select(state => state.chats.activeChatId);
    chatPreviews$ = this.store.select(chatsSelectors.selectChatPreviews);

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

    async ngOnInit() {
        this.store.dispatch(chatsActions.loadChatPreviews());
    }
}
