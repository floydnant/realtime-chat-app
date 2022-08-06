import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { Store } from '@ngrx/store';
import { ChatGroupPreview } from 'src/shared/index.model';
import { handleError } from '../store/app.effects';
import { AppState } from '../store/app.reducer';
import { chatActions } from '../store/chat/chat.actions';
import { ChatPreview } from '../store/chat/chat.model';
import { BaseHttpClient } from './base-http-client.service';

@Injectable({
    providedIn: 'root',
})
export class ChatGroupService {
    constructor(private http: BaseHttpClient, private toastService: HotToastService, private store: Store<AppState>) {}

    // getChat(chatId: string) {
    //     return this.httpClient.get<ChatRoomApiResponse>('/chats/chat/' + chatId);
    // }

    createChat(title: string) {
        return this.http.post<ChatGroupPreview>('/chats/chat', { title });
    }

    getJoinedChats() {
        return this.http.get<ChatPreview[]>('/chat-previews');
    }

    getGlobalChatPreview() {
        return this.http.get<ChatGroupPreview>('/chats/globalChat');
    }

    // TODO: this should be managed through the effects
    joinGlobalChat() {
        return this.http
            .post<{ successMessage: string; chatRoom: ChatGroupPreview }>('/chats/globalChat/join')
            .subscribe(chatRoomResOrError => {
                const action = handleError(chatRoomResOrError, chatRoomRes => {
                    this.toastService.success(`You joined '${chatRoomRes.chatRoom.title}'`);
                    return chatActions.joinChatSuccess({ chat: chatRoomRes.chatRoom });
                });
                this.store.dispatch(action);
            });
    }
}
