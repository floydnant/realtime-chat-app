import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from 'src/app/services/chat.service';
import { AppState } from 'src/app/store/app.reducer';
import { ChatPreview, ChatsState, StoredMessage } from 'src/app/store/chat/chat.model';
import { chatsSelectors } from 'src/app/store/chat/chat.selector';
import { LoggedInUser } from 'src/app/store/user/user.model';
import { escapeHTML, getCopyOf, moveToMacroQueue } from 'src/app/utils';
import { ChatType, MessageTypes, UserPreview } from 'src/shared/index.model';
import { DatePipe } from '@angular/common';

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
    constructor(
        private chatService: ChatService,
        private store: Store<AppState>,
        private router: Router,
        private datePipe: DatePipe,
    ) {
        store.subscribe(({ user, chats }) => {
            if (!user) this.router.navigate(['/auth/login']);

            this.user = user.loggedInUser;
            this.chatsState = chats;
        });
        this.store.select(chatsSelectors.selectActiveChat).subscribe(chat => (this.activeChat = chat));
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    chatsState: ChatsState;
    user: LoggedInUser | null;
    activeChat: ChatPreview | null;

    MessageTypes = MessageTypes;
    ChatType = ChatType;

    isSameDay(ts1: string, ts2: string) {
        return this.getDay(ts1, ts2) == 'Today';
    }
    getDay(ts: string, ts2?: string) {
        const date = new Date(ts);
        const today = ts2 ? new Date(ts2) : new Date();

        const isSameYear = date.getFullYear() == today.getFullYear();
        const isSameMonth = date.getMonth() == today.getMonth();

        if (!isSameYear) return this.datePipe.transform(date, 'fullDate');
        if (!isSameMonth) return this.datePipe.transform(date, 'EEEE, MMMM d');

        const dateDifference = today.getDate() - date.getDate();
        return dateDifference == 0
            ? 'Today'
            : dateDifference == 1
            ? 'Yesterday'
            : this.datePipe.transform(date, 'EEEE, MMMM d');
    }

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
                .map(u => `<span class="text-secondary-200">${escapeHTML(u)}</span>`)
                .join(', ')} ${usersTyping.length > 1 ? 'are' : 'is'} typing`;

            return usersTypingText;
        }),
    );

    usersOnlineText$ = this.chatService.getUsersOnline().pipe(
        map(usersOnline => {
            const users = (usersOnline || []).filter(u => u != this.user?.username);
            if (this.activeChat?.chatType == ChatType.PRIVATE)
                return users.length > 1
                    ? '<span class="text-primary-400">online</span>'
                    : '<span class="text-gray-300">offline</span>';

            return users.map(u => `<span class="text-primary-400">${escapeHTML(u)}</span>`).join(', ');
        }),
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

    messages: (StoredMessage | UserOnlineStatusEventMessage)[] = [];
    addMessageToChat({ ...message }: StoredMessage | UserOnlineStatusEvent) {
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
