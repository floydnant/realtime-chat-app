import { Injectable } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { Client_ChatMessagePayload } from 'src/shared/chat-event-payloads.model';
import { ChatGroup, ChatType, FriendshipData } from 'src/shared/index.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { AppState } from '../store/app.reducer';
import { chatActions } from '../store/chat/chat.actions';
import { ChatsState, StoredMessage } from '../store/chat/chat.model';
import { LoggedInUser } from '../store/user/user.model';
import { debounce, moveToMacroQueue } from '../utils';
import { BaseHttpClient } from './base-http-client.service';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(
        private socket: SocketService,
        private store: Store<AppState>,
        private httpClient: BaseHttpClient,
        private actions$: Actions,
    ) {
        store.subscribe(state => {
            this.user = state.user.loggedInUser;
            this.chatState = state.chats;
        });
    }

    private chatState: ChatsState;
    private user: LoggedInUser | null;

    // own typing events
    private isTyping = false;
    private emitStopTypingDebounced = debounce(() => this.emitTyping(false), 2000);
    private emitTyping(isTyping: boolean) {
        this.socket.emit(SocketEvents.CLIENT__TYPING_EVENT, { isTyping, chatId: this.chatState.activeChatId! });
        this.isTyping = isTyping;
    }
    typingHandler() {
        if (!this.user) return;

        if (!this.isTyping) this.emitTyping(true);

        this.emitStopTypingDebounced();
    }

    // users typing
    private usersTypingForActiveChat = new Subject<string[]>();
    getUsersTyping() {
        return this.usersTypingForActiveChat.asObservable();
    }
    private usersTypingMap: { [chatId: string]: string[] } = {};
    private usersTypingEvents = this.socket
        .fromEvent(SocketEvents.SERVER__TYPING_EVENT)
        .pipe(
            tap(({ username, isTyping, chatId }) => {
                if (isTyping) this.usersTypingMap[chatId] = [...(this.usersTypingMap[chatId] || []), username];
                else this.usersTypingMap[chatId] = (this.usersTypingMap[chatId] || []).filter(u => u != username);
            }),
            filter(({ chatId }) => chatId == this.chatState.activeChatId),
        )
        .subscribe(({ chatId }) => this.usersTypingForActiveChat.next(this.usersTypingMap[chatId] || []));

    // users online
    private usersOnlineEvents = this.socket
        .fromEvent(SocketEvents.SERVER__USERS_ONLINE)
        .subscribe(({ usersOnline }) => {
            // @TODO: handle this with one action instead of dipatching the same one multiple times
            usersOnline.forEach(id => {
                this.store.dispatch(chatActions.setUserOnlineStatus({ userId: id, isOnline: true }));
            });
        });

    private setActiveChatEvents = this.actions$
        .pipe(ofType(chatActions.setActiveChatSuccess))
        .subscribe(({ chatId }) => {
            this.usersTypingForActiveChat.next(this.usersTypingMap[chatId] || []);
        });

    sendMessage(payload: Client_ChatMessagePayload) {
        if (!this.user) return;

        moveToMacroQueue(() => this.emitTyping(false));
        this.socket.emit(SocketEvents.CLIENT__CHAT_MESSAGE, payload);
    }
    getChatMessageUpdates() {
        return this.socket.fromEvent(SocketEvents.SERVER__CHAT_MESSAGE).pipe(
            tap(payload => this.store.dispatch(chatActions.newMessage(payload))),
            filter(({ chatId }) => chatId == this.chatState.activeChatId),
        );
    }

    getChatInitializationUpdates() {
        return this.actions$.pipe(
            ofType(chatActions.loadActiveChatMessagesSuccess),
            map(({ messages }) => messages),
        );
    }

    // this is later also gonna contain join, leave, etc. events
    getUserEvents() {
        return this.socket.fromEvent(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT).pipe(
            tap(({ user, online }) => {
                this.store.dispatch(chatActions.setUserOnlineStatus({ userId: user.id, isOnline: online }));
            }),
            filter(({ chatIds }) => chatIds.some(id => id == this.chatState.activeChatId)),
        );
    }

    // CRUD stuff
    getChatMessages(chatId: string, chatType: ChatType) {
        const messages = this.httpClient.get<StoredMessage[]>(
            chatType == 'group' ? `/chats/chat/${chatId}/messages` : `/friendships/${chatId}/messages`,
        );
        return messages;
    }

    getChatData({ chatId, chatType }: { chatId: string; chatType: ChatType }) {
        return this.httpClient.get<ChatGroup | FriendshipData>(
            chatType == 'group' ? `/chats/chat/${chatId}/data` : `/friendships/${chatId}/data`,
        );
    }
}
