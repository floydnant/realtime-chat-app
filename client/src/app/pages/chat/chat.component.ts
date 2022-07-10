import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { interval, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { ChatsState, StoredChatMessage } from 'src/app/store/chats/chats.model';
import { LoggedInUser } from 'src/app/store/user/user.model';
import { AppState } from 'src/app/store/app.reducer';
import { chatsSelectors } from 'src/app/store/chats/chats.selector';
import { escapeHTML, getCopyOf, moveToMacroQueue } from 'src/app/utils';
import { Server_ChatMessagePayload, Server_UserOnlineStatusEventPayload } from 'src/shared/chat-event-payloads.model';
import { UserPreview } from 'src/shared/index.model';
import { MessageTypes } from 'src/shared/message-types.model';
import { SocketEvents } from 'src/shared/socket-events.model';

export interface UserOnlineStatusEventMessage {
    text: string;
    user: UserPreview;

    messageType: MessageTypes.USER_EVENT;
    timestamp: string;
}
export interface UserOnlineStatusEvent {
    online: boolean;
    user: UserPreview;

    messageType: MessageTypes.USER_EVENT;
    timestamp: string;
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnDestroy, AfterViewInit {
    constructor(private chatService: ChatService, private store: Store<AppState>, private router: Router) {
        store.subscribe(({ user, chats }) => {
            if (!user) this.router.navigate(['/auth/login']);

            this.user = user.loggedInUser;
            this.chatsState = chats;
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    chatsState: ChatsState;
    user: LoggedInUser | null;
    activeChat$ = this.store.select(chatsSelectors.selectActiveChat);

    MessageTypes = MessageTypes;

    // TODO: use the generic content editable component from todo app
    @ViewChild('chatRef') chatRef: ElementRef<HTMLDivElement>;
    @ViewChild('messageInput') messageInput: ElementRef<HTMLDivElement>;
    ngAfterViewInit() {
        this.messageInput.nativeElement.addEventListener('DOMCharacterDataModified', () =>
            this.pullMessageInputChanges(),
        );

        const observer = new MutationObserver(() => {
            this.pullMessageInputChanges();
        });

        observer.observe(this.messageInput.nativeElement, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    }
    @HostListener('document:keydown', ['$event'])
    focusMessageInput(e: KeyboardEvent) {
        if (e.key == 'm') moveToMacroQueue(() => this.messageInput.nativeElement.focus());
    }

    _newMessage: string;
    pullMessageInputChanges() {
        if (this.messageInput.nativeElement.innerText.trim()) {
            this.typingHandler();
            this._newMessage = this.messageInput.nativeElement.innerHTML.trim();
        } else this._newMessage = '';
    }
    get newMessage() {
        return this._newMessage;
    }
    set newMessage(value) {
        this._newMessage = value;
        moveToMacroQueue(() => (this.messageInput.nativeElement.innerHTML = value));
    }

    typingHandler() {
        this.chatService.typingHandler();
    }

    usersTypingText$ = this.chatService.getUsersTyping().pipe(
        map(usersTyping => {
            if (usersTyping.length == 0) return '';

            const usersTypingText = `${usersTyping
                .map(u => `<span class="secondary-100">${escapeHTML(u)}</span>`)
                .join(', ')} ${usersTyping.length > 1 ? 'are' : 'is'} typing`;

            return usersTypingText;
        }),
        tap(() => this.scrollToBottom()),
    );

    usersOnlineText$ = this.chatService.getUsersOnline().pipe(
        map(usersOnline =>
            (usersOnline || [])
                .filter(u => u != this.user?.username)
                .map(u => `<span class="secondary-100">${escapeHTML(u)}</span>`)
                .join(', '),
        ),
    );

    private _userMessages_ = this.handleSubscription(
        this.chatService.getUserEvents().subscribe(({ user, online }) => {
            this.addMessageToChat({
                user,
                online,
                messageType: MessageTypes.USER_EVENT,
                timestamp: new Date().toString(),
            });
        }),
    );
    private _chatMessages_ = this.handleSubscription(
        this.chatService.getChatInitializationUpdates().subscribe(messages => {
            this.messages = getCopyOf(messages);
            this.scrollToBottom();
        }),
        this.chatService.getChatMessageUpdates().subscribe(({ message }) => {
            this.addMessageToChat(message);
            this.scrollToBottom();
        }),
    );

    private subscriptions: Subscription[];
    private handleSubscription(...subs: Subscription[]) {
        const prevSubs = this.subscriptions || [];
        this.subscriptions = [...prevSubs, ...subs];
    }

    async sendMessage() {
        if (!this.newMessage || !this.user) return;

        this.chatService.sendMessage({ messageText: this.newMessage, chatId: this.chatsState.activeChatId! });

        this.newMessage = '';
    }
    messageSubmitHandler(e: Event) {
        if (!(e as KeyboardEvent).shiftKey) {
            e.stopPropagation();
            this.sendMessage();
        }
    }

    messages: (StoredChatMessage | UserOnlineStatusEventMessage)[] = [];
    addMessageToChat({ ...message }: StoredChatMessage | UserOnlineStatusEvent) {
        // text = escapeHTML(text);

        let text: string;

        if (message.messageType == MessageTypes.USER_EVENT) {
            // const matchBeforeQuotes = text.match(/[\w\d\s]+(?=&apos;|')/g);
            // const secondUsername = (matchBeforeQuotes || ['', ''])[1];
            const { user, online } = message;
            text = `<span class="secondary-100">${user.username}</span> went ${
                online ? '<span class="primary-100">online</span>' : 'offline'
            }`;

            // text = text
            //     .replace(/.+(?=\s+went|changed)/, m => `<span class="secondary-100">${m}</span>`)
            //     .replace(/online/, `<span class="primary-100">online</span>`);
            // if (secondUsername)
            //     text = text.replace(new RegExp(secondUsername, 'g'), m => `<span class="secondary-100">${m}</span>`);
        } else
            text = message.text.replace(
                /https?:\/\/([^\s"/,;:]+\.)+[^\s",;:]+/g,
                match => `<a href="${match}" target="_blank">${match}</a>`,
            );

        this.messages.push({ ...message, text });
        this.scrollToBottom();
    }
    scrollToBottom() {
        moveToMacroQueue(() => (this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight + 20));
    }
}
