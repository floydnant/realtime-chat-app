import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import {
    Client_ChatMessagePayload,
    Server_ChatMessagePayload,
    Server_UserOnlineStatusEventPayload,
} from 'src/shared/chat-event-payloads.model';
import { EventName, EventPayload, SocketEventPayloadAsFnMap } from 'src/shared/event-payload-map.model';
import { MessageTypes } from 'src/shared/message-types.model';
import { SocketEvents } from 'src/shared/socket-events.model';
import { globalActions } from '../store/actions';
import { chatsActions } from '../store/actions/chats.actions';
import { handleError } from '../store/effects';
import { ChatRoomApiResponse, ChatRoomPreview, ChatsState, StoredChatMessage } from '../store/models/chats.model';
import { UserState } from '../store/models/user.model';
import { AppState } from '../store/reducers';
import { debounce, moveToMacroQueue } from '../utils';
import { BaseHttpClient } from './base-http-client.service';

class TypedSocket {
    constructor(private socket: Socket) {}
    on<K extends EventName>(eventName: K, cb: SocketEventPayloadAsFnMap[K]) {
        return this.socket.on(eventName, cb);
    }
    // this guy seems to create some problems, so we don't care about typesafety there
    once<K extends EventName>(eventName: K, cb: (answer: any) => void /* SocketEventPayloadAsFnMap[K] */) {
        return this.socket.once(eventName, cb);
    }
    emit<K extends EventName>(eventName: K, payload: EventPayload<K>) {
        return this.socket.emit(eventName, payload);
    }
    fromEvent<K extends EventName, T = EventPayload<K>>(eventName: K) {
        return this.socket.fromEvent<T>(eventName);
    }
}

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private socket = new TypedSocket(this.untypedSocket);
    constructor(
        private untypedSocket: Socket,
        private store: Store<AppState>,
        private router: Router,
        private httpClient: BaseHttpClient,
        private actions$: Actions,
    ) {
        store.subscribe(state => {
            this.user = state.user;
            this.chatState = state.chats;
        });

        this.socket.on(SocketEvents.SERVER__AUTHENTICATE_PROMPT, () => this.authenticateSocket());
    }

    private chatState: ChatsState;
    private user: UserState;

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
    private usersOnlineForActiveChat = new Subject<string[]>();
    getUsersOnline() {
        return this.usersOnlineForActiveChat.asObservable().pipe(map(usersOnline => ['You', ...usersOnline]));
    }
    private usersOnlineMap: { [chatId: string]: string[] } = {};
    private usersOnlineEvents = this.socket
        .fromEvent(SocketEvents.SERVER__USERS_ONLINE)
        .pipe(
            tap(({ chatId, usersOnline }) => {
                this.usersOnlineMap[chatId] = usersOnline;
            }),
            filter(({ chatId }) => chatId == this.chatState.activeChatId),
        )
        .subscribe(({ usersOnline }) => this.usersOnlineForActiveChat.next(usersOnline));

    private setActiveChatEvents = this.actions$.pipe(ofType(chatsActions.setActiveChat)).subscribe(({ chatId }) => {
        this.usersOnlineForActiveChat.next(this.usersOnlineMap[chatId] || []);
        this.usersTypingForActiveChat.next(this.usersTypingMap[chatId] || []);
    });

    sendMessage(payload: Client_ChatMessagePayload) {
        if (!this.user) return;

        moveToMacroQueue(() => this.emitTyping(false));
        this.socket.emit(SocketEvents.CLIENT__CHAT_MESSAGE, payload);
    }
    getChatMessageUpdates() {
        return this.socket.fromEvent(SocketEvents.SERVER__CHAT_MESSAGE).pipe(
            tap(payload => this.store.dispatch(chatsActions.newMessage(payload))),
            filter(({ chatId }) => chatId == this.chatState.activeChatId),
        );
    }

    getChatInitializationUpdates() {
        return this.actions$.pipe(
            ofType(chatsActions.loadActiveChatMessagesSuccess),
            map(({ messages }) => messages),
        );
    }

    // this is later also gonna contain join, leave, etc. events
    getUserEvents() {
        return this.socket
            .fromEvent(SocketEvents.SERVER__USER_ONLINE_STATUS_EVENT)
            .pipe(filter(({ chatIds }) => chatIds.some(id => id == this.chatState.activeChatId)));
    }

    private async authenticateSocket() {
        if (this.user) {
            const { authenticated } = await this.requestOneTimeResponse({
                reqEvent: SocketEvents.CLIENT__AUTHENTICATE,
                payload: { accessToken: this.user.accessToken },
                resEvent: SocketEvents.SERVER__AUTHENTICATE,
            });
            if (!authenticated) this.router.navigate(['/auth/login']);
        } else this.router.navigate(['/auth/login']);
    }

    private requestOneTimeResponse<K extends EventName, R extends EventName = K>({
        reqEvent,
        payload,
        resEvent = reqEvent,
    }: {
        reqEvent: K;
        payload: EventPayload<K>;
        resEvent?: R | K;
    }) {
        return new Promise<EventPayload<R>>(res => {
            this.socket.emit(reqEvent, payload);
            this.socket.once(resEvent, (answer: EventPayload<R>) => res(answer));
        });
    }

    // CRUD stuff
    getChat(chatId: string) {
        return this.httpClient.get<ChatRoomApiResponse>('/chats/chat/' + chatId);
    }
    getChatMessages(chatId: string) {
        return this.httpClient.get<StoredChatMessage[]>(`/chats/chat/${chatId}/messages`);
    }

    createChat(title: string) {
        return this.httpClient.post<ChatRoomPreview>('/chats/chat', { title });
    }

    getJoinedChats() {
        return this.httpClient.get<ChatRoomPreview[]>('/chats/joined');
    }

    getGlobalChatPreview() {
        return this.httpClient.get<ChatRoomPreview>('/chats/globalChat');
    }

    joinGlobalChat() {
        return this.httpClient
            .post<{ successMessage: string; chatRoom: ChatRoomPreview }>('/chats/globalChat/join')
            .subscribe(chatRoomOrError => {
                console.log(chatRoomOrError);
                const action = handleError(chatRoomOrError, chatRoom =>
                    chatsActions.joinChatSuccess({ chat: chatRoom.chatRoom }),
                );
                this.store.dispatch(action);
            });
    }
}
